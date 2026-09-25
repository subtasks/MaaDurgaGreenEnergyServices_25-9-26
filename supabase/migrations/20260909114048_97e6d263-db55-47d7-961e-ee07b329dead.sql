create type public.app_role as enum ('admin','user');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'user',
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "own roles read" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cin text,
  gst text,
  address text,
  phone text,
  email text,
  created_at timestamptz not null default now()
);
grant select on public.organizations to authenticated;
grant insert, update, delete on public.organizations to authenticated;
grant all on public.organizations to service_role;
alter table public.organizations enable row level security;
create policy "orgs readable" on public.organizations for select to authenticated using (true);
create policy "admins manage orgs" on public.organizations for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.quotations (
  id uuid primary key default gen_random_uuid(),
  quote_id text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  organization_name text,
  issue_date date not null default current_date,
  valid_until date,
  subject text not null default 'Quotation for On Grid Solar System',
  customer jsonb not null default '{}'::jsonb,
  config jsonb not null default '{}'::jsonb,
  pricing_rows jsonb not null default '[]'::jsonb,
  bom jsonb not null default '[]'::jsonb,
  addons jsonb not null default '[]'::jsonb,
  show_qr boolean not null default false,
  terms text,
  notes text,
  capacity numeric not null default 0,
  system_type text,
  total numeric not null default 0,
  status text not null default 'active',
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.quotations to authenticated;
grant all on public.quotations to service_role;
alter table public.quotations enable row level security;
create policy "read own or admin" on public.quotations for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "insert own" on public.quotations for insert to authenticated with check (user_id = auth.uid());
create policy "update own or admin" on public.quotations for update to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin')) with check (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "delete own or admin" on public.quotations for delete to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create index quotations_user_idx on public.quotations(user_id);
create index quotations_created_idx on public.quotations(created_at desc);

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;
create trigger quotations_updated_at before update on public.quotations for each row execute function public.set_updated_at();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), new.email)
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

insert into public.organizations (name, cin, gst, address, phone, email) values
('ENA Solar Pvt. Ltd.', 'U40106DL2019PTC352145', '07AAGCE9382P1ZK', 'B-45, Okhla Industrial Area Phase II, New Delhi 110020', '+91 98110 45678', 'sales@enasolar.in'),
('ENA Renewables LLP', 'AAP-4521', '09AAJFE2214L1ZQ', 'Plot 12, Sector 63, Noida, Uttar Pradesh 201301', '+91 98110 99881', 'projects@enarenewables.in');