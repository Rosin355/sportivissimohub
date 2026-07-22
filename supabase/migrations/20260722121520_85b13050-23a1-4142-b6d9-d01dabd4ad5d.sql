-- M2b — Policy storage.objects per bucket "documents"

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