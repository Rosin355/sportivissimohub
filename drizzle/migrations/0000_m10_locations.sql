-- M10.1 — Sedi nel database: locations + settimane + servizi extra.
-- Sostituisce il file statico src/data/locations.ts. Gli slug e i codici di
-- settimane/extra restano quelli attuali: enrollments.location_slug,
-- enrollments.week_ids ed enrollments.extras continuano a valere.
-- La disponibilità NON è memorizzata: si calcola dalle iscrizioni confermate
-- per settimana (funzione location_week_occupancy, solo conteggi).

create type public.location_type as enum ('centro_estivo', 'doposcuola', 'corso', 'progetto_scuola');
create type public.location_status as enum ('bozza', 'pubblicata');

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  type public.location_type not null default 'centro_estivo',
  status public.location_status not null default 'bozza',
  name text not null,
  comune text not null default '',
  address text not null default '',
  age_label text not null default '',
  age_min int not null default 6,
  age_max int not null default 13,
  tagline text not null default '',
  description text not null default '',
  theme text not null default 'royal',
  contact_phone text not null default '',
  contact_email text not null default '',
  contact_manager text not null default '',
  logo_path text,
  -- struttura LocationPricing (residenti/non residenti, intera/mezza, sconto
  -- fratelli, tessere, mora), chiavi camelCase come nel tipo TypeScript
  pricing jsonb not null default '{}'::jsonb,
  time_slots text[] not null default '{}',
  activities text[] not null default '{}',
  included_services text[] not null default '{}',
  required_documents text[] not null default '{}',
  badges jsonb not null default '[]'::jsonb,
  day_plan jsonb not null default '[]'::jsonb,
  faq jsonb not null default '[]'::jsonb,
  admin_notes text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint locations_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint locations_name_not_empty check (char_length(trim(name)) > 0),
  constraint locations_theme_valid check (theme in ('sun', 'grass', 'magic', 'flame', 'royal')),
  constraint locations_age_range check (age_min >= 0 and age_max >= age_min)
);

create trigger locations_updated_at
  before update on public.locations
  for each row execute function public.set_updated_at();

-- Lo slug è l'URL pubblico: dopo la pubblicazione non si tocca più.
create or replace function public.locations_lock_slug()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.status = 'pubblicata' and new.slug <> old.slug then
    raise exception 'Lo slug di una sede pubblicata non può essere modificato';
  end if;
  return new;
end;
$$;

create trigger locations_lock_slug
  before update on public.locations
  for each row execute function public.locations_lock_slug();

create table public.location_weeks (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  code text not null,          -- usato in enrollments.week_ids (es. w1)
  number int not null,
  label text not null,         -- es. "8 - 12 giugno"
  start_date date,
  end_date date,
  spots int not null default 0,
  constraint location_weeks_unique_code unique (location_id, code),
  constraint location_weeks_code_format check (code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint location_weeks_number_positive check (number >= 1),
  constraint location_weeks_spots_nonneg check (spots >= 0),
  constraint location_weeks_dates check (start_date is null or end_date is null or end_date >= start_date)
);

create table public.location_extras (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  code text not null,          -- usato in enrollments.extras (es. anticipo)
  label text not null,
  price numeric(8, 2) not null default 0,
  sort_order int not null default 0,
  constraint location_extras_unique_code unique (location_id, code),
  constraint location_extras_code_format check (code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint location_extras_price_nonneg check (price >= 0)
);

create index location_weeks_location_idx on public.location_weeks (location_id, number);
create index location_extras_location_idx on public.location_extras (location_id, sort_order);

-- ---------------------------------------------------------------------------
-- Seed: le 9 sedi attuali di locations.ts (tutte pubblicate per non cambiare
-- gli URL esistenti). Solo Galzignano ha prezzi/settimane reali 2026.
-- ---------------------------------------------------------------------------

-- Galzignano Terme
insert into public.locations (slug, type, status, name, comune, address, age_label, age_min, age_max, tagline, description, theme,
  contact_phone, contact_email, contact_manager, pricing, time_slots, activities, included_services, required_documents,
  badges, day_plan, faq, admin_notes, sort_order)
values ('galzignano-terme', 'centro_estivo', 'pubblicata', 'Galzignano Terme', 'Galzignano Terme (PD)', 'Via Roma 12 — Galzignano Terme', '6-13 anni', 6, 13,
  'Centro estivo immerso nel verde dei Colli Euganei.', 'Una sede pensata per far divertire i bambini con sport, laboratori e tantissimi nuovi amici. Lo staff Sportivissimo accompagna ogni piccolo atleta in una giornata piena di energia.', 'grass',
  '+39 049 0000000', 'info@sportivissimo.it', 'Lo staff Sportivissimo',
  '{"residentFullDay":75,"residentHalfDay":40,"nonResidentFullDay":95,"nonResidentHalfDay":55,"siblingDiscountFullDay":10,"siblingDiscountHalfDay":5,"membershipBase":10,"membershipSuperIntegrativa":30,"lateFee":15}'::jsonb, array['07:45 - 16:00 (giornata intera)', '07:45 - 12:30 (mezza giornata)']::text[], array['Calcio', 'Pallavolo', 'Piscina', 'Mini golf', 'Laboratori', 'Escursioni']::text[], array['Tutte le attività sportive', 'Materiali per i laboratori', 'Merenda di metà mattina', 'Staff qualificato e assicurato', 'Maglietta Sportivissimo']::text[], array['Documento d''identità del genitore', 'Tessera sanitaria del bambino/a', 'Certificato medico di sana e robusta costituzione', 'Modulo deleghe firmato']::text[],
  '[{"label":"Sport","color":"flame"},{"label":"Piscina","color":"royal"},{"label":"Natura","color":"grass"}]'::jsonb, '[{"time":"07:30 - 09:00","title":"Buongiorno e accoglienza","description":"Anticipo facoltativo, giochi liberi e merenda di benvenuto.","icon":"sun","color":"sun"},{"time":"09:00 - 12:30","title":"Sport & avventura","description":"Attività sportive a rotazione: calcio, pallavolo, atletica.","icon":"ball","color":"grass"},{"time":"12:30 - 14:00","title":"Pranzo in compagnia","description":"Mensa con menù controllato e momento di relax.","icon":"lunch","color":"flame"},{"time":"14:00 - 16:00","title":"Laboratori creativi","description":"Arte, musica, costruzioni e mini-esperimenti.","icon":"art","color":"magic"},{"time":"16:00 - 17:30","title":"Giochi di squadra","description":"Tornei, cacce al tesoro e sfide a squadre.","icon":"team","color":"royal"},{"time":"17:30 - 18:30","title":"Saluti e posticipo","description":"Ritiro bambini, posticipo facoltativo fino alle 18:30.","icon":"hug","color":"sun"}]'::jsonb, '[{"q":"Posso iscrivere più di una settimana?","a":"Sì, basta selezionare tutte le settimane desiderate nel modulo di iscrizione."},{"q":"Il pranzo è incluso?","a":"Il pranzo è un servizio extra opzionale: puoi attivarlo durante l''iscrizione."},{"q":"Posso ritirare prima mio figlio?","a":"Certo. Puoi indicarlo allo staff anche la mattina stessa."},{"q":"Cosa serve per partecipare?","a":"Servono solo abbigliamento sportivo, cappellino, borraccia e tanta voglia di divertirsi!"}]'::jsonb, 'Prezzi e settimane 2026 dal regolamento ufficiale.', 0);
insert into public.location_weeks (location_id, code, number, label, start_date, end_date, spots)
select l.id, v.code, v.number, v.label, v.start_date::date, v.end_date::date, v.spots
from public.locations l, (values
  ('w1', 1, '8 - 12 giugno', '2026-06-08', '2026-06-12', 12),
  ('w2', 2, '15 - 19 giugno', '2026-06-15', '2026-06-19', 12),
  ('w3', 3, '22 - 26 giugno', '2026-06-22', '2026-06-26', 12),
  ('w4', 4, '29 giu - 3 lug', '2026-06-29', '2026-07-03', 12),
  ('w5', 5, '6 - 10 luglio', '2026-07-06', '2026-07-10', 12),
  ('w6', 6, '13 - 17 luglio', '2026-07-13', '2026-07-17', 12),
  ('w7', 7, '20 - 24 luglio', '2026-07-20', '2026-07-24', 12),
  ('w8', 8, '27 - 31 luglio', '2026-07-27', '2026-07-31', 12),
  ('w9', 9, '3 - 7 agosto', '2026-08-03', '2026-08-07', 12)
) as v(code, number, label, start_date, end_date, spots)
where l.slug = 'galzignano-terme';
insert into public.location_extras (location_id, code, label, price, sort_order)
select l.id, v.code, v.label, v.price, v.sort_order
from public.locations l, (values
  ('anticipo', 'Anticipo (dalle 7:30)', 15, 0),
  ('posticipo', 'Posticipo (fino 18:30)', 15, 1),
  ('mensa', 'Mensa settimanale', 35, 2),
  ('gite', 'Uscita / gita', 20, 3)
) as v(code, label, price, sort_order)
where l.slug = 'galzignano-terme';

-- Castegnero Champions Camp
insert into public.locations (slug, type, status, name, comune, address, age_label, age_min, age_max, tagline, description, theme,
  contact_phone, contact_email, contact_manager, pricing, time_slots, activities, included_services, required_documents,
  badges, day_plan, faq, admin_notes, sort_order)
values ('castegnero-champions-camp', 'centro_estivo', 'pubblicata', 'Castegnero Champions Camp', 'Castegnero (VI)', 'Via dello Stadio 4 — Castegnero', '8-14 anni', 8, 14,
  'Il camp per i veri campioni del pallone.', 'Una sede pensata per far divertire i bambini con sport, laboratori e tantissimi nuovi amici. Lo staff Sportivissimo accompagna ogni piccolo atleta in una giornata piena di energia.', 'flame',
  '+39 049 0000000', 'info@sportivissimo.it', 'Lo staff Sportivissimo',
  '{"residentFullDay":150,"residentHalfDay":115,"nonResidentFullDay":170,"nonResidentHalfDay":135,"siblingDiscountFullDay":10,"siblingDiscountHalfDay":5,"membershipBase":10,"membershipSuperIntegrativa":30,"lateFee":15}'::jsonb, array['08:30 - 17:00 (tempo pieno)', '08:30 - 13:00 (mezza giornata)']::text[], array['Allenamenti calcio', 'Tecnica individuale', 'Mini tornei', 'Video analisi', 'Fair play']::text[], array['Tutte le attività sportive', 'Materiali per i laboratori', 'Merenda di metà mattina', 'Staff qualificato e assicurato', 'Maglietta Sportivissimo']::text[], array['Documento d''identità del genitore', 'Tessera sanitaria del bambino/a', 'Certificato medico di sana e robusta costituzione', 'Modulo deleghe firmato']::text[],
  '[{"label":"Calcio","color":"grass"},{"label":"Squadra","color":"magic"},{"label":"Tornei","color":"flame"}]'::jsonb, '[{"time":"07:30 - 09:00","title":"Buongiorno e accoglienza","description":"Anticipo facoltativo, giochi liberi e merenda di benvenuto.","icon":"sun","color":"sun"},{"time":"09:00 - 12:30","title":"Sport & avventura","description":"Attività sportive a rotazione: calcio, pallavolo, atletica.","icon":"ball","color":"grass"},{"time":"12:30 - 14:00","title":"Pranzo in compagnia","description":"Mensa con menù controllato e momento di relax.","icon":"lunch","color":"flame"},{"time":"14:00 - 16:00","title":"Laboratori creativi","description":"Arte, musica, costruzioni e mini-esperimenti.","icon":"art","color":"magic"},{"time":"16:00 - 17:30","title":"Giochi di squadra","description":"Tornei, cacce al tesoro e sfide a squadre.","icon":"team","color":"royal"},{"time":"17:30 - 18:30","title":"Saluti e posticipo","description":"Ritiro bambini, posticipo facoltativo fino alle 18:30.","icon":"hug","color":"sun"}]'::jsonb, '[{"q":"Posso iscrivere più di una settimana?","a":"Sì, basta selezionare tutte le settimane desiderate nel modulo di iscrizione."},{"q":"Il pranzo è incluso?","a":"Il pranzo è un servizio extra opzionale: puoi attivarlo durante l''iscrizione."},{"q":"Posso ritirare prima mio figlio?","a":"Certo. Puoi indicarlo allo staff anche la mattina stessa."},{"q":"Cosa serve per partecipare?","a":"Servono solo abbigliamento sportivo, cappellino, borraccia e tanta voglia di divertirsi!"}]'::jsonb, 'Prezzi e settimane DA CONFERMARE con l''associazione: valori placeholder importati da locations.ts.', 1);
insert into public.location_weeks (location_id, code, number, label, start_date, end_date, spots)
select l.id, v.code, v.number, v.label, v.start_date::date, v.end_date::date, v.spots
from public.locations l, (values
  ('w1', 1, '10 - 14 giugno', '2026-06-10', '2026-06-14', 12),
  ('w2', 2, '17 - 21 giugno', '2026-06-17', '2026-06-21', 10),
  ('w3', 3, '24 - 28 giugno', '2026-06-24', '2026-06-28', 8),
  ('w4', 4, '1 - 5 luglio', '2026-07-01', '2026-07-05', 14),
  ('w5', 5, '8 - 12 luglio', '2026-07-08', '2026-07-12', 9),
  ('w6', 6, '15 - 19 luglio', '2026-07-15', '2026-07-19', 11),
  ('w7', 7, '22 - 26 luglio', '2026-07-22', '2026-07-26', 7),
  ('w8', 8, '29 lug - 2 ago', '2026-07-29', '2026-08-02', 6)
) as v(code, number, label, start_date, end_date, spots)
where l.slug = 'castegnero-champions-camp';
insert into public.location_extras (location_id, code, label, price, sort_order)
select l.id, v.code, v.label, v.price, v.sort_order
from public.locations l, (values
  ('anticipo', 'Anticipo (dalle 7:30)', 15, 0),
  ('posticipo', 'Posticipo (fino 18:30)', 15, 1),
  ('mensa', 'Mensa settimanale', 35, 2),
  ('gite', 'Uscita / gita', 20, 3)
) as v(code, label, price, sort_order)
where l.slug = 'castegnero-champions-camp';

-- S. Pietro Viminario
insert into public.locations (slug, type, status, name, comune, address, age_label, age_min, age_max, tagline, description, theme,
  contact_phone, contact_email, contact_manager, pricing, time_slots, activities, included_services, required_documents,
  badges, day_plan, faq, admin_notes, sort_order)
values ('san-pietro-viminario', 'centro_estivo', 'pubblicata', 'S. Pietro Viminario', 'San Pietro Viminario (PD)', 'Piazza della Pace 2 — S. Pietro Viminario', '5-11 anni', 5, 11,
  'Tanti laboratori creativi per piccoli artisti.', 'Una sede pensata per far divertire i bambini con sport, laboratori e tantissimi nuovi amici. Lo staff Sportivissimo accompagna ogni piccolo atleta in una giornata piena di energia.', 'magic',
  '+39 049 0000000', 'info@sportivissimo.it', 'Lo staff Sportivissimo',
  '{"residentFullDay":115,"residentHalfDay":80,"nonResidentFullDay":135,"nonResidentHalfDay":100,"siblingDiscountFullDay":10,"siblingDiscountHalfDay":5,"membershipBase":10,"membershipSuperIntegrativa":30,"lateFee":15}'::jsonb, array['08:30 - 17:00 (tempo pieno)', '08:30 - 13:00 (mezza giornata)']::text[], array['Pittura', 'Musica', 'Mini inglese', 'Giochi all''aperto', 'Costruzioni']::text[], array['Tutte le attività sportive', 'Materiali per i laboratori', 'Merenda di metà mattina', 'Staff qualificato e assicurato', 'Maglietta Sportivissimo']::text[], array['Documento d''identità del genitore', 'Tessera sanitaria del bambino/a', 'Certificato medico di sana e robusta costituzione', 'Modulo deleghe firmato']::text[],
  '[{"label":"Creatività","color":"magic"},{"label":"Giochi","color":"sun"},{"label":"Inglese","color":"royal"}]'::jsonb, '[{"time":"07:30 - 09:00","title":"Buongiorno e accoglienza","description":"Anticipo facoltativo, giochi liberi e merenda di benvenuto.","icon":"sun","color":"sun"},{"time":"09:00 - 12:30","title":"Sport & avventura","description":"Attività sportive a rotazione: calcio, pallavolo, atletica.","icon":"ball","color":"grass"},{"time":"12:30 - 14:00","title":"Pranzo in compagnia","description":"Mensa con menù controllato e momento di relax.","icon":"lunch","color":"flame"},{"time":"14:00 - 16:00","title":"Laboratori creativi","description":"Arte, musica, costruzioni e mini-esperimenti.","icon":"art","color":"magic"},{"time":"16:00 - 17:30","title":"Giochi di squadra","description":"Tornei, cacce al tesoro e sfide a squadre.","icon":"team","color":"royal"},{"time":"17:30 - 18:30","title":"Saluti e posticipo","description":"Ritiro bambini, posticipo facoltativo fino alle 18:30.","icon":"hug","color":"sun"}]'::jsonb, '[{"q":"Posso iscrivere più di una settimana?","a":"Sì, basta selezionare tutte le settimane desiderate nel modulo di iscrizione."},{"q":"Il pranzo è incluso?","a":"Il pranzo è un servizio extra opzionale: puoi attivarlo durante l''iscrizione."},{"q":"Posso ritirare prima mio figlio?","a":"Certo. Puoi indicarlo allo staff anche la mattina stessa."},{"q":"Cosa serve per partecipare?","a":"Servono solo abbigliamento sportivo, cappellino, borraccia e tanta voglia di divertirsi!"}]'::jsonb, 'Prezzi e settimane DA CONFERMARE con l''associazione: valori placeholder importati da locations.ts.', 2);
insert into public.location_weeks (location_id, code, number, label, start_date, end_date, spots)
select l.id, v.code, v.number, v.label, v.start_date::date, v.end_date::date, v.spots
from public.locations l, (values
  ('w1', 1, '10 - 14 giugno', '2026-06-10', '2026-06-14', 12),
  ('w2', 2, '17 - 21 giugno', '2026-06-17', '2026-06-21', 10),
  ('w3', 3, '24 - 28 giugno', '2026-06-24', '2026-06-28', 8),
  ('w4', 4, '1 - 5 luglio', '2026-07-01', '2026-07-05', 14),
  ('w5', 5, '8 - 12 luglio', '2026-07-08', '2026-07-12', 9),
  ('w6', 6, '15 - 19 luglio', '2026-07-15', '2026-07-19', 11),
  ('w7', 7, '22 - 26 luglio', '2026-07-22', '2026-07-26', 7),
  ('w8', 8, '29 lug - 2 ago', '2026-07-29', '2026-08-02', 6)
) as v(code, number, label, start_date, end_date, spots)
where l.slug = 'san-pietro-viminario';
insert into public.location_extras (location_id, code, label, price, sort_order)
select l.id, v.code, v.label, v.price, v.sort_order
from public.locations l, (values
  ('anticipo', 'Anticipo (dalle 7:30)', 15, 0),
  ('posticipo', 'Posticipo (fino 18:30)', 15, 1),
  ('mensa', 'Mensa settimanale', 35, 2),
  ('gite', 'Uscita / gita', 20, 3)
) as v(code, label, price, sort_order)
where l.slug = 'san-pietro-viminario';

-- Vo' Euganeo
insert into public.locations (slug, type, status, name, comune, address, age_label, age_min, age_max, tagline, description, theme,
  contact_phone, contact_email, contact_manager, pricing, time_slots, activities, included_services, required_documents,
  badges, day_plan, faq, admin_notes, sort_order)
values ('vo-euganeo', 'centro_estivo', 'pubblicata', 'Vo'' Euganeo', 'Vo'' (PD)', 'Via dei Colli 7 — Vo'' Euganeo', '6-12 anni', 6, 12,
  'Avventure nel cuore dei Colli Euganei.', 'Una sede pensata per far divertire i bambini con sport, laboratori e tantissimi nuovi amici. Lo staff Sportivissimo accompagna ogni piccolo atleta in una giornata piena di energia.', 'grass',
  '+39 049 0000000', 'info@sportivissimo.it', 'Lo staff Sportivissimo',
  '{"residentFullDay":120,"residentHalfDay":85,"nonResidentFullDay":140,"nonResidentHalfDay":105,"siblingDiscountFullDay":10,"siblingDiscountHalfDay":5,"membershipBase":10,"membershipSuperIntegrativa":30,"lateFee":15}'::jsonb, array['08:30 - 17:00 (tempo pieno)', '08:30 - 13:00 (mezza giornata)']::text[], array['Trekking', 'Orienteering', 'Giochi nel bosco', 'Sport di squadra', 'Laboratori natura']::text[], array['Tutte le attività sportive', 'Materiali per i laboratori', 'Merenda di metà mattina', 'Staff qualificato e assicurato', 'Maglietta Sportivissimo']::text[], array['Documento d''identità del genitore', 'Tessera sanitaria del bambino/a', 'Certificato medico di sana e robusta costituzione', 'Modulo deleghe firmato']::text[],
  '[{"label":"Natura","color":"grass"},{"label":"Avventura","color":"flame"},{"label":"Trekking","color":"sun"}]'::jsonb, '[{"time":"07:30 - 09:00","title":"Buongiorno e accoglienza","description":"Anticipo facoltativo, giochi liberi e merenda di benvenuto.","icon":"sun","color":"sun"},{"time":"09:00 - 12:30","title":"Sport & avventura","description":"Attività sportive a rotazione: calcio, pallavolo, atletica.","icon":"ball","color":"grass"},{"time":"12:30 - 14:00","title":"Pranzo in compagnia","description":"Mensa con menù controllato e momento di relax.","icon":"lunch","color":"flame"},{"time":"14:00 - 16:00","title":"Laboratori creativi","description":"Arte, musica, costruzioni e mini-esperimenti.","icon":"art","color":"magic"},{"time":"16:00 - 17:30","title":"Giochi di squadra","description":"Tornei, cacce al tesoro e sfide a squadre.","icon":"team","color":"royal"},{"time":"17:30 - 18:30","title":"Saluti e posticipo","description":"Ritiro bambini, posticipo facoltativo fino alle 18:30.","icon":"hug","color":"sun"}]'::jsonb, '[{"q":"Posso iscrivere più di una settimana?","a":"Sì, basta selezionare tutte le settimane desiderate nel modulo di iscrizione."},{"q":"Il pranzo è incluso?","a":"Il pranzo è un servizio extra opzionale: puoi attivarlo durante l''iscrizione."},{"q":"Posso ritirare prima mio figlio?","a":"Certo. Puoi indicarlo allo staff anche la mattina stessa."},{"q":"Cosa serve per partecipare?","a":"Servono solo abbigliamento sportivo, cappellino, borraccia e tanta voglia di divertirsi!"}]'::jsonb, 'Prezzi e settimane DA CONFERMARE con l''associazione: valori placeholder importati da locations.ts.', 3);
insert into public.location_weeks (location_id, code, number, label, start_date, end_date, spots)
select l.id, v.code, v.number, v.label, v.start_date::date, v.end_date::date, v.spots
from public.locations l, (values
  ('w1', 1, '10 - 14 giugno', '2026-06-10', '2026-06-14', 12),
  ('w2', 2, '17 - 21 giugno', '2026-06-17', '2026-06-21', 10),
  ('w3', 3, '24 - 28 giugno', '2026-06-24', '2026-06-28', 8),
  ('w4', 4, '1 - 5 luglio', '2026-07-01', '2026-07-05', 14),
  ('w5', 5, '8 - 12 luglio', '2026-07-08', '2026-07-12', 9),
  ('w6', 6, '15 - 19 luglio', '2026-07-15', '2026-07-19', 11),
  ('w7', 7, '22 - 26 luglio', '2026-07-22', '2026-07-26', 7),
  ('w8', 8, '29 lug - 2 ago', '2026-07-29', '2026-08-02', 6)
) as v(code, number, label, start_date, end_date, spots)
where l.slug = 'vo-euganeo';
insert into public.location_extras (location_id, code, label, price, sort_order)
select l.id, v.code, v.label, v.price, v.sort_order
from public.locations l, (values
  ('anticipo', 'Anticipo (dalle 7:30)', 15, 0),
  ('posticipo', 'Posticipo (fino 18:30)', 15, 1),
  ('mensa', 'Mensa settimanale', 35, 2),
  ('gite', 'Uscita / gita', 20, 3)
) as v(code, label, price, sort_order)
where l.slug = 'vo-euganeo';

-- Asigliano Veneto
insert into public.locations (slug, type, status, name, comune, address, age_label, age_min, age_max, tagline, description, theme,
  contact_phone, contact_email, contact_manager, pricing, time_slots, activities, included_services, required_documents,
  badges, day_plan, faq, admin_notes, sort_order)
values ('asigliano-veneto', 'centro_estivo', 'pubblicata', 'Asigliano Veneto', 'Asigliano Veneto (VI)', 'Via della Scuola 5 — Asigliano Veneto', '5-11 anni', 5, 11,
  'Una settimana di sport, amici e avventure!', 'Una sede pensata per far divertire i bambini con sport, laboratori e tantissimi nuovi amici. Lo staff Sportivissimo accompagna ogni piccolo atleta in una giornata piena di energia.', 'sun',
  '+39 049 0000000', 'info@sportivissimo.it', 'Lo staff Sportivissimo',
  '{"residentFullDay":110,"residentHalfDay":75,"nonResidentFullDay":130,"nonResidentHalfDay":95,"siblingDiscountFullDay":10,"siblingDiscountHalfDay":5,"membershipBase":10,"membershipSuperIntegrativa":30,"lateFee":15}'::jsonb, array['08:30 - 17:00 (tempo pieno)', '08:30 - 13:00 (mezza giornata)']::text[], array['Multisport', 'Laboratori', 'Giochi a squadre']::text[], array['Tutte le attività sportive', 'Materiali per i laboratori', 'Merenda di metà mattina', 'Staff qualificato e assicurato', 'Maglietta Sportivissimo']::text[], array['Documento d''identità del genitore', 'Tessera sanitaria del bambino/a', 'Certificato medico di sana e robusta costituzione', 'Modulo deleghe firmato']::text[],
  '[{"label":"Sport","color":"flame"},{"label":"Creatività","color":"magic"}]'::jsonb, '[{"time":"07:30 - 09:00","title":"Buongiorno e accoglienza","description":"Anticipo facoltativo, giochi liberi e merenda di benvenuto.","icon":"sun","color":"sun"},{"time":"09:00 - 12:30","title":"Sport & avventura","description":"Attività sportive a rotazione: calcio, pallavolo, atletica.","icon":"ball","color":"grass"},{"time":"12:30 - 14:00","title":"Pranzo in compagnia","description":"Mensa con menù controllato e momento di relax.","icon":"lunch","color":"flame"},{"time":"14:00 - 16:00","title":"Laboratori creativi","description":"Arte, musica, costruzioni e mini-esperimenti.","icon":"art","color":"magic"},{"time":"16:00 - 17:30","title":"Giochi di squadra","description":"Tornei, cacce al tesoro e sfide a squadre.","icon":"team","color":"royal"},{"time":"17:30 - 18:30","title":"Saluti e posticipo","description":"Ritiro bambini, posticipo facoltativo fino alle 18:30.","icon":"hug","color":"sun"}]'::jsonb, '[{"q":"Posso iscrivere più di una settimana?","a":"Sì, basta selezionare tutte le settimane desiderate nel modulo di iscrizione."},{"q":"Il pranzo è incluso?","a":"Il pranzo è un servizio extra opzionale: puoi attivarlo durante l''iscrizione."},{"q":"Posso ritirare prima mio figlio?","a":"Certo. Puoi indicarlo allo staff anche la mattina stessa."},{"q":"Cosa serve per partecipare?","a":"Servono solo abbigliamento sportivo, cappellino, borraccia e tanta voglia di divertirsi!"}]'::jsonb, 'Prezzi e settimane DA CONFERMARE con l''associazione: valori placeholder importati da locations.ts.', 4);
insert into public.location_weeks (location_id, code, number, label, start_date, end_date, spots)
select l.id, v.code, v.number, v.label, v.start_date::date, v.end_date::date, v.spots
from public.locations l, (values
  ('w1', 1, '10 - 14 giugno', '2026-06-10', '2026-06-14', 12),
  ('w2', 2, '17 - 21 giugno', '2026-06-17', '2026-06-21', 10),
  ('w3', 3, '24 - 28 giugno', '2026-06-24', '2026-06-28', 8),
  ('w4', 4, '1 - 5 luglio', '2026-07-01', '2026-07-05', 14),
  ('w5', 5, '8 - 12 luglio', '2026-07-08', '2026-07-12', 9),
  ('w6', 6, '15 - 19 luglio', '2026-07-15', '2026-07-19', 11),
  ('w7', 7, '22 - 26 luglio', '2026-07-22', '2026-07-26', 7),
  ('w8', 8, '29 lug - 2 ago', '2026-07-29', '2026-08-02', 6)
) as v(code, number, label, start_date, end_date, spots)
where l.slug = 'asigliano-veneto';
insert into public.location_extras (location_id, code, label, price, sort_order)
select l.id, v.code, v.label, v.price, v.sort_order
from public.locations l, (values
  ('anticipo', 'Anticipo (dalle 7:30)', 15, 0),
  ('posticipo', 'Posticipo (fino 18:30)', 15, 1),
  ('mensa', 'Mensa settimanale', 35, 2),
  ('gite', 'Uscita / gita', 20, 3)
) as v(code, label, price, sort_order)
where l.slug = 'asigliano-veneto';

-- Sossano
insert into public.locations (slug, type, status, name, comune, address, age_label, age_min, age_max, tagline, description, theme,
  contact_phone, contact_email, contact_manager, pricing, time_slots, activities, included_services, required_documents,
  badges, day_plan, faq, admin_notes, sort_order)
values ('sossano', 'centro_estivo', 'pubblicata', 'Sossano', 'Sossano (VI)', 'Via dello Sport 3 — Sossano', '6-13 anni', 6, 13,
  'Una settimana di sport, amici e avventure!', 'Una sede pensata per far divertire i bambini con sport, laboratori e tantissimi nuovi amici. Lo staff Sportivissimo accompagna ogni piccolo atleta in una giornata piena di energia.', 'royal',
  '+39 049 0000000', 'info@sportivissimo.it', 'Lo staff Sportivissimo',
  '{"residentFullDay":125,"residentHalfDay":90,"nonResidentFullDay":145,"nonResidentHalfDay":110,"siblingDiscountFullDay":10,"siblingDiscountHalfDay":5,"membershipBase":10,"membershipSuperIntegrativa":30,"lateFee":15}'::jsonb, array['08:30 - 17:00 (tempo pieno)', '08:30 - 13:00 (mezza giornata)']::text[], array['Piscina', 'Calcio', 'Pallavolo', 'Laboratori']::text[], array['Tutte le attività sportive', 'Materiali per i laboratori', 'Merenda di metà mattina', 'Staff qualificato e assicurato', 'Maglietta Sportivissimo']::text[], array['Documento d''identità del genitore', 'Tessera sanitaria del bambino/a', 'Certificato medico di sana e robusta costituzione', 'Modulo deleghe firmato']::text[],
  '[{"label":"Piscina","color":"royal"},{"label":"Giochi di squadra","color":"sun"}]'::jsonb, '[{"time":"07:30 - 09:00","title":"Buongiorno e accoglienza","description":"Anticipo facoltativo, giochi liberi e merenda di benvenuto.","icon":"sun","color":"sun"},{"time":"09:00 - 12:30","title":"Sport & avventura","description":"Attività sportive a rotazione: calcio, pallavolo, atletica.","icon":"ball","color":"grass"},{"time":"12:30 - 14:00","title":"Pranzo in compagnia","description":"Mensa con menù controllato e momento di relax.","icon":"lunch","color":"flame"},{"time":"14:00 - 16:00","title":"Laboratori creativi","description":"Arte, musica, costruzioni e mini-esperimenti.","icon":"art","color":"magic"},{"time":"16:00 - 17:30","title":"Giochi di squadra","description":"Tornei, cacce al tesoro e sfide a squadre.","icon":"team","color":"royal"},{"time":"17:30 - 18:30","title":"Saluti e posticipo","description":"Ritiro bambini, posticipo facoltativo fino alle 18:30.","icon":"hug","color":"sun"}]'::jsonb, '[{"q":"Posso iscrivere più di una settimana?","a":"Sì, basta selezionare tutte le settimane desiderate nel modulo di iscrizione."},{"q":"Il pranzo è incluso?","a":"Il pranzo è un servizio extra opzionale: puoi attivarlo durante l''iscrizione."},{"q":"Posso ritirare prima mio figlio?","a":"Certo. Puoi indicarlo allo staff anche la mattina stessa."},{"q":"Cosa serve per partecipare?","a":"Servono solo abbigliamento sportivo, cappellino, borraccia e tanta voglia di divertirsi!"}]'::jsonb, 'Prezzi e settimane DA CONFERMARE con l''associazione: valori placeholder importati da locations.ts.', 5);
insert into public.location_weeks (location_id, code, number, label, start_date, end_date, spots)
select l.id, v.code, v.number, v.label, v.start_date::date, v.end_date::date, v.spots
from public.locations l, (values
  ('w1', 1, '10 - 14 giugno', '2026-06-10', '2026-06-14', 12),
  ('w2', 2, '17 - 21 giugno', '2026-06-17', '2026-06-21', 10),
  ('w3', 3, '24 - 28 giugno', '2026-06-24', '2026-06-28', 8),
  ('w4', 4, '1 - 5 luglio', '2026-07-01', '2026-07-05', 14),
  ('w5', 5, '8 - 12 luglio', '2026-07-08', '2026-07-12', 9),
  ('w6', 6, '15 - 19 luglio', '2026-07-15', '2026-07-19', 11),
  ('w7', 7, '22 - 26 luglio', '2026-07-22', '2026-07-26', 7),
  ('w8', 8, '29 lug - 2 ago', '2026-07-29', '2026-08-02', 6)
) as v(code, number, label, start_date, end_date, spots)
where l.slug = 'sossano';
insert into public.location_extras (location_id, code, label, price, sort_order)
select l.id, v.code, v.label, v.price, v.sort_order
from public.locations l, (values
  ('anticipo', 'Anticipo (dalle 7:30)', 15, 0),
  ('posticipo', 'Posticipo (fino 18:30)', 15, 1),
  ('mensa', 'Mensa settimanale', 35, 2),
  ('gite', 'Uscita / gita', 20, 3)
) as v(code, label, price, sort_order)
where l.slug = 'sossano';

-- Orgiano
insert into public.locations (slug, type, status, name, comune, address, age_label, age_min, age_max, tagline, description, theme,
  contact_phone, contact_email, contact_manager, pricing, time_slots, activities, included_services, required_documents,
  badges, day_plan, faq, admin_notes, sort_order)
values ('orgiano', 'centro_estivo', 'pubblicata', 'Orgiano', 'Orgiano (VI)', 'Via Marconi 9 — Orgiano', '5-12 anni', 5, 12,
  'Una settimana di sport, amici e avventure!', 'Una sede pensata per far divertire i bambini con sport, laboratori e tantissimi nuovi amici. Lo staff Sportivissimo accompagna ogni piccolo atleta in una giornata piena di energia.', 'grass',
  '+39 049 0000000', 'info@sportivissimo.it', 'Lo staff Sportivissimo',
  '{"residentFullDay":115,"residentHalfDay":80,"nonResidentFullDay":135,"nonResidentHalfDay":100,"siblingDiscountFullDay":10,"siblingDiscountHalfDay":5,"membershipBase":10,"membershipSuperIntegrativa":30,"lateFee":15}'::jsonb, array['08:30 - 17:00 (tempo pieno)', '08:30 - 13:00 (mezza giornata)']::text[], array['Multisport', 'Escursioni', 'Laboratori']::text[], array['Tutte le attività sportive', 'Materiali per i laboratori', 'Merenda di metà mattina', 'Staff qualificato e assicurato', 'Maglietta Sportivissimo']::text[], array['Documento d''identità del genitore', 'Tessera sanitaria del bambino/a', 'Certificato medico di sana e robusta costituzione', 'Modulo deleghe firmato']::text[],
  '[{"label":"Sport","color":"flame"},{"label":"Natura","color":"grass"}]'::jsonb, '[{"time":"07:30 - 09:00","title":"Buongiorno e accoglienza","description":"Anticipo facoltativo, giochi liberi e merenda di benvenuto.","icon":"sun","color":"sun"},{"time":"09:00 - 12:30","title":"Sport & avventura","description":"Attività sportive a rotazione: calcio, pallavolo, atletica.","icon":"ball","color":"grass"},{"time":"12:30 - 14:00","title":"Pranzo in compagnia","description":"Mensa con menù controllato e momento di relax.","icon":"lunch","color":"flame"},{"time":"14:00 - 16:00","title":"Laboratori creativi","description":"Arte, musica, costruzioni e mini-esperimenti.","icon":"art","color":"magic"},{"time":"16:00 - 17:30","title":"Giochi di squadra","description":"Tornei, cacce al tesoro e sfide a squadre.","icon":"team","color":"royal"},{"time":"17:30 - 18:30","title":"Saluti e posticipo","description":"Ritiro bambini, posticipo facoltativo fino alle 18:30.","icon":"hug","color":"sun"}]'::jsonb, '[{"q":"Posso iscrivere più di una settimana?","a":"Sì, basta selezionare tutte le settimane desiderate nel modulo di iscrizione."},{"q":"Il pranzo è incluso?","a":"Il pranzo è un servizio extra opzionale: puoi attivarlo durante l''iscrizione."},{"q":"Posso ritirare prima mio figlio?","a":"Certo. Puoi indicarlo allo staff anche la mattina stessa."},{"q":"Cosa serve per partecipare?","a":"Servono solo abbigliamento sportivo, cappellino, borraccia e tanta voglia di divertirsi!"}]'::jsonb, 'Prezzi e settimane DA CONFERMARE con l''associazione: valori placeholder importati da locations.ts.', 6);
insert into public.location_weeks (location_id, code, number, label, start_date, end_date, spots)
select l.id, v.code, v.number, v.label, v.start_date::date, v.end_date::date, v.spots
from public.locations l, (values
  ('w1', 1, '10 - 14 giugno', '2026-06-10', '2026-06-14', 12),
  ('w2', 2, '17 - 21 giugno', '2026-06-17', '2026-06-21', 10),
  ('w3', 3, '24 - 28 giugno', '2026-06-24', '2026-06-28', 8),
  ('w4', 4, '1 - 5 luglio', '2026-07-01', '2026-07-05', 14),
  ('w5', 5, '8 - 12 luglio', '2026-07-08', '2026-07-12', 9),
  ('w6', 6, '15 - 19 luglio', '2026-07-15', '2026-07-19', 11),
  ('w7', 7, '22 - 26 luglio', '2026-07-22', '2026-07-26', 7),
  ('w8', 8, '29 lug - 2 ago', '2026-07-29', '2026-08-02', 6)
) as v(code, number, label, start_date, end_date, spots)
where l.slug = 'orgiano';
insert into public.location_extras (location_id, code, label, price, sort_order)
select l.id, v.code, v.label, v.price, v.sort_order
from public.locations l, (values
  ('anticipo', 'Anticipo (dalle 7:30)', 15, 0),
  ('posticipo', 'Posticipo (fino 18:30)', 15, 1),
  ('mensa', 'Mensa settimanale', 35, 2),
  ('gite', 'Uscita / gita', 20, 3)
) as v(code, label, price, sort_order)
where l.slug = 'orgiano';

-- Noventa Vicentina
insert into public.locations (slug, type, status, name, comune, address, age_label, age_min, age_max, tagline, description, theme,
  contact_phone, contact_email, contact_manager, pricing, time_slots, activities, included_services, required_documents,
  badges, day_plan, faq, admin_notes, sort_order)
values ('noventa-vicentina', 'centro_estivo', 'pubblicata', 'Noventa Vicentina', 'Noventa Vicentina (VI)', 'Via Roma 22 — Noventa Vicentina', '6-13 anni', 6, 13,
  'Una settimana di sport, amici e avventure!', 'Una sede pensata per far divertire i bambini con sport, laboratori e tantissimi nuovi amici. Lo staff Sportivissimo accompagna ogni piccolo atleta in una giornata piena di energia.', 'magic',
  '+39 049 0000000', 'info@sportivissimo.it', 'Lo staff Sportivissimo',
  '{"residentFullDay":135,"residentHalfDay":100,"nonResidentFullDay":155,"nonResidentHalfDay":120,"siblingDiscountFullDay":10,"siblingDiscountHalfDay":5,"membershipBase":10,"membershipSuperIntegrativa":30,"lateFee":15}'::jsonb, array['08:30 - 17:00 (tempo pieno)', '08:30 - 13:00 (mezza giornata)']::text[], array['Multisport', 'Piscina', 'Tornei', 'Laboratori']::text[], array['Tutte le attività sportive', 'Materiali per i laboratori', 'Merenda di metà mattina', 'Staff qualificato e assicurato', 'Maglietta Sportivissimo']::text[], array['Documento d''identità del genitore', 'Tessera sanitaria del bambino/a', 'Certificato medico di sana e robusta costituzione', 'Modulo deleghe firmato']::text[],
  '[{"label":"Multisport","color":"magic"},{"label":"Piscina","color":"royal"}]'::jsonb, '[{"time":"07:30 - 09:00","title":"Buongiorno e accoglienza","description":"Anticipo facoltativo, giochi liberi e merenda di benvenuto.","icon":"sun","color":"sun"},{"time":"09:00 - 12:30","title":"Sport & avventura","description":"Attività sportive a rotazione: calcio, pallavolo, atletica.","icon":"ball","color":"grass"},{"time":"12:30 - 14:00","title":"Pranzo in compagnia","description":"Mensa con menù controllato e momento di relax.","icon":"lunch","color":"flame"},{"time":"14:00 - 16:00","title":"Laboratori creativi","description":"Arte, musica, costruzioni e mini-esperimenti.","icon":"art","color":"magic"},{"time":"16:00 - 17:30","title":"Giochi di squadra","description":"Tornei, cacce al tesoro e sfide a squadre.","icon":"team","color":"royal"},{"time":"17:30 - 18:30","title":"Saluti e posticipo","description":"Ritiro bambini, posticipo facoltativo fino alle 18:30.","icon":"hug","color":"sun"}]'::jsonb, '[{"q":"Posso iscrivere più di una settimana?","a":"Sì, basta selezionare tutte le settimane desiderate nel modulo di iscrizione."},{"q":"Il pranzo è incluso?","a":"Il pranzo è un servizio extra opzionale: puoi attivarlo durante l''iscrizione."},{"q":"Posso ritirare prima mio figlio?","a":"Certo. Puoi indicarlo allo staff anche la mattina stessa."},{"q":"Cosa serve per partecipare?","a":"Servono solo abbigliamento sportivo, cappellino, borraccia e tanta voglia di divertirsi!"}]'::jsonb, 'Prezzi e settimane DA CONFERMARE con l''associazione: valori placeholder importati da locations.ts.', 7);
insert into public.location_weeks (location_id, code, number, label, start_date, end_date, spots)
select l.id, v.code, v.number, v.label, v.start_date::date, v.end_date::date, v.spots
from public.locations l, (values
  ('w1', 1, '10 - 14 giugno', '2026-06-10', '2026-06-14', 12),
  ('w2', 2, '17 - 21 giugno', '2026-06-17', '2026-06-21', 10),
  ('w3', 3, '24 - 28 giugno', '2026-06-24', '2026-06-28', 8),
  ('w4', 4, '1 - 5 luglio', '2026-07-01', '2026-07-05', 14),
  ('w5', 5, '8 - 12 luglio', '2026-07-08', '2026-07-12', 9),
  ('w6', 6, '15 - 19 luglio', '2026-07-15', '2026-07-19', 11),
  ('w7', 7, '22 - 26 luglio', '2026-07-22', '2026-07-26', 7),
  ('w8', 8, '29 lug - 2 ago', '2026-07-29', '2026-08-02', 6)
) as v(code, number, label, start_date, end_date, spots)
where l.slug = 'noventa-vicentina';
insert into public.location_extras (location_id, code, label, price, sort_order)
select l.id, v.code, v.label, v.price, v.sort_order
from public.locations l, (values
  ('anticipo', 'Anticipo (dalle 7:30)', 15, 0),
  ('posticipo', 'Posticipo (fino 18:30)', 15, 1),
  ('mensa', 'Mensa settimanale', 35, 2),
  ('gite', 'Uscita / gita', 20, 3)
) as v(code, label, price, sort_order)
where l.slug = 'noventa-vicentina';

-- Bastia / Frassanelle
insert into public.locations (slug, type, status, name, comune, address, age_label, age_min, age_max, tagline, description, theme,
  contact_phone, contact_email, contact_manager, pricing, time_slots, activities, included_services, required_documents,
  badges, day_plan, faq, admin_notes, sort_order)
values ('bastia-frassanelle', 'centro_estivo', 'pubblicata', 'Bastia / Frassanelle', 'Rovolon (PD)', 'Via Frassanelle 1 — Rovolon', '7-14 anni', 7, 14,
  'Una settimana di sport, amici e avventure!', 'Una sede pensata per far divertire i bambini con sport, laboratori e tantissimi nuovi amici. Lo staff Sportivissimo accompagna ogni piccolo atleta in una giornata piena di energia.', 'flame',
  '+39 049 0000000', 'info@sportivissimo.it', 'Lo staff Sportivissimo',
  '{"residentFullDay":140,"residentHalfDay":105,"nonResidentFullDay":160,"nonResidentHalfDay":125,"siblingDiscountFullDay":10,"siblingDiscountHalfDay":5,"membershipBase":10,"membershipSuperIntegrativa":30,"lateFee":15}'::jsonb, array['08:30 - 17:00 (tempo pieno)', '08:30 - 13:00 (mezza giornata)']::text[], array['Trekking', 'Mountain bike', 'Tiro con l''arco', 'Cacce al tesoro']::text[], array['Tutte le attività sportive', 'Materiali per i laboratori', 'Merenda di metà mattina', 'Staff qualificato e assicurato', 'Maglietta Sportivissimo']::text[], array['Documento d''identità del genitore', 'Tessera sanitaria del bambino/a', 'Certificato medico di sana e robusta costituzione', 'Modulo deleghe firmato']::text[],
  '[{"label":"Avventura","color":"flame"},{"label":"Natura","color":"grass"}]'::jsonb, '[{"time":"07:30 - 09:00","title":"Buongiorno e accoglienza","description":"Anticipo facoltativo, giochi liberi e merenda di benvenuto.","icon":"sun","color":"sun"},{"time":"09:00 - 12:30","title":"Sport & avventura","description":"Attività sportive a rotazione: calcio, pallavolo, atletica.","icon":"ball","color":"grass"},{"time":"12:30 - 14:00","title":"Pranzo in compagnia","description":"Mensa con menù controllato e momento di relax.","icon":"lunch","color":"flame"},{"time":"14:00 - 16:00","title":"Laboratori creativi","description":"Arte, musica, costruzioni e mini-esperimenti.","icon":"art","color":"magic"},{"time":"16:00 - 17:30","title":"Giochi di squadra","description":"Tornei, cacce al tesoro e sfide a squadre.","icon":"team","color":"royal"},{"time":"17:30 - 18:30","title":"Saluti e posticipo","description":"Ritiro bambini, posticipo facoltativo fino alle 18:30.","icon":"hug","color":"sun"}]'::jsonb, '[{"q":"Posso iscrivere più di una settimana?","a":"Sì, basta selezionare tutte le settimane desiderate nel modulo di iscrizione."},{"q":"Il pranzo è incluso?","a":"Il pranzo è un servizio extra opzionale: puoi attivarlo durante l''iscrizione."},{"q":"Posso ritirare prima mio figlio?","a":"Certo. Puoi indicarlo allo staff anche la mattina stessa."},{"q":"Cosa serve per partecipare?","a":"Servono solo abbigliamento sportivo, cappellino, borraccia e tanta voglia di divertirsi!"}]'::jsonb, 'Prezzi e settimane DA CONFERMARE con l''associazione: valori placeholder importati da locations.ts.', 8);
insert into public.location_weeks (location_id, code, number, label, start_date, end_date, spots)
select l.id, v.code, v.number, v.label, v.start_date::date, v.end_date::date, v.spots
from public.locations l, (values
  ('w1', 1, '10 - 14 giugno', '2026-06-10', '2026-06-14', 12),
  ('w2', 2, '17 - 21 giugno', '2026-06-17', '2026-06-21', 10),
  ('w3', 3, '24 - 28 giugno', '2026-06-24', '2026-06-28', 8),
  ('w4', 4, '1 - 5 luglio', '2026-07-01', '2026-07-05', 14),
  ('w5', 5, '8 - 12 luglio', '2026-07-08', '2026-07-12', 9),
  ('w6', 6, '15 - 19 luglio', '2026-07-15', '2026-07-19', 11),
  ('w7', 7, '22 - 26 luglio', '2026-07-22', '2026-07-26', 7),
  ('w8', 8, '29 lug - 2 ago', '2026-07-29', '2026-08-02', 6)
) as v(code, number, label, start_date, end_date, spots)
where l.slug = 'bastia-frassanelle';
insert into public.location_extras (location_id, code, label, price, sort_order)
select l.id, v.code, v.label, v.price, v.sort_order
from public.locations l, (values
  ('anticipo', 'Anticipo (dalle 7:30)', 15, 0),
  ('posticipo', 'Posticipo (fino 18:30)', 15, 1),
  ('mensa', 'Mensa settimanale', 35, 2),
  ('gite', 'Uscita / gita', 20, 3)
) as v(code, label, price, sort_order)
where l.slug = 'bastia-frassanelle';

-- ---------------------------------------------------------------------------
-- Vincolo referenziale: ogni iscrizione punta a una sede esistente. Lo slug
-- delle sedi pubblicate è immutabile (trigger), quindi il cascade serve solo
-- alle bozze.
-- ---------------------------------------------------------------------------
alter table public.enrollments
  add constraint enrollments_location_slug_fkey
  foreign key (location_slug) references public.locations(slug) on update cascade;

-- ---------------------------------------------------------------------------
-- RLS: lettura pubblica delle sedi pubblicate (anche anonimi), l'admin vede
-- anche le bozze; scrittura solo admin.
-- ---------------------------------------------------------------------------
alter table public.locations enable row level security;
alter table public.location_weeks enable row level security;
alter table public.location_extras enable row level security;

create policy "sedi pubblicate visibili a tutti" on public.locations
  for select using (status = 'pubblicata' or public.has_role(auth.uid(), 'admin'));
create policy "admin crea sedi" on public.locations
  for insert with check (public.has_role(auth.uid(), 'admin'));
create policy "admin aggiorna sedi" on public.locations
  for update using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "admin elimina sedi" on public.locations
  for delete using (public.has_role(auth.uid(), 'admin'));

create policy "settimane delle sedi visibili" on public.location_weeks
  for select using (
    exists (
      select 1 from public.locations l
      where l.id = location_id
        and (l.status = 'pubblicata' or public.has_role(auth.uid(), 'admin'))
    )
  );
create policy "admin gestisce settimane" on public.location_weeks
  for all using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "extra delle sedi visibili" on public.location_extras
  for select using (
    exists (
      select 1 from public.locations l
      where l.id = location_id
        and (l.status = 'pubblicata' or public.has_role(auth.uid(), 'admin'))
    )
  );
create policy "admin gestisce extra" on public.location_extras
  for all using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- Disponibilità: iscrizioni confermate per sede e settimana. Security definer
-- perché anche gli anonimi devono vedere i posti liberi, ma espone SOLO
-- conteggi aggregati (nessun dato personale).
-- ---------------------------------------------------------------------------
create or replace function public.location_week_occupancy()
returns table (location_slug text, week_code text, confirmed integer)
language sql
stable
security definer
set search_path = public
as $$
  select e.location_slug, w.code, count(*)::int
  from public.enrollments e
  cross join lateral unnest(e.week_ids) as w(code)
  where e.status = 'confermata'
  group by e.location_slug, w.code
$$;

revoke all on function public.location_week_occupancy() from public;
grant execute on function public.location_week_occupancy() to anon, authenticated;
