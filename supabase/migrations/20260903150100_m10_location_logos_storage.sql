-- M10.1b — Policy storage per il bucket PUBBLICO "location-logos" (loghi dei
-- comuni mostrati nella pagina pubblica della sede: nessun dato sensibile).
--
-- PRIMA di applicare questo file creare il bucket con il tool di Lovable
-- (nome: location-logos, pubblico, limite 2 MB, mime image/png, image/jpeg,
-- image/svg+xml, image/webp). In un progetto Supabase "classico" equivale a:
--   insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
--   values ('location-logos', 'location-logos', true, 2097152,
--           array['image/png','image/jpeg','image/svg+xml','image/webp']);
-- Percorso dei file: {location_id}/{timestamp}-{nome-file}.

create policy "loghi sedi leggibili da tutti" on storage.objects
  for select using (bucket_id = 'location-logos');
create policy "admin carica loghi sedi" on storage.objects
  for insert with check (bucket_id = 'location-logos' and public.has_role(auth.uid(), 'admin'));
create policy "admin aggiorna loghi sedi" on storage.objects
  for update using (bucket_id = 'location-logos' and public.has_role(auth.uid(), 'admin'));
create policy "admin elimina loghi sedi" on storage.objects
  for delete using (bucket_id = 'location-logos' and public.has_role(auth.uid(), 'admin'));
