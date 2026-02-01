create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  phone text,
  role text not null check (role in ('professional', 'client')),
  professional_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  price numeric(10,2),
  professional_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  professional_id uuid not null references public.profiles(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_professional on public.profiles(professional_id);
create index if not exists idx_services_professional on public.services(professional_id);
create index if not exists idx_appointments_professional on public.appointments(professional_id, start_time);
create index if not exists idx_appointments_client on public.appointments(client_id, start_time);

alter table public.appointments
  add constraint appointments_professional_start_unique
  unique (professional_id, start_time);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists trg_services_updated_at on public.services;
create trigger trg_services_updated_at
before update on public.services
for each row execute function public.touch_updated_at();

drop trigger if exists trg_appointments_updated_at on public.appointments;
create trigger trg_appointments_updated_at
before update on public.appointments
for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.appointments enable row level security;

create policy "profiles_select_own" on public.profiles
for select using (id = auth.uid());

create policy "profiles_insert_own" on public.profiles
for insert with check (id = auth.uid());

create policy "profiles_update_own" on public.profiles
for update using (id = auth.uid());

create policy "services_select_all" on public.services
for select using (true);

create policy "services_manage_professional" on public.services
for all using (professional_id = auth.uid()) with check (professional_id = auth.uid());

create policy "appointments_select_professional" on public.appointments
for select using (professional_id = auth.uid() or client_id = auth.uid());

create policy "appointments_insert_professional" on public.appointments
for insert with check (professional_id = auth.uid() or client_id = auth.uid());

create policy "appointments_update_professional" on public.appointments
for update using (professional_id = auth.uid());

create policy "appointments_delete_professional" on public.appointments
for delete using (professional_id = auth.uid() or client_id = auth.uid());

