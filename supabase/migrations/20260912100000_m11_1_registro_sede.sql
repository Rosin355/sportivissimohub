-- M11.1 — Registro sede: schema dati (replica digitale del gestionale Excel).
--
-- Modello del cliente tradotto in tabelle:
--   foglio ISCRIZIONI  -> location_frequency_codes (legenda codici/prezzi per
--                         sede) + enrollment_week_codes (la cella bambino ×
--                         settimana) + extra_charges (gita, fuori quota) +
--                         payments (le 8 colonne BON/CONT diventano N rate)
--   cassa              -> cash_movements (spese e consegne contanti)
--   foglio PRESENZE    -> attendance.mark, staff_attendance, daily_meals
--
-- Regole di fondo:
--  * la QUOTA non si memorizza mai: si calcola dal database con
--    location_registry_totals() (mai dal client).
--  * la GITA è voce separata: SALDO = quota + extra − versato. Il bug del file
--    del cliente (la formula saldo salta BON.3/CONT.3) non viene replicato:
--    qui il versato è la somma di TUTTE le rate.
--  * i genitori non vedono nulla di questo modulo, salvo i propri pagamenti in
--    sola lettura. Lo staff vede solo ciò che gli serve per le presenze
--    (codici di frequenza e celle), mai gli importi.

-- ---------------------------------------------------------------------------
-- Enum
-- ---------------------------------------------------------------------------

-- Categoria e fascia del codice di frequenza (MC = primaria/mezza/convenzione).
create type public.frequency_category as enum ('primaria', 'asilo');
create type public.frequency_band as enum ('mezza', 'intera');

-- Addebiti fuori quota. Oggi serve solo la gita; 'altro' evita una migrazione
-- al primo addebito diverso.
create type public.extra_charge_type as enum ('gita', 'altro');

create type public.payment_method as enum ('bonifico', 'contanti');

-- Movimenti di cassa non legati a un'iscrizione: uscite per spese e consegne
-- del contante all'associazione.
create type public.cash_movement_kind as enum ('spesa', 'consegna', 'altro');

-- Marcature di presenza. Nei fogli del cliente la "P" è ambigua (presente o
-- pomeriggio): qui i valori sono distinti e l'interfaccia mostra le etichette
-- che il cliente conosce.
--   intera     = I  (giornata intera, conta per i pasti)
--   mattina    = M  (solo mattina)
--   pomeriggio = P  (solo pomeriggio)
--   presente   = P  (presente senza fascia indicata)
--   assente    = A
create type public.attendance_mark as enum (
  'intera', 'mattina', 'pomeriggio', 'presente', 'assente'
);

create type public.meal_order_status as enum ('da_ordinare', 'ordinato', 'confermato');

-- ---------------------------------------------------------------------------
-- Legenda codici di frequenza, configurabile per sede (niente hardcoding).
-- ---------------------------------------------------------------------------
create table public.location_frequency_codes (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  code text not null,                  -- MC, IC, M, I, AMC, AIC, AM, AI…
  label text not null,
  category public.frequency_category not null,
  band public.frequency_band not null,
  convenzione boolean not null default false,  -- residente/convenzionato col comune
  price numeric(8, 2) not null default 0,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  constraint location_frequency_codes_unique_code unique (location_id, code),
  constraint location_frequency_codes_code_format check (code ~ '^[A-Z0-9]{1,8}$'),
  constraint location_frequency_codes_label_not_empty check (char_length(trim(label)) > 0),
  constraint location_frequency_codes_price_nonneg check (price >= 0)
);

create index location_frequency_codes_location_idx
  on public.location_frequency_codes (location_id, sort_order);

-- Il code è referenziato dalle celle già compilate: non si modifica più, e
-- nemmeno la sede. Un codice che non si usa più si disattiva.
create or replace function public.location_frequency_codes_lock()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.code <> old.code or new.location_id <> old.location_id then
    raise exception 'Codice e sede di un codice di frequenza non si possono modificare';
  end if;
  return new;
end;
$$;

create trigger location_frequency_codes_lock
  before update on public.location_frequency_codes
  for each row execute function public.location_frequency_codes_lock();

-- ---------------------------------------------------------------------------
-- La cella della matrice: quale codice di frequenza ha quel bambino in quella
-- settimana. week_code è coerente con location_weeks.code (come
-- enrollments.week_ids): la coerenza con la sede è garantita dal trigger.
-- ---------------------------------------------------------------------------
create table public.enrollment_week_codes (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  week_code text not null,
  frequency_code text not null,
  updated_at timestamptz not null default now(),
  constraint enrollment_week_codes_unique unique (enrollment_id, week_code)
);

create index enrollment_week_codes_enrollment_idx
  on public.enrollment_week_codes (enrollment_id);

create trigger enrollment_week_codes_updated_at
  before update on public.enrollment_week_codes
  for each row execute function public.set_updated_at();

-- Security definer: la validazione deve funzionare anche quando chi scrive non
-- ha visibilità diretta su tutte le tabelle di riferimento.
create or replace function public.enrollment_week_codes_validate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _slug text;
begin
  select e.location_slug into _slug
  from public.enrollments e
  where e.id = new.enrollment_id;
  if _slug is null then
    raise exception 'Iscrizione non trovata';
  end if;

  if not exists (
    select 1
    from public.location_weeks w
    join public.locations l on l.id = w.location_id
    where l.slug = _slug and w.code = new.week_code
  ) then
    raise exception 'La settimana % non esiste nella sede %', new.week_code, _slug;
  end if;

  if not exists (
    select 1
    from public.location_frequency_codes f
    join public.locations l on l.id = f.location_id
    where l.slug = _slug and f.code = new.frequency_code
  ) then
    raise exception 'Il codice di frequenza % non esiste nella sede %', new.frequency_code, _slug;
  end if;

  return new;
end;
$$;

create trigger enrollment_week_codes_validate
  before insert or update on public.enrollment_week_codes
  for each row execute function public.enrollment_week_codes_validate();

-- ---------------------------------------------------------------------------
-- Addebiti fuori quota (gita). NON entrano nel calcolo della quota: la griglia
-- li mostra in colonna separata e il saldo li somma a parte.
-- ---------------------------------------------------------------------------
create table public.extra_charges (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  charge_type public.extra_charge_type not null default 'gita',
  description text not null default '',
  amount numeric(8, 2) not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint extra_charges_amount_nonzero check (amount <> 0)
);

create index extra_charges_enrollment_idx on public.extra_charges (enrollment_id);

-- ---------------------------------------------------------------------------
-- Rate versate. Sostituisce le 8 colonne fisse BON.1-4 / CONT.1-4: righe
-- libere, importi negativi ammessi (rimborsi, es. "restituiti soldi" -10).
-- ---------------------------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  amount numeric(10, 2) not null,
  method public.payment_method not null,
  paid_on date not null default current_date,
  note text not null default '',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint payments_amount_nonzero check (amount <> 0)
);

create index payments_enrollment_idx on public.payments (enrollment_id, paid_on);

-- ---------------------------------------------------------------------------
-- Cassa di sede: spese e consegne di contante, che non appartengono a nessuna
-- iscrizione. Scelta documentata: tabella separata invece di payments con
-- enrollment_id nullo, perché il legame con l'iscrizione qui è obbligatorio
-- (ogni rata è di un bambino), le regole di accesso sono diverse (il genitore
-- legge le proprie rate, mai la cassa) e ogni somma su payments resterebbe
-- altrimenti condizionata. amount è firmato rispetto alla cassa: negativo per
-- le uscite (spese, consegne), positivo per eventuali entrate di rettifica.
-- ---------------------------------------------------------------------------
create table public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  kind public.cash_movement_kind not null default 'spesa',
  amount numeric(10, 2) not null,
  method public.payment_method not null default 'contanti',
  moved_on date not null default current_date,
  description text not null default '',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint cash_movements_amount_nonzero check (amount <> 0)
);

create index cash_movements_location_idx on public.cash_movements (location_id, moved_on);

-- ---------------------------------------------------------------------------
-- Presenze estese. La marcatura si affianca a check-in/check-out della M8:
-- le righe esistenti restano valide, mark è nullo finché non viene indicato.
-- ---------------------------------------------------------------------------
alter table public.attendance
  add column mark public.attendance_mark;

-- Animatori e staff in servizio: nome libero, perché non tutti hanno un account.
create table public.staff_attendance (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  staff_name text not null,
  day date not null,
  mark public.attendance_mark not null,
  note text not null default '',
  recorded_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint staff_attendance_name_not_empty check (char_length(trim(staff_name)) > 0),
  constraint staff_attendance_unique unique (location_id, staff_name, day)
);

create index staff_attendance_location_idx on public.staff_attendance (location_id, day);

-- Pasti del giorno: i pasti dei bambini si calcolano dalle presenze a giornata
-- intera, ma qui resta il numero effettivamente ordinato (che può differire dal
-- ricalcolo successivo: l'ordine si fa la mattina).
create table public.daily_meals (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  day date not null,
  meals_children int not null default 0,
  meals_staff int not null default 0,
  status public.meal_order_status not null default 'da_ordinare',
  note text not null default '',
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  constraint daily_meals_unique unique (location_id, day),
  constraint daily_meals_children_nonneg check (meals_children >= 0),
  constraint daily_meals_staff_nonneg check (meals_staff >= 0)
);

create index daily_meals_location_idx on public.daily_meals (location_id, day);

create trigger daily_meals_updated_at
  before update on public.daily_meals
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Totali del registro, calcolati SEMPRE dal database (mai dal client).
--   quota   = Σ (prezzo del codice di ogni settimana) + tessera
--   extra   = Σ addebiti fuori quota (di cui gita in colonna separata)
--   versato = Σ di TUTTE le rate (il bug BON.3/CONT.3 del file Excel non è
--             replicato); i rimborsi sono importi negativi e riducono il versato
--   saldo   = quota + extra − versato
-- security invoker (default): le RLS di chi chiama restano in vigore, quindi la
-- funzione non espone nulla che l'utente non possa già leggere. È inoltre
-- riservata all'admin: a chi non lo è restituisce zero righe invece di un
-- totale parziale (le celle e gli importi non gli sono leggibili, quindi le
-- somme risulterebbero sbagliate anziché semplicemente assenti).
-- ---------------------------------------------------------------------------
create or replace function public.location_registry_totals(_location_slug text)
returns table (
  enrollment_id uuid,
  weeks_total numeric,
  tessera numeric,
  quota numeric,
  gita numeric,
  extra_total numeric,
  versato numeric,
  saldo numeric
)
language sql
stable
set search_path = public
as $$
  select
    e.id,
    coalesce(w.total, 0) as weeks_total,
    coalesce(
      (l.pricing ->> (case when e.tessera_tipo = 'super_integrativa'
                           then 'membershipSuperIntegrativa'
                           else 'membershipBase' end))::numeric,
      0
    ) as tessera,
    coalesce(w.total, 0) + coalesce(
      (l.pricing ->> (case when e.tessera_tipo = 'super_integrativa'
                           then 'membershipSuperIntegrativa'
                           else 'membershipBase' end))::numeric,
      0
    ) as quota,
    coalesce(x.gita, 0) as gita,
    coalesce(x.total, 0) as extra_total,
    coalesce(p.total, 0) as versato,
    coalesce(w.total, 0)
      + coalesce(
          (l.pricing ->> (case when e.tessera_tipo = 'super_integrativa'
                               then 'membershipSuperIntegrativa'
                               else 'membershipBase' end))::numeric,
          0
        )
      + coalesce(x.total, 0)
      - coalesce(p.total, 0) as saldo
  from public.enrollments e
  join public.locations l on l.slug = e.location_slug
  left join lateral (
    select sum(f.price) as total
    from public.enrollment_week_codes c
    join public.location_frequency_codes f
      on f.location_id = l.id and f.code = c.frequency_code
    where c.enrollment_id = e.id
  ) w on true
  left join lateral (
    select
      sum(ec.amount) as total,
      sum(ec.amount) filter (where ec.charge_type = 'gita') as gita
    from public.extra_charges ec
    where ec.enrollment_id = e.id
  ) x on true
  left join lateral (
    select sum(pm.amount) as total
    from public.payments pm
    where pm.enrollment_id = e.id
  ) p on true
  where e.location_slug = _location_slug
    and public.has_role(auth.uid(), 'admin')
$$;

revoke all on function public.location_registry_totals(text) from public;
grant execute on function public.location_registry_totals(text) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS. Minimo privilegio: lo staff vede i codici di frequenza e le celle
-- (gli servono per le presenze e per capire chi fa giornata intera), mai gli
-- importi; il genitore vede soltanto le proprie rate, in sola lettura.
-- ---------------------------------------------------------------------------
alter table public.location_frequency_codes enable row level security;
alter table public.enrollment_week_codes enable row level security;
alter table public.extra_charges enable row level security;
alter table public.payments enable row level security;
alter table public.cash_movements enable row level security;
alter table public.staff_attendance enable row level security;
alter table public.daily_meals enable row level security;

-- Codici di frequenza: lettura staff e admin, scrittura solo admin.
create policy "staff legge i codici di frequenza" on public.location_frequency_codes
  for select using (public.has_role(auth.uid(), 'staff'));
create policy "admin legge i codici di frequenza" on public.location_frequency_codes
  for select using (public.has_role(auth.uid(), 'admin'));
create policy "admin crea codici di frequenza" on public.location_frequency_codes
  for insert with check (public.has_role(auth.uid(), 'admin'));
create policy "admin aggiorna codici di frequenza" on public.location_frequency_codes
  for update using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "admin elimina codici di frequenza" on public.location_frequency_codes
  for delete using (public.has_role(auth.uid(), 'admin'));

-- Celle della matrice: lettura staff e admin, scrittura solo admin.
create policy "staff legge le celle del registro" on public.enrollment_week_codes
  for select using (public.has_role(auth.uid(), 'staff'));
create policy "admin legge le celle del registro" on public.enrollment_week_codes
  for select using (public.has_role(auth.uid(), 'admin'));
create policy "admin compila le celle del registro" on public.enrollment_week_codes
  for insert with check (public.has_role(auth.uid(), 'admin'));
create policy "admin aggiorna le celle del registro" on public.enrollment_week_codes
  for update using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "admin svuota le celle del registro" on public.enrollment_week_codes
  for delete using (public.has_role(auth.uid(), 'admin'));

-- Addebiti fuori quota: solo admin (dato economico).
create policy "admin legge gli addebiti extra" on public.extra_charges
  for select using (public.has_role(auth.uid(), 'admin'));
create policy "admin crea addebiti extra" on public.extra_charges
  for insert with check (public.has_role(auth.uid(), 'admin'));
create policy "admin aggiorna addebiti extra" on public.extra_charges
  for update using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "admin elimina addebiti extra" on public.extra_charges
  for delete using (public.has_role(auth.uid(), 'admin'));

-- Rate: admin gestisce, il genitore legge soltanto le proprie.
create policy "genitore legge i pagamenti delle proprie iscrizioni" on public.payments
  for select using (
    exists (
      select 1 from public.enrollments e
      where e.id = enrollment_id and e.parent_id = auth.uid()
    )
  );
create policy "admin legge i pagamenti" on public.payments
  for select using (public.has_role(auth.uid(), 'admin'));
create policy "admin registra i pagamenti" on public.payments
  for insert with check (public.has_role(auth.uid(), 'admin'));
create policy "admin aggiorna i pagamenti" on public.payments
  for update using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "admin elimina i pagamenti" on public.payments
  for delete using (public.has_role(auth.uid(), 'admin'));

-- Cassa di sede: solo admin.
create policy "admin legge la cassa" on public.cash_movements
  for select using (public.has_role(auth.uid(), 'admin'));
create policy "admin registra movimenti di cassa" on public.cash_movements
  for insert with check (public.has_role(auth.uid(), 'admin'));
create policy "admin aggiorna movimenti di cassa" on public.cash_movements
  for update using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "admin elimina movimenti di cassa" on public.cash_movements
  for delete using (public.has_role(auth.uid(), 'admin'));

-- Presenze staff e pasti: come le presenze dei bambini (staff scrive, admin
-- legge e corregge).
create policy "staff legge le presenze staff" on public.staff_attendance
  for select using (public.has_role(auth.uid(), 'staff'));
create policy "staff registra le presenze staff" on public.staff_attendance
  for insert with check (public.has_role(auth.uid(), 'staff'));
create policy "staff aggiorna le presenze staff" on public.staff_attendance
  for update using (public.has_role(auth.uid(), 'staff'));
create policy "admin gestisce le presenze staff" on public.staff_attendance
  for all using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "staff legge i pasti" on public.daily_meals
  for select using (public.has_role(auth.uid(), 'staff'));
create policy "staff registra i pasti" on public.daily_meals
  for insert with check (public.has_role(auth.uid(), 'staff'));
create policy "staff aggiorna i pasti" on public.daily_meals
  for update using (public.has_role(auth.uid(), 'staff'));
create policy "admin gestisce i pasti" on public.daily_meals
  for all using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Su Lovable Cloud i privilegi non arrivano dai default.
grant select, insert, update, delete on public.location_frequency_codes to authenticated;
grant select, insert, update, delete on public.enrollment_week_codes to authenticated;
grant select, insert, update, delete on public.extra_charges to authenticated;
grant select, insert, update, delete on public.payments to authenticated;
grant select, insert, update, delete on public.cash_movements to authenticated;
grant select, insert, update, delete on public.staff_attendance to authenticated;
grant select, insert, update, delete on public.daily_meals to authenticated;

-- ---------------------------------------------------------------------------
-- Seed: gli 8 codici standard con i prezzi Asigliano per ogni sede esistente.
-- Sono default modificabili dall'editor, non valori di sistema.
-- ---------------------------------------------------------------------------
insert into public.location_frequency_codes
  (location_id, code, label, category, band, convenzione, price, sort_order)
select l.id, v.code, v.label, v.category::public.frequency_category,
       v.band::public.frequency_band, v.convenzione, v.price, v.sort_order
from public.locations l,
  (values
    ('MC',  'Mezza giornata primaria — convenzione',      'primaria', 'mezza',  true,  30.00, 1),
    ('IC',  'Giornata intera primaria — convenzione',     'primaria', 'intera', true,  60.00, 2),
    ('M',   'Mezza giornata primaria',                    'primaria', 'mezza',  false, 55.00, 3),
    ('I',   'Giornata intera primaria',                   'primaria', 'intera', false, 90.00, 4),
    ('AMC', 'Mezza giornata asilo — convenzione',         'asilo',    'mezza',  true,  30.00, 5),
    ('AIC', 'Giornata intera asilo — convenzione',        'asilo',    'intera', true,  60.00, 6),
    ('AM',  'Mezza giornata asilo',                       'asilo',    'mezza',  false, 55.00, 7),
    ('AI',  'Giornata intera asilo',                      'asilo',    'intera', false, 90.00, 8)
  ) as v(code, label, category, band, convenzione, price, sort_order)
on conflict (location_id, code) do nothing;

-- ---------------------------------------------------------------------------
-- Popolamento iniziale delle celle dalle iscrizioni già registrate:
--   fascia      = dalla fascia oraria scelta nell'iscrizione
--   convenzione = residente_nel_comune
--   categoria   = primaria se il bambino compie almeno 6 anni nell'anno
--                 dell'iscrizione, altrimenti asilo (euristica dichiarata:
--                 l'admin corregge dalla griglia quando serve)
-- Solo settimane e codici realmente esistenti nella sede.
-- ---------------------------------------------------------------------------
insert into public.enrollment_week_codes (enrollment_id, week_code, frequency_code)
select
  e.id,
  wk.code,
  derived.code
from public.enrollments e
join public.children ch on ch.id = e.child_id
join public.locations l on l.slug = e.location_slug
cross join lateral unnest(e.week_ids) as wk(code)
join public.location_weeks w on w.location_id = l.id and w.code = wk.code
cross join lateral (
  select
    (case when (extract(year from e.created_at)::int - extract(year from ch.birth_date)::int) >= 6
          then '' else 'A' end)
    || (case when e.time_slot ilike '%intera%' then 'I' else 'M' end)
    || (case when e.residente_nel_comune then 'C' else '' end)
    as code
) as derived
join public.location_frequency_codes f
  on f.location_id = l.id and f.code = derived.code
on conflict (enrollment_id, week_code) do nothing;
