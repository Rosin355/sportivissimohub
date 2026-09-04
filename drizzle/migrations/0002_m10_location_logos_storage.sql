-- M10.1b — Bucket PRIVATO "location-logos" per i loghi dei comuni.
-- Lovable Cloud blocca i bucket pubblici (public_buckets_blocked): il bucket è
-- stato creato privato dal tool Lovable. I loghi si servono con URL firmati
-- generati server-side (validità 24 h) nei loader di lista/dettaglio sedi e
-- nell'editor admin. Percorso dei file: {location_id}/{timestamp}-{nome-file}.

-- Lettura (serve anche a firmare gli URL): tutti, ma SOLO su questo bucket.
create policy "loghi sedi leggibili da tutti" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'location-logos');

-- Scrittura: solo admin.
create policy "admin carica loghi sedi" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'location-logos' and public.has_role(auth.uid(), 'admin'));
create policy "admin aggiorna loghi sedi" on storage.objects
  for update to authenticated
  using (bucket_id = 'location-logos' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'location-logos' and public.has_role(auth.uid(), 'admin'));
create policy "admin elimina loghi sedi" on storage.objects
  for delete to authenticated
  using (bucket_id = 'location-logos' and public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- GRANT sulle tabelle/funzione della M10.1. Su Lovable Cloud i privilegi non
-- arrivano dai default: le select sono già state concesse a mano, qui si
-- ripetono per riproducibilità (i GRANT sono idempotenti). Le RLS restano il
-- vero perimetro: la scrittura passa solo se has_role(auth.uid(), 'admin').
-- ---------------------------------------------------------------------------
grant select on public.locations, public.location_weeks, public.location_extras
  to anon, authenticated;
grant insert, update, delete on public.locations, public.location_weeks, public.location_extras
  to authenticated;
grant execute on function public.location_week_occupancy() to anon, authenticated;