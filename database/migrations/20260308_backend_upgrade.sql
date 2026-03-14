-- Backend migration for Unlock Hidden Belgium
-- Date: 2026-03-08

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------
-- 1) User profile enrichment (used by buddies/matching fallback)
-- ------------------------------------------------------------------
alter table if exists public.users add column if not exists city text;
alter table if exists public.users add column if not exists travel_style text default 'balanced';
alter table if exists public.users add column if not exists interests text[] default '{}';
alter table if exists public.users add column if not exists availability text default 'Flexible';
alter table if exists public.users add column if not exists bio text default '';
alter table if exists public.users add column if not exists avatar_url text default '';

-- ------------------------------------------------------------------
-- 2) Buddy matching tables
-- ------------------------------------------------------------------
create table if not exists public.buddy_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  display_name text not null default 'Explorer',
  city text not null default '',
  interests text[] not null default '{}',
  travel_style text not null default 'balanced' check (travel_style in ('slow', 'balanced', 'active')),
  availability text not null default 'Flexible',
  bio text not null default '',
  avatar_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.buddy_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  city text not null default '',
  travel_style text not null default 'balanced' check (travel_style in ('slow', 'balanced', 'active')),
  interests text[] not null default '{}',
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_buddy_requests_created_at on public.buddy_requests (created_at desc);

-- ------------------------------------------------------------------
-- 3) Trips (for Explore ranking + user-created trip stories)
-- ------------------------------------------------------------------
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  cover_image text not null default '',
  visibility text not null default 'private' check (visibility in ('private', 'friends', 'public')),
  start_date date,
  end_date date,
  likes_count integer not null default 0,
  saves_count integer not null default 0,
  views_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_trips_visibility on public.trips (visibility);
create index if not exists idx_trips_popularity on public.trips (likes_count desc, saves_count desc, views_count desc);

create table if not exists public.trip_stops (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  hotspot_id uuid references public.hotspots(id) on delete set null,
  stop_order integer not null check (stop_order >= 1),
  name text not null,
  province text not null default '',
  category text not null default '',
  lat double precision not null,
  lng double precision not null,
  note text not null default '',
  photo_url text not null default '',
  added_at timestamptz not null default now()
);

create unique index if not exists idx_trip_stops_trip_order on public.trip_stops (trip_id, stop_order);
create index if not exists idx_trip_stops_trip on public.trip_stops (trip_id);

create table if not exists public.trip_likes (
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

create table if not exists public.trip_saves (
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

create or replace function public.apply_trip_like_counter()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.trips
    set likes_count = likes_count + 1,
        updated_at = now()
    where id = new.trip_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.trips
    set likes_count = greatest(likes_count - 1, 0),
        updated_at = now()
    where id = old.trip_id;
    return old;
  end if;
  return null;
end;
$$;

create or replace function public.apply_trip_save_counter()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.trips
    set saves_count = saves_count + 1,
        updated_at = now()
    where id = new.trip_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.trips
    set saves_count = greatest(saves_count - 1, 0),
        updated_at = now()
    where id = old.trip_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_trip_likes_counter on public.trip_likes;
create trigger trg_trip_likes_counter
after insert or delete on public.trip_likes
for each row execute function public.apply_trip_like_counter();

drop trigger if exists trg_trip_saves_counter on public.trip_saves;
create trigger trg_trip_saves_counter
after insert or delete on public.trip_saves
for each row execute function public.apply_trip_save_counter();

-- ------------------------------------------------------------------
-- 4) Missions + user mission progress
-- ------------------------------------------------------------------
create table if not exists public.mission_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text not null,
  mission_type text not null check (mission_type in ('daily', 'weekly', 'milestone')),
  target_value integer not null check (target_value > 0),
  reward_xp integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  mission_id uuid not null references public.mission_templates(id) on delete cascade,
  progress_value integer not null default 0,
  status text not null default 'active' check (status in ('active', 'completed', 'claimed')),
  completed_at timestamptz,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, mission_id)
);

insert into public.mission_templates (code, title, description, mission_type, target_value, reward_xp)
values
  ('visit_today', 'Visit 1 new place today', 'Complete one visit today.', 'daily', 1, 20),
  ('wishlist_builder', 'Build a 5-place wishlist', 'Add five places to wishlist.', 'milestone', 5, 40),
  ('favorite_curator', 'Curate 3 favorites', 'Mark three places as favorite.', 'milestone', 3, 30),
  ('explorer_path', 'Reach 10 visited spots', 'Visit ten hotspots in total.', 'milestone', 10, 80)
on conflict (code) do nothing;

-- ------------------------------------------------------------------
-- 5) Rules/config tables (remove hardcoded constants)
-- ------------------------------------------------------------------
create table if not exists public.league_tiers (
  tier_name text primary key,
  min_xp integer not null,
  max_xp integer,
  sort_order integer not null unique
);

insert into public.league_tiers (tier_name, min_xp, max_xp, sort_order)
values
  ('Bronze', 0, 499, 1),
  ('Silver', 500, 1499, 2),
  ('Gold', 1500, 3999, 3),
  ('Platinum', 4000, 7999, 4),
  ('Diamond', 8000, null, 5)
on conflict (tier_name) do update
set min_xp = excluded.min_xp,
    max_xp = excluded.max_xp,
    sort_order = excluded.sort_order;

create table if not exists public.app_rules (
  rule_key text primary key,
  rule_value numeric not null,
  description text not null default ''
);

insert into public.app_rules (rule_key, rule_value, description)
values
  ('visit_hotspot_xp', 50, 'XP reward for marking one hotspot as visited'),
  ('xp_curve_multiplier', 100, 'Current level curve constant for level progression'),
  ('driving_liters_per_100km', 6.5, 'Fuel usage assumption for driving mode'),
  ('fuel_price_per_liter', 1.8, 'Fuel price assumption in EUR'),
  ('toll_per_km', 0.03, 'Estimated toll per kilometer')
on conflict (rule_key) do update
set rule_value = excluded.rule_value,
    description = excluded.description;

-- ------------------------------------------------------------------
-- 6) RLS baseline policies
-- ------------------------------------------------------------------
alter table if exists public.buddy_profiles enable row level security;
alter table if exists public.buddy_requests enable row level security;
alter table if exists public.trips enable row level security;
alter table if exists public.trip_stops enable row level security;
alter table if exists public.trip_likes enable row level security;
alter table if exists public.trip_saves enable row level security;
alter table if exists public.user_missions enable row level security;

drop policy if exists "buddy_profiles_select_all" on public.buddy_profiles;
create policy "buddy_profiles_select_all" on public.buddy_profiles
for select using (true);

drop policy if exists "buddy_profiles_modify_own" on public.buddy_profiles;
create policy "buddy_profiles_modify_own" on public.buddy_profiles
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "buddy_requests_select_all" on public.buddy_requests;
create policy "buddy_requests_select_all" on public.buddy_requests
for select using (true);

drop policy if exists "buddy_requests_insert_own" on public.buddy_requests;
create policy "buddy_requests_insert_own" on public.buddy_requests
for insert with check (auth.uid() = user_id);

drop policy if exists "trips_select_public_or_owner" on public.trips;
create policy "trips_select_public_or_owner" on public.trips
for select using (visibility = 'public' or created_by = auth.uid());

drop policy if exists "trips_insert_owner" on public.trips;
create policy "trips_insert_owner" on public.trips
for insert with check (created_by = auth.uid());

drop policy if exists "trips_update_owner" on public.trips;
create policy "trips_update_owner" on public.trips
for update using (created_by = auth.uid()) with check (created_by = auth.uid());

drop policy if exists "trips_delete_owner" on public.trips;
create policy "trips_delete_owner" on public.trips
for delete using (created_by = auth.uid());

drop policy if exists "trip_stops_select_by_trip" on public.trip_stops;
create policy "trip_stops_select_by_trip" on public.trip_stops
for select using (
  exists (
    select 1
    from public.trips t
    where t.id = trip_stops.trip_id
      and (t.visibility = 'public' or t.created_by = auth.uid())
  )
);

drop policy if exists "trip_stops_modify_owner" on public.trip_stops;
create policy "trip_stops_modify_owner" on public.trip_stops
for all using (
  exists (
    select 1
    from public.trips t
    where t.id = trip_stops.trip_id
      and t.created_by = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.trips t
    where t.id = trip_stops.trip_id
      and t.created_by = auth.uid()
  )
);

drop policy if exists "trip_likes_select_all" on public.trip_likes;
create policy "trip_likes_select_all" on public.trip_likes
for select using (true);

drop policy if exists "trip_likes_insert_own" on public.trip_likes;
create policy "trip_likes_insert_own" on public.trip_likes
for insert with check (auth.uid() = user_id);

drop policy if exists "trip_likes_delete_own" on public.trip_likes;
create policy "trip_likes_delete_own" on public.trip_likes
for delete using (auth.uid() = user_id);

drop policy if exists "trip_saves_select_all" on public.trip_saves;
create policy "trip_saves_select_all" on public.trip_saves
for select using (true);

drop policy if exists "trip_saves_insert_own" on public.trip_saves;
create policy "trip_saves_insert_own" on public.trip_saves
for insert with check (auth.uid() = user_id);

drop policy if exists "trip_saves_delete_own" on public.trip_saves;
create policy "trip_saves_delete_own" on public.trip_saves
for delete using (auth.uid() = user_id);

drop policy if exists "user_missions_select_own" on public.user_missions;
create policy "user_missions_select_own" on public.user_missions
for select using (auth.uid() = user_id);

drop policy if exists "user_missions_modify_own" on public.user_missions;
create policy "user_missions_modify_own" on public.user_missions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);