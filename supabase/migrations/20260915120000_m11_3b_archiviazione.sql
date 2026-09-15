-- M11.3b — CRUD admin con archiviazione come default.
--
-- Principio: dove esiste storico collegato, "elimina" significa archivia.
-- L'eliminazione definitiva è ammessa solo senza dipendenze. Le dipendenze le
-- controlla l'app (per mostrare cosa verrà rimosso) e le ricontrolla qui il
-- database con trigger di guardia, così una richiesta diretta non le aggira.
-- I trigger di guardia sono security definer: devono vedere tutte le righe
-- collegate a prescindere da chi elimina, e si limitano a sollevare un errore.

-- ---------------------------------------------------------------------------
-- Sedi: archiviazione
-- ---------------------------------------------------------------------------
-- L'archiviazione riporta la sede in bozza e ne segna la data: tutte le regole
-- esistenti (pubblico, wizard, staff vedono solo le pubblicate) la nascondono
-- senza doverle modificare. Il ripristino azzera la data e lascia la bozza.
alter table public.locations
  add column archived_at timestamptz;

alter table public.locations
  add constraint locations_archived_not_published
  check (archived_at is null or status <> 'pubblicata');

-- Lo slug resta bloccato anche per le sedi archiviate: il loro URL e le
-- iscrizioni storiche lo referenziano.
create or replace function public.locations_lock_slug()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (old.status = 'pubblicata' or old.archived_at is not null) and new.slug <> old.slug then
    raise exception 'Lo slug di una sede pubblicata o archiviata non può essere modificato';
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Guardie di eliminazione definitiva
-- ---------------------------------------------------------------------------

-- Sede: niente iscrizioni (già garantito anche dalla chiave esterna) e niente
-- storico economico o di presenze della sede.
create or replace function public.locations_guard_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.enrollments e where e.location_slug = old.slug) then
    raise exception 'La sede ha iscrizioni: si può solo archiviare';
  end if;
  if exists (select 1 from public.cash_movements c where c.location_id = old.id)
     or exists (select 1 from public.staff_attendance s where s.location_id = old.id)
     or exists (select 1 from public.daily_meals d where d.location_id = old.id) then
    raise exception 'La sede ha movimenti di cassa, presenze o pasti registrati: si può solo archiviare';
  end if;
  return old;
end;
$$;

create trigger locations_guard_delete
  before delete on public.locations
  for each row execute function public.locations_guard_delete();

-- Iscrizione: niente pagamenti, presenze o firme elettroniche (evidenze da
-- conservare). Per tutto il resto si usa lo stato "annullata".
create or replace function public.enrollments_guard_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.payments p where p.enrollment_id = old.id) then
    raise exception 'L''iscrizione ha pagamenti registrati: si può solo annullare';
  end if;
  if exists (select 1 from public.attendance a where a.enrollment_id = old.id) then
    raise exception 'L''iscrizione ha presenze registrate: si può solo annullare';
  end if;
  if exists (select 1 from public.enrollment_signatures s where s.enrollment_id = old.id) then
    raise exception 'L''iscrizione ha firme elettroniche: si può solo annullare';
  end if;
  return old;
end;
$$;

create trigger enrollments_guard_delete
  before delete on public.enrollments
  for each row execute function public.enrollments_guard_delete();

-- Figlio: niente iscrizioni (vale anche per il genitore che elimina un proprio
-- figlio; la chiave esterna lo impediva già, qui con un messaggio chiaro).
create or replace function public.children_guard_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.enrollments e where e.child_id = old.id) then
    raise exception 'Il figlio ha iscrizioni: non si può eliminare';
  end if;
  return old;
end;
$$;

create trigger children_guard_delete
  before delete on public.children
  for each row execute function public.children_guard_delete();

-- Campo personalizzato: nessuna iscrizione della sede ha una risposta con quel
-- codice. Le risposte vivono in enrollments.custom_answers (jsonb).
create or replace function public.location_custom_fields_guard_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.enrollments e
    join public.locations l on l.slug = e.location_slug
    where l.id = old.location_id
      and e.custom_answers ? old.code
  ) then
    raise exception 'Il campo ha risposte raccolte: si può solo disattivare';
  end if;
  return old;
end;
$$;

create trigger location_custom_fields_guard_delete
  before delete on public.location_custom_fields
  for each row execute function public.location_custom_fields_guard_delete();

-- Codice di frequenza: nessuna casella del registro della sede lo usa.
create or replace function public.location_frequency_codes_guard_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.enrollment_week_codes c
    join public.enrollments e on e.id = c.enrollment_id
    join public.locations l on l.slug = e.location_slug
    where l.id = old.location_id
      and c.frequency_code = old.code
  ) then
    raise exception 'Il codice è usato nel registro: si può solo disattivare';
  end if;
  return old;
end;
$$;

create trigger location_frequency_codes_guard_delete
  before delete on public.location_frequency_codes
  for each row execute function public.location_frequency_codes_guard_delete();

-- Le funzioni di guardia servono solo ai trigger.
revoke all on function public.locations_guard_delete() from public;
revoke all on function public.enrollments_guard_delete() from public;
revoke all on function public.children_guard_delete() from public;
revoke all on function public.location_custom_fields_guard_delete() from public;
revoke all on function public.location_frequency_codes_guard_delete() from public;

-- ---------------------------------------------------------------------------
-- Regole di accesso per l'eliminazione admin
-- ---------------------------------------------------------------------------
-- Iscrizioni e figli non avevano una regola di eliminazione per l'admin. I
-- privilegi di tabella per authenticated esistono già dalla M2.
create policy "admin elimina iscrizioni senza storico" on public.enrollments
  for delete using (public.has_role(auth.uid(), 'admin'));

create policy "admin elimina figli senza iscrizioni" on public.children
  for delete using (public.has_role(auth.uid(), 'admin'));

-- File dei documenti di un'iscrizione eliminata: l'admin può rimuoverli dal
-- bucket privato "documents", mai quelli della cartella "firme".
create policy "admin elimina file documenti delle iscrizioni" on storage.objects
  for delete to authenticated using (
    bucket_id = 'documents'
    and public.has_role(auth.uid(), 'admin')
    and coalesce((storage.foldername(name))[3], '') <> 'firme'
  );
