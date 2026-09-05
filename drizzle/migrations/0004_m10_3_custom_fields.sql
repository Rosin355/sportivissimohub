-- M10.3 — Campi personalizzati per sede: definizioni admin (testo, sì/no,
-- scelta da elenco, data), step "Informazioni richieste dalla sede" nel
-- wizard, risposte in enrollments.custom_answers (chiave = code del campo).
-- Limiti: i campi non influenzano prezzi, posti o logica; modificare o
-- disattivare un campo non tocca le risposte già raccolte (restano nel jsonb
-- dell'iscrizione con il code originale). Il code non cambia mai; un campo
-- con risposte non si elimina, si disattiva.

create type public.custom_field_type as enum ('testo', 'si_no', 'scelta', 'data');

create table public.location_custom_fields (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  code text not null,                 -- slug stabile generato dall'etichetta
  label text not null,
  field_type public.custom_field_type not null,
  options text[] not null default '{}', -- solo per field_type = 'scelta'
  required boolean not null default false,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint location_custom_fields_unique_code unique (location_id, code),
  constraint location_custom_fields_code_format check (code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint location_custom_fields_label_not_empty check (char_length(trim(label)) > 0),
  constraint location_custom_fields_options_for_choice check (
    field_type <> 'scelta' or cardinality(options) >= 1
  )
);

create index location_custom_fields_location_idx
  on public.location_custom_fields (location_id, sort_order);

-- Code, sede e tipo sono immutabili: le risposte già raccolte li referenziano.
create or replace function public.location_custom_fields_lock()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.code <> old.code or new.location_id <> old.location_id or new.field_type <> old.field_type then
    raise exception 'Codice, sede e tipo di un campo personalizzato non si possono modificare';
  end if;
  return new;
end;
$$;

create trigger location_custom_fields_lock
  before update on public.location_custom_fields
  for each row execute function public.location_custom_fields_lock();

-- Risposte sull'iscrizione: { "<code>": "testo" | true/false | "yyyy-mm-dd" | "opzione" }
alter table public.enrollments
  add column custom_answers jsonb not null default '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- RLS: pubblico (anche anonimo) vede i campi attivi delle sedi pubblicate;
-- staff legge tutto; admin legge e scrive.
-- ---------------------------------------------------------------------------
alter table public.location_custom_fields enable row level security;

create policy "campi attivi delle sedi pubblicate" on public.location_custom_fields
  for select using (
    active
    and exists (
      select 1 from public.locations l
      where l.id = location_id and l.status = 'pubblicata'
    )
  );
create policy "staff legge i campi personalizzati" on public.location_custom_fields
  for select using (public.has_role(auth.uid(), 'staff'));
create policy "admin legge tutti i campi personalizzati" on public.location_custom_fields
  for select using (public.has_role(auth.uid(), 'admin'));
create policy "admin crea campi personalizzati" on public.location_custom_fields
  for insert with check (public.has_role(auth.uid(), 'admin'));
create policy "admin aggiorna campi personalizzati" on public.location_custom_fields
  for update using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "admin elimina campi personalizzati" on public.location_custom_fields
  for delete using (public.has_role(auth.uid(), 'admin'));

-- Su Lovable Cloud i privilegi non arrivano dai default (come per le sedi).
grant select on public.location_custom_fields to anon, authenticated;
grant insert, update, delete on public.location_custom_fields to authenticated;