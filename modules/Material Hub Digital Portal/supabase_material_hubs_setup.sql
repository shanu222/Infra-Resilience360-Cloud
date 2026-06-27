-- Material Hubs Portal live backend setup (Supabase)
-- Run in Supabase SQL Editor

create extension if not exists pgcrypto;

create table if not exists public.material_hubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null,
  district text not null,
  latitude double precision not null,
  longitude double precision not null,
  capacity integer not null default 0,
  status text not null default 'ready' check (status in ('ready', 'moderate', 'critical')),
  stock_percentage integer not null default 0,
  damage_percentage integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hub_material_entries (
  id uuid primary key default gen_random_uuid(),
  hub_id uuid not null references public.material_hubs(id) on delete cascade,
  name text not null,
  unit text not null,
  opening integer not null default 0,
  received integer not null default 0,
  issued integer not null default 0,
  closing integer not null default 0,
  damaged integer not null default 0,
  percentage_remaining integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Optional normalized tables aligned with hub/material/inventory naming
create table if not exists public.hubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  total_quantity integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  hub_id uuid not null references public.hubs(id) on delete cascade,
  material_id uuid not null references public.materials(id) on delete cascade,
  quantity integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(hub_id, material_id)
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_material_hubs on public.material_hubs;
create trigger trg_touch_material_hubs
before update on public.material_hubs
for each row execute procedure public.touch_updated_at();

drop trigger if exists trg_touch_hub_material_entries on public.hub_material_entries;
create trigger trg_touch_hub_material_entries
before update on public.hub_material_entries
for each row execute procedure public.touch_updated_at();

drop trigger if exists trg_touch_hubs on public.hubs;
create trigger trg_touch_hubs
before update on public.hubs
for each row execute procedure public.touch_updated_at();

drop trigger if exists trg_touch_materials on public.materials;
create trigger trg_touch_materials
before update on public.materials
for each row execute procedure public.touch_updated_at();

drop trigger if exists trg_touch_inventory on public.inventory;
create trigger trg_touch_inventory
before update on public.inventory
for each row execute procedure public.touch_updated_at();

alter table public.material_hubs enable row level security;
alter table public.hub_material_entries enable row level security;
alter table public.hubs enable row level security;
alter table public.materials enable row level security;
alter table public.inventory enable row level security;

-- Public read access
drop policy if exists material_hubs_select_all on public.material_hubs;
create policy material_hubs_select_all
on public.material_hubs
for select
using (true);

drop policy if exists hub_material_entries_select_all on public.hub_material_entries;
create policy hub_material_entries_select_all
on public.hub_material_entries
for select
using (true);

drop policy if exists hubs_select_all on public.hubs;
create policy hubs_select_all
on public.hubs
for select
using (true);

drop policy if exists materials_select_all on public.materials;
create policy materials_select_all
on public.materials
for select
using (true);

drop policy if exists inventory_select_all on public.inventory;
create policy inventory_select_all
on public.inventory
for select
using (true);

-- Authenticated users (admins) can write
drop policy if exists material_hubs_write_authenticated on public.material_hubs;
create policy material_hubs_write_authenticated
on public.material_hubs
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists hub_material_entries_write_authenticated on public.hub_material_entries;
create policy hub_material_entries_write_authenticated
on public.hub_material_entries
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists hubs_write_authenticated on public.hubs;
create policy hubs_write_authenticated
on public.hubs
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists materials_write_authenticated on public.materials;
create policy materials_write_authenticated
on public.materials
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists inventory_write_authenticated on public.inventory;
create policy inventory_write_authenticated
on public.inventory
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

do $$
begin
  begin
    alter publication supabase_realtime add table public.material_hubs;
  exception
    when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.hub_material_entries;
  exception
    when duplicate_object then null;
  end;
end
$$;

-- Optional starter data
insert into public.material_hubs (name, location, district, latitude, longitude, capacity, status, stock_percentage, damage_percentage)
select 'Gilgit Material Hub', 'Gilgit', 'Gilgit-Baltistan', 35.9208, 74.3080, 200, 'ready', 100, 0
where not exists (select 1 from public.material_hubs where name = 'Gilgit Material Hub');

insert into public.material_hubs (name, location, district, latitude, longitude, capacity, status, stock_percentage, damage_percentage)
select 'Muzaffargarh Material Hub', 'Muzaffargarh', 'Muzaffargarh', 30.0704, 71.1932, 200, 'ready', 100, 0
where not exists (select 1 from public.material_hubs where name = 'Muzaffargarh Material Hub');

insert into public.material_hubs (name, location, district, latitude, longitude, capacity, status, stock_percentage, damage_percentage)
select 'Sukkur Material Hub', 'Sukkur', 'Sukkur', 27.7052, 68.8574, 200, 'ready', 92, 0
where not exists (select 1 from public.material_hubs where name = 'Sukkur Material Hub');

with target_hubs as (
  select id, name
  from public.material_hubs
  where name in ('Gilgit Material Hub', 'Muzaffargarh Material Hub', 'Sukkur Material Hub')
)
delete from public.hub_material_entries e
using target_hubs h
where e.hub_id = h.id;

insert into public.hub_material_entries (hub_id, name, unit, opening, received, issued, closing, damaged, percentage_remaining)
select h.id, v.name, 'units', v.opening, 0, 0, v.opening, 0,
  case when v.opening > 0 then 100 else 0 end
from public.material_hubs h
join (
  values
    ('Gilgit Material Hub', 'Bamboos (for Joist)', 1070),
    ('Gilgit Material Hub', 'Bamboo (for Purlins & Walls)', 2540),
    ('Gilgit Material Hub', 'Bamboo (for Ring Beams)', 1070),
    ('Gilgit Material Hub', 'Wooden Stick Chick Mat', 870),
    ('Gilgit Material Hub', 'Polythene Sheet', 140),
    ('Gilgit Material Hub', 'Cotton Rope', 13),
    ('Gilgit Material Hub', 'Steel Girder (H beam)', 35),
    ('Gilgit Material Hub', 'CGI', 400),
    ('Gilgit Material Hub', 'Wooden Planks 1', 170),
    ('Gilgit Material Hub', 'Wooden Planks 2', 170),
    ('Gilgit Material Hub', 'EPS Panels', 340),
    ('Gilgit Material Hub', 'Pallets', 200),
    ('Muzaffargarh Material Hub', 'Bamboos (for Joist)', 1070),
    ('Muzaffargarh Material Hub', 'Bamboo (for Purlins & Walls)', 2530),
    ('Muzaffargarh Material Hub', 'Bamboo (for Ring Beams)', 1070),
    ('Muzaffargarh Material Hub', 'Wooden Stick Chick Mat', 870),
    ('Muzaffargarh Material Hub', 'Polythene Sheet', 130),
    ('Muzaffargarh Material Hub', 'Cotton Rope', 14),
    ('Muzaffargarh Material Hub', 'Steel Girder (H beam)', 30),
    ('Muzaffargarh Material Hub', 'CGI', 200),
    ('Muzaffargarh Material Hub', 'Wooden Planks 1', 170),
    ('Muzaffargarh Material Hub', 'Wooden Planks 2', 170),
    ('Muzaffargarh Material Hub', 'EPS Panels', 330),
    ('Muzaffargarh Material Hub', 'Pallets', 200),
    ('Sukkur Material Hub', 'Bamboos (for Joist)', 1060),
    ('Sukkur Material Hub', 'Bamboo (for Purlins & Walls)', 2530),
    ('Sukkur Material Hub', 'Bamboo (for Ring Beams)', 1060),
    ('Sukkur Material Hub', 'Wooden Stick Chick Mat', 860),
    ('Sukkur Material Hub', 'Polythene Sheet', 130),
    ('Sukkur Material Hub', 'Cotton Rope', 13),
    ('Sukkur Material Hub', 'Steel Girder (H beam)', 35),
    ('Sukkur Material Hub', 'CGI', 0),
    ('Sukkur Material Hub', 'Wooden Planks 1', 160),
    ('Sukkur Material Hub', 'Wooden Planks 2', 160),
    ('Sukkur Material Hub', 'EPS Panels', 330),
    ('Sukkur Material Hub', 'Pallets', 200)
) as v(hub_name, name, opening) on h.name = v.hub_name;
