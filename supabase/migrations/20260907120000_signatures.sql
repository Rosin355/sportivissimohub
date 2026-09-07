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

-- ---------------------------------------------------------------------------
-- Registro delle azioni: audit_log resta CHIUSO ai client (nessuna policy di
-- insert per i genitori). La voce della firma la scrive questa funzione
-- security definer, che registra SOLO l'azione 'firma_apposta' con i dati
-- letti dalla riga di enrollment_signatures (verificata: firma dell'utente
-- corrente su una propria iscrizione). Idempotente: una voce per firma.
-- ---------------------------------------------------------------------------
create or replace function public.log_enrollment_signature(_signature_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  sig record;
begin
  if auth.uid() is null then
    raise exception 'Utente non autenticato';
  end if;

  select s.id, s.enrollment_id, s.signer_role, s.signer_name, s.signed_documents, s.signed_at
    into sig
  from public.enrollment_signatures s
  join public.enrollments e on e.id = s.enrollment_id
  where s.id = _signature_id
    and s.user_id = auth.uid()
    and e.parent_id = auth.uid();
  if not found then
    raise exception 'Firma non trovata o non appartenente all''utente corrente';
  end if;

  if exists (
    select 1 from public.audit_log
    where action = 'firma_apposta'
      and detail->>'signature_id' = sig.id::text
  ) then
    return;
  end if;

  insert into public.audit_log (actor_id, action, entity, entity_id, detail)
  values (
    auth.uid(),
    'firma_apposta',
    'enrollment',
    sig.enrollment_id::text,
    jsonb_build_object(
      'signature_id', sig.id,
      'signer_role', sig.signer_role,
      'signer_name', sig.signer_name,
      'signed_documents', to_jsonb(sig.signed_documents),
      'signed_at', sig.signed_at
    )
  );
end;
$$;

revoke all on function public.log_enrollment_signature(uuid) from public;
grant execute on function public.log_enrollment_signature(uuid) to authenticated;

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
