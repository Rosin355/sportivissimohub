-- M1 — Autenticazione: profili, ruoli, trigger di registrazione.
create type public.app_role as enum ('genitore', 'staff', 'admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  first_name text not null default '',
  last_name text not null default '',
  phone text not null default '',
  fiscal_code text not null default '',
  address text,
  city text,
  province text,
  zip text,
  created_at timestamptz not null default now(),
  constraint profiles_fiscal_code_len check (fiscal_code = '' or char_length(fiscal_code) = 16)
);

grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  primary key (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, phone)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  );
  insert into public.user_roles (user_id, role)
  values (new.id, 'genitore')
  on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

create policy "utente legge il proprio profilo" on public.profiles
  for select using (id = auth.uid());
create policy "utente aggiorna il proprio profilo" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy "admin legge tutti i profili" on public.profiles
  for select using (public.has_role(auth.uid(), 'admin'));

create policy "utente legge i propri ruoli" on public.user_roles
  for select using (user_id = auth.uid());
create policy "admin legge tutti i ruoli" on public.user_roles
  for select using (public.has_role(auth.uid(), 'admin'));
create policy "admin gestisce i ruoli" on public.user_roles
  for insert with check (public.has_role(auth.uid(), 'admin'));
create policy "admin aggiorna i ruoli" on public.user_roles
  for update using (public.has_role(auth.uid(), 'admin'));
create policy "admin elimina i ruoli" on public.user_roles
  for delete using (public.has_role(auth.uid(), 'admin'));