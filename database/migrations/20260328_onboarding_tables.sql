-- Onboarding & Auth tables migration
-- Date: 2026-03-28

-- ------------------------------------------------------------------
-- 1) User activity tracking
-- ------------------------------------------------------------------
create table if not exists public.user_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  action_type text not null check (action_type in ('view_hotspot', 'save_hotspot', 'create_list', 'follow_user', 'create_collection')),
  entity_type text not null check (entity_type in ('hotspot', 'list', 'user', 'collection')),
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_activity_user_created on public.user_activity (user_id, created_at desc);
create index if not exists idx_user_activity_action on public.user_activity (action_type, created_at desc);

-- ------------------------------------------------------------------
-- 2) User preferences
-- ------------------------------------------------------------------
create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  preference_type text not null check (preference_type in ('explorer_type', 'travel_style', 'home_city', 'country')),
  preference_value text not null,
  created_at timestamptz not null default now(),
  unique (user_id, preference_type)
);

create index if not exists idx_user_preferences_user on public.user_preferences (user_id);

-- ------------------------------------------------------------------
-- 3) Lists (replaces collections)
-- ------------------------------------------------------------------
create table if not exists public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  visibility text not null default 'private' check (visibility in ('private', 'friends', 'public')),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_lists_user on public.lists (user_id);
create index if not exists idx_lists_visibility on public.lists (visibility);

-- ------------------------------------------------------------------
-- 4) List hotspots (junction table)
-- ------------------------------------------------------------------
create table if not exists public.list_hotspots (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists(id) on delete cascade,
  hotspot_id uuid not null references public.hotspots(id) on delete cascade,
  added_at timestamptz not null default now(),
  unique (list_id, hotspot_id)
);

create index if not exists idx_list_hotspots_list on public.list_hotspots (list_id);
create index if not exists idx_list_hotspots_hotspot on public.list_hotspots (hotspot_id);

-- ------------------------------------------------------------------
-- 5) User settings
-- ------------------------------------------------------------------
create table if not exists public.user_settings (
  user_id uuid primary key references public.users(id) on delete cascade,
  allow_location boolean not null default false,
  allow_notifications boolean not null default false,
  allow_email boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- 6) Extend users table if columns don't exist
-- ------------------------------------------------------------------
alter table if exists public.users
  add column if not exists interests text[] default '{}',
  add column if not exists city text,
  add column if not exists country text,
  add column if not exists travel_style text default 'balanced';

-- ------------------------------------------------------------------
-- 7) RLS policies
-- ------------------------------------------------------------------
alter table if exists public.user_activity enable row level security;
alter table if exists public.user_preferences enable row level security;
alter table if exists public.lists enable row level security;
alter table if exists public.list_hotspots enable row level security;
alter table if exists public.user_settings enable row level security;

-- user_activity policies
drop policy if exists "user_activity_select_own" on public.user_activity;
create policy "user_activity_select_own" on public.user_activity
for select using (user_id = auth.uid() or user_id is null);

drop policy if exists "user_activity_insert_own" on public.user_activity;
create policy "user_activity_insert_own" on public.user_activity
for insert with check (user_id = auth.uid());

-- user_preferences policies
drop policy if exists "user_preferences_select_own" on public.user_preferences;
create policy "user_preferences_select_own" on public.user_preferences
for select using (user_id = auth.uid());

drop policy if exists "user_preferences_upsert_own" on public.user_preferences;
create policy "user_preferences_upsert_own" on public.user_preferences
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- lists policies
drop policy if exists "lists_select_visibility" on public.lists;
create policy "lists_select_visibility" on public.lists
for select using (
  user_id = auth.uid()
  or visibility = 'public'
  or (
    visibility = 'friends'
    and exists (
      select 1
      from public.user_follows f
      where f.follower_id = auth.uid()
        and f.followed_id = lists.user_id
        and f.status = 'accepted'
    )
  )
);

drop policy if exists "lists_insert_own" on public.lists;
create policy "lists_insert_own" on public.lists
for insert with check (user_id = auth.uid());

drop policy if exists "lists_update_own" on public.lists;
create policy "lists_update_own" on public.lists
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "lists_delete_own" on public.lists;
create policy "lists_delete_own" on public.lists
for delete using (user_id = auth.uid());

-- list_hotspots policies
drop policy if exists "list_hotspots_select_visible" on public.list_hotspots;
create policy "list_hotspots_select_visible" on public.list_hotspots
for select using (
  exists (
    select 1
    from public.lists l
    where l.id = list_hotspots.list_id
      and (
        l.user_id = auth.uid()
        or l.visibility = 'public'
        or (
          l.visibility = 'friends'
          and exists (
            select 1
            from public.user_follows f
            where f.follower_id = auth.uid()
              and f.followed_id = l.user_id
              and f.status = 'accepted'
          )
        )
      )
  )
);

drop policy if exists "list_hotspots_insert_own" on public.list_hotspots;
create policy "list_hotspots_insert_own" on public.list_hotspots
for insert with check (
  exists (
    select 1
    from public.lists l
    where l.id = list_hotspots.list_id
      and l.user_id = auth.uid()
  )
);

drop policy if exists "list_hotspots_delete_own" on public.list_hotspots;
create policy "list_hotspots_delete_own" on public.list_hotspots
for delete using (
  exists (
    select 1
    from public.lists l
    where l.id = list_hotspots.list_id
      and l.user_id = auth.uid()
  )
);

-- user_settings policies
drop policy if exists "user_settings_select_own" on public.user_settings;
create policy "user_settings_select_own" on public.user_settings
for select using (user_id = auth.uid());

drop policy if exists "user_settings_upsert_own" on public.user_settings;
create policy "user_settings_upsert_own" on public.user_settings
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Update users table RLS if needed
alter table if exists public.users enable row level security;

drop policy if exists "users_select_own" on public.users;
create policy "users_select_own" on public.users
for select using (id = auth.uid());

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users
for update using (auth.uid() = id) with check (auth.uid() = id);

