-- M9.1 — Dati completi per modulistica ACSI/comunale e prezzi reali.
create type public.child_sex as enum ('M', 'F');
create type public.tessera_tipo as enum ('base', 'super_integrativa');

alter table public.children
  add column sesso public.child_sex,
  add column comune_nascita text,
  add column provincia_nascita text,
  add column nazione_nascita text default 'Italia',
  add column has_italian_cf boolean not null default true,
  add column cittadinanza text,
  add column nazione_residenza text,
  add column tipo_documento text,
  add column numero_documento text;

alter table public.children alter column fiscal_code drop not null;
alter table public.children drop constraint children_fiscal_code_len;
alter table public.children add constraint children_cf_or_foreign check (
  (
    has_italian_cf
    and fiscal_code is not null
    and char_length(fiscal_code) = 16
  )
  or (
    not has_italian_cf
    and cittadinanza is not null
    and nazione_residenza is not null
    and tipo_documento is not null
    and numero_documento is not null
  )
);

alter table public.enrollments
  add column secondary_guardian jsonb,
  add column residente_nel_comune boolean not null default false,
  add column tessera_tipo public.tessera_tipo not null default 'base',
  add column figlio_ordine int not null default 1,
  add column consent_acsi_dati_24 boolean not null default false,
  add column consent_acsi_dati_25 boolean not null default false,
  add column consent_acsi_foto_marketing boolean not null default false;

alter table public.enrollments
  add constraint enrollments_figlio_ordine_positive check (figlio_ordine >= 1);