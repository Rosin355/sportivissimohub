-- M10.2 — Cartelle documenti per sede: regolamenti, moduli vuoti, informative
-- e template PDF per l'overlay (uso interno), caricati dall'admin dalla scheda
-- sede ed esposti (solo i pubblici) nella pagina della sede e nel wizard.
--
-- PRIMA di applicare: creare con il tool Lovable il bucket PRIVATO
-- "location-documents" (limite 10 MB; MIME consentiti: application/pdf,
-- image/png, image/jpeg, image/webp, application/msword,
-- application/vnd.openxmlformats-officedocument.wordprocessingml.document).
-- Percorso dei file: {location_id}/{document_id}/{nome-file}.
-- Il pubblico NON accede mai al bucket: i download passano dalla server
-- function getLocationDocumentUrl, che firma l'URL solo se il documento è
-- pubblico, la sede è pubblicata e la categoria non è template_overlay.

create type public.location_document_category as enum (
  'regolamento', 'modulo', 'informativa', 'template_overlay'
);

create table public.location_documents (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  category public.location_document_category not null,
  title text not null,
  storage_path text not null unique,
  file_name text not null,
  size_bytes int not null,
  mime_type text not null,
  is_public boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  constraint location_documents_title_not_empty check (char_length(trim(title)) > 0),
  constraint location_documents_size check (size_bytes >= 0 and size_bytes <= 10485760),
  constraint location_documents_mime check (
    mime_type in (
      'application/pdf', 'image/png', 'image/jpeg', 'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
  )
);

create index location_documents_location_idx
  on public.location_documents (location_id, sort_order, created_at);

-- ---------------------------------------------------------------------------
-- RLS: il pubblico (anche anonimo) vede solo i documenti pubblici delle sedi
-- pubblicate, mai i template_overlay; staff legge tutto; admin legge e scrive.
-- ---------------------------------------------------------------------------
alter table public.location_documents enable row level security;

create policy "documenti pubblici delle sedi pubblicate" on public.location_documents
  for select using (
    is_public
    and category <> 'template_overlay'
    and exists (
      select 1 from public.locations l
      where l.id = location_id and l.status = 'pubblicata'
    )
  );
create policy "staff legge i documenti delle sedi" on public.location_documents
  for select using (public.has_role(auth.uid(), 'staff'));
create policy "admin legge tutti i documenti delle sedi" on public.location_documents
  for select using (public.has_role(auth.uid(), 'admin'));
create policy "admin crea documenti sede" on public.location_documents
  for insert with check (public.has_role(auth.uid(), 'admin'));
create policy "admin aggiorna documenti sede" on public.location_documents
  for update using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "admin elimina documenti sede" on public.location_documents
  for delete using (public.has_role(auth.uid(), 'admin'));

-- Su Lovable Cloud i privilegi non arrivano dai default (come per le sedi).
grant select on public.location_documents to anon, authenticated;
grant insert, update, delete on public.location_documents to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: bucket privato "location-documents", accesso diretto solo admin.
-- ---------------------------------------------------------------------------
create policy "admin legge i documenti sede nello storage" on storage.objects
  for select to authenticated
  using (bucket_id = 'location-documents' and public.has_role(auth.uid(), 'admin'));
create policy "admin carica documenti sede nello storage" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'location-documents' and public.has_role(auth.uid(), 'admin'));
create policy "admin aggiorna documenti sede nello storage" on storage.objects
  for update to authenticated
  using (bucket_id = 'location-documents' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'location-documents' and public.has_role(auth.uid(), 'admin'));
create policy "admin elimina documenti sede nello storage" on storage.objects
  for delete to authenticated
  using (bucket_id = 'location-documents' and public.has_role(auth.uid(), 'admin'));
