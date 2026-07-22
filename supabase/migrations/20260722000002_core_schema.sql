-- M2 — Schema applicativo: figli, iscrizioni, deleghe, documenti, audit log,
-- bucket privato "documents". RLS obbligatoria su ogni tabella.

-- Figli: un genitore può averne più di uno, riusabili tra iscrizioni
-- parent_id punta a profiles (a sua volta 1:1 con auth.users): consente le
-- join dichiarative PostgREST enrollments/children -> profiles.
create table public.children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  birth_date date not null,
  fiscal_code text not null,
  school text not null default '',
  grade text not null default '',
  allergies text not null default '',
  medical_notes text not null default '',
  special_needs text not null default '',
  created_at timestamptz not null default now(),
  constraint children_fiscal_code_len check (char_length(fiscal_code) = 16),
  constraint children_first_name_not_empty check (char_length(trim(first_name)) > 0),
  constraint children_last_name_not_empty check (char_length(trim(last_name)) > 0)
);

create type public.enrollment_status as enum (
  'nuova','revisione','documenti-mancanti','attesa-pagamento',
  'confermata','lista-attesa','annullata'
);

-- Codice leggibile tipo ENR-2026-0042
create sequence public.enrollment_code_seq;

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  code text not null unique
    default 'ENR-' || to_char(now(), 'YYYY') || '-' ||
            lpad(nextval('public.enrollment_code_seq')::text, 4, '0'),
  parent_id uuid not null references public.profiles(id),
  child_id uuid not null references public.children(id),
  status public.enrollment_status not null default 'nuova',
  location_slug text not null,
  week_ids text[] not null,
  time_slot text not null,
  extras text[] not null default '{}',
  consent_privacy boolean not null default false,
  consent_photos boolean not null default false,
  consent_outings boolean not null default false,
  consent_rules boolean not null default false,
  consent_data_processing boolean not null default false,
  payment_status text not null default 'non-pagato',
  admin_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint enrollments_weeks_not_empty check (array_length(week_ids, 1) >= 1),
  constraint enrollments_time_slot_not_empty check (char_length(trim(time_slot)) > 0),
  constraint enrollments_payment_status_valid
    check (payment_status in ('non-pagato', 'acconto', 'pagato')),
  -- consensi obbligatori: verificati anche lato server prima dell'insert
  constraint enrollments_required_consents
    check (consent_privacy and consent_rules and consent_data_processing)
);

create or replace function public.set_updated_at()
returns trigger language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger enrollments_updated_at
  before update on public.enrollments
  for each row execute function public.set_updated_at();

create table public.pickup_delegates (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  phone text not null,
  document text not null default ''
);

create type public.document_status as enum ('caricato','verificato','rifiutato');

create table public.enrollment_documents (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  doc_type text not null,
  storage_path text not null,
  file_name text not null,
  size_bytes int not null,
  status public.document_status not null default 'caricato',
  rejection_reason text,
  uploaded_at timestamptz not null default now()
);

-- Log azioni admin (dati di minori: tracciabilità)
create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid not null,
  action text not null,
  entity text not null,
  entity_id text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);

-- RLS ------------------------------------------------------------------------

alter table public.children enable row level security;
alter table public.enrollments enable row level security;
alter table public.pickup_delegates enable row level security;
alter table public.enrollment_documents enable row level security;
alter table public.audit_log enable row level security;

-- children
create policy "genitore gestisce i propri figli" on public.children
  for all using (parent_id = auth.uid()) with check (parent_id = auth.uid());
create policy "admin legge i figli" on public.children
  for select using (public.has_role(auth.uid(), 'admin'));
create policy "staff legge i figli" on public.children
  for select using (public.has_role(auth.uid(), 'staff'));

-- enrollments: il genitore NON ha policy di update — stato, pagamento e note
-- admin cambiano solo tramite admin.
create policy "genitore vede le proprie iscrizioni" on public.enrollments
  for select using (parent_id = auth.uid());
create policy "genitore crea le proprie iscrizioni" on public.enrollments
  for insert with check (
    parent_id = auth.uid()
    and exists (select 1 from public.children c where c.id = child_id and c.parent_id = auth.uid())
  );
create policy "admin vede tutte le iscrizioni" on public.enrollments
  for select using (public.has_role(auth.uid(), 'admin'));
create policy "admin aggiorna le iscrizioni" on public.enrollments
  for update using (public.has_role(auth.uid(), 'admin'));
create policy "staff legge le iscrizioni" on public.enrollments
  for select using (public.has_role(auth.uid(), 'staff'));

-- pickup_delegates
create policy "genitore gestisce i delegati delle proprie iscrizioni" on public.pickup_delegates
  for all using (
    exists (select 1 from public.enrollments e where e.id = enrollment_id and e.parent_id = auth.uid())
  ) with check (
    exists (select 1 from public.enrollments e where e.id = enrollment_id and e.parent_id = auth.uid())
  );
create policy "admin legge i delegati" on public.pickup_delegates
  for select using (public.has_role(auth.uid(), 'admin'));
create policy "staff legge i delegati" on public.pickup_delegates
  for select using (public.has_role(auth.uid(), 'staff'));

-- enrollment_documents: il genitore carica e vede i propri; può eliminare solo
-- documenti non ancora verificati. Verifica/rifiuto passa dall'admin.
create policy "genitore vede i documenti delle proprie iscrizioni" on public.enrollment_documents
  for select using (
    exists (select 1 from public.enrollments e where e.id = enrollment_id and e.parent_id = auth.uid())
  );
create policy "genitore carica documenti sulle proprie iscrizioni" on public.enrollment_documents
  for insert with check (
    exists (select 1 from public.enrollments e where e.id = enrollment_id and e.parent_id = auth.uid())
  );
create policy "genitore elimina documenti non verificati" on public.enrollment_documents
  for delete using (
    status = 'caricato'
    and exists (select 1 from public.enrollments e where e.id = enrollment_id and e.parent_id = auth.uid())
  );
create policy "admin vede tutti i documenti" on public.enrollment_documents
  for select using (public.has_role(auth.uid(), 'admin'));
create policy "admin aggiorna i documenti" on public.enrollment_documents
  for update using (public.has_role(auth.uid(), 'admin'));

-- audit_log: solo admin, append-only
create policy "admin scrive audit log" on public.audit_log
  for insert with check (actor_id = auth.uid() and public.has_role(auth.uid(), 'admin'));
create policy "admin legge audit log" on public.audit_log
  for select using (public.has_role(auth.uid(), 'admin'));

-- Storage: bucket privato "documents" --------------------------------------
-- Percorso: {user_id}/{enrollment_id}/{doc_type}/{file}. Download solo via URL
-- firmati generati server-side.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents', 'documents', false,
  10485760, -- 10MB
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do nothing;

create policy "genitore legge i propri file" on storage.objects
  for select using (
    bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "genitore carica nei propri percorsi" on storage.objects
  for insert with check (
    bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "genitore elimina i propri file" on storage.objects
  for delete using (
    bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "admin legge tutti i file documents" on storage.objects
  for select using (
    bucket_id = 'documents' and public.has_role(auth.uid(), 'admin')
  );
