-- M8 — Presenze giornaliere (check-in/check-out) registrate dallo staff.

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  day date not null,
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  recorded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (enrollment_id, day)
);

alter table public.attendance enable row level security;

-- staff scrive (e rilegge quello che serve per la giornata)
create policy "staff legge le presenze" on public.attendance
  for select using (public.has_role(auth.uid(), 'staff'));
create policy "staff registra le presenze" on public.attendance
  for insert with check (public.has_role(auth.uid(), 'staff') and recorded_by = auth.uid());
create policy "staff aggiorna le presenze" on public.attendance
  for update using (public.has_role(auth.uid(), 'staff'));

-- admin legge
create policy "admin legge le presenze" on public.attendance
  for select using (public.has_role(auth.uid(), 'admin'));
