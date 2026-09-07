-- Firma elettronica semplice dei moduli (area genitori).
-- Evidenze in enrollment_signatures: chi ha firmato (ruolo, nome, utente),
-- quando, cosa ha dichiarato (consent_text) e quali moduli, con il PNG della
-- firma nel bucket privato "documents" sotto {parent_id}/{enrollment_id}/firme/.
-- Una firma non si modifica né si elimina: se ne appone una nuova, che
-- sostituisce logicamente la precedente (vale la più recente per ruolo).
-- La firma NON è obbligatoria per completare l'iscrizione.

create type public.signer_role as enum ('genitore_1', 'genitore_2');

create table public.enrollment_signatures (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  signer_role public.signer_role not null,
  signer_name text not null,
  user_id uuid not null references public.profiles(id),
  storage_path text not null unique,
  consent_text text not null,
  signed_documents text[] not null default '{}',
  signed_at timestamptz not null default now(),
  constraint enrollment_signatures_name_not_empty check (char_length(trim(signer_name)) > 0),
  constraint enrollment_signatures_consent_not_empty check (char_length(trim(consent_text)) > 0)
);

create index enrollment_signatures_enrollment_idx
  on public.enrollment_signatures (enrollment_id, signer_role, signed_at desc);

-- ---------------------------------------------------------------------------
-- RLS: il genitore inserisce e legge solo sulle proprie iscrizioni; l'admin
-- legge tutto; nessuna policy di update/delete (append-only).
-- ---------------------------------------------------------------------------
alter table public.enrollment_signatures enable row level security;

create policy "genitore legge le firme delle proprie iscrizioni" on public.enrollment_signatures
  for select using (
    exists (
      select 1 from public.enrollments e
      where e.id = enrollment_id and e.parent_id = auth.uid()
    )
  );
create policy "genitore firma le proprie iscrizioni" on public.enrollment_signatures
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.enrollments e
      where e.id = enrollment_id and e.parent_id = auth.uid()
    )
  );
create policy "admin legge tutte le firme" on public.enrollment_signatures
  for select using (public.has_role(auth.uid(), 'admin'));

-- Su Lovable Cloud i privilegi non arrivano dai default.
grant select, insert on public.enrollment_signatures to authenticated;

-- Il genitore può registrare nel registro delle azioni le PROPRIE azioni
-- (firma): audit_log resta append-only (nessuna policy di update/delete).
create policy "utente scrive audit log delle proprie azioni" on public.audit_log
  for insert with check (actor_id = auth.uid());
grant insert on public.audit_log to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: le firme stanno nel bucket "documents" (PNG, cartella "firme").
-- Il genitore continua a caricare/leggere nel proprio percorso, ma non può
-- più eliminare i file della cartella firme: una firma si conserva sempre.
-- ---------------------------------------------------------------------------
drop policy if exists "genitore elimina i propri file" on storage.objects;
create policy "genitore elimina i propri file" on storage.objects
  for delete using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
    and coalesce((storage.foldername(name))[3], '') <> 'firme'
  );
