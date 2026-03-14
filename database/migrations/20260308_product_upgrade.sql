-- Spotly product upgrade migration
-- Date: 2026-03-08

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------
-- 1) Hotspot engagement counters (likes/saves)
-- ------------------------------------------------------------------
alter table if exists public.hotspots
  add column if not exists likes_count integer not null default 0,
  add column if not exists saves_count integer not null default 0;

create table if not exists public.hotspot_likes (
  hotspot_id uuid not null references public.hotspots(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (hotspot_id, user_id)
);

create table if not exists public.hotspot_saves (
  hotspot_id uuid not null references public.hotspots(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (hotspot_id, user_id)
);

create or replace function public.apply_hotspot_like_counter()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.hotspots
    set likes_count = likes_count + 1
    where id = new.hotspot_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.hotspots
    set likes_count = greatest(likes_count - 1, 0)
    where id = old.hotspot_id;
    return old;
  end if;
  return null;
end;
$$;

create or replace function public.apply_hotspot_save_counter()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.hotspots
    set saves_count = saves_count + 1
    where id = new.hotspot_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.hotspots
    set saves_count = greatest(saves_count - 1, 0)
    where id = old.hotspot_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_hotspot_likes_counter on public.hotspot_likes;
create trigger trg_hotspot_likes_counter
after insert or delete on public.hotspot_likes
for each row execute function public.apply_hotspot_like_counter();

drop trigger if exists trg_hotspot_saves_counter on public.hotspot_saves;
create trigger trg_hotspot_saves_counter
after insert or delete on public.hotspot_saves
for each row execute function public.apply_hotspot_save_counter();

-- ------------------------------------------------------------------
-- 2) Media uploads for hotspots and trips (visibility-aware)
-- ------------------------------------------------------------------
create table if not exists public.hotspot_media (
  id uuid primary key default gen_random_uuid(),
  hotspot_id uuid not null references public.hotspots(id) on delete cascade,
  trip_id uuid references public.trips(id) on delete set null,
  trip_stop_id uuid references public.trip_stops(id) on delete set null,
  uploaded_by uuid not null references public.users(id) on delete cascade,
  storage_path text not null unique,
  caption text not null default '',
  visibility text not null default 'public' check (visibility in ('private', 'friends', 'public')),
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_hotspot_media_hotspot_created on public.hotspot_media (hotspot_id, created_at desc);
create index if not exists idx_hotspot_media_uploaded_by on public.hotspot_media (uploaded_by);

create table if not exists public.trip_media (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  trip_stop_id uuid references public.trip_stops(id) on delete set null,
  hotspot_id uuid references public.hotspots(id) on delete set null,
  uploaded_by uuid not null references public.users(id) on delete cascade,
  storage_path text not null unique,
  caption text not null default '',
  visibility text not null default 'private' check (visibility in ('private', 'friends', 'public')),
  created_at timestamptz not null default now()
);

create index if not exists idx_trip_media_trip_created on public.trip_media (trip_id, created_at desc);
create index if not exists idx_trip_media_uploaded_by on public.trip_media (uploaded_by);

-- ------------------------------------------------------------------
-- 3) Social graph + activity feed + notifications
-- ------------------------------------------------------------------
create table if not exists public.user_follows (
  follower_id uuid not null references public.users(id) on delete cascade,
  followed_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'accepted' check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  constraint chk_user_follows_self check (follower_id <> followed_id)
);

create index if not exists idx_user_follows_followed_status on public.user_follows (followed_id, status);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.users(id) on delete cascade,
  activity_type text not null,
  entity_type text not null,
  entity_id uuid,
  message text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  visibility text not null default 'friends' check (visibility in ('private', 'friends', 'public')),
  created_at timestamptz not null default now()
);

create index if not exists idx_activities_actor_created on public.activities (actor_id, created_at desc);
create index if not exists idx_activities_visibility_created on public.activities (visibility, created_at desc);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  activity_id uuid not null references public.activities(id) on delete cascade,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists idx_notifications_user_created on public.notifications (user_id, created_at desc);
create unique index if not exists idx_notifications_user_activity on public.notifications (user_id, activity_id);

-- ------------------------------------------------------------------
-- 4) Influencer mentions + monetization scaffolding
-- ------------------------------------------------------------------
create table if not exists public.influencer_mentions (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  author_handle text not null,
  content text not null,
  post_url text not null,
  hotspot_id uuid references public.hotspots(id) on delete set null,
  trip_id uuid references public.trips(id) on delete set null,
  sentiment_score numeric(4,2),
  is_featured boolean not null default false,
  created_at timestamptz not null,
  ingested_at timestamptz not null default now()
);

create index if not exists idx_influencer_mentions_created on public.influencer_mentions (created_at desc);
create index if not exists idx_influencer_mentions_featured on public.influencer_mentions (is_featured, created_at desc);

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  monthly_price_eur numeric(8,2) not null default 0,
  annual_price_eur numeric(8,2),
  features jsonb not null default '[]'::jsonb,
  cta_label text not null default 'Start now',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id) on delete restrict,
  status text not null default 'trial' check (status in ('trial', 'active', 'canceled', 'expired')),
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  canceled_at timestamptz,
  unique (user_id, plan_id, status)
);

insert into public.subscription_plans (code, name, monthly_price_eur, annual_price_eur, features, cta_label, active)
values
  (
    'spotly_plus',
    'Spotly Plus',
    6.99,
    59.99,
    '["Unlimited trip timelines","Priority hotspot alerts","Advanced route insights","Private group sharing"]'::jsonb,
    'Upgrade to Plus',
    true
  )
on conflict (code) do update
set name = excluded.name,
    monthly_price_eur = excluded.monthly_price_eur,
    annual_price_eur = excluded.annual_price_eur,
    features = excluded.features,
    cta_label = excluded.cta_label,
    active = excluded.active;

-- ------------------------------------------------------------------
-- 5) Storage bucket + object policies for media
-- ------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'spotly-media',
  'spotly-media',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'spotly-public',
  'spotly-public',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
-- ------------------------------------------------------------------
-- 6) RLS policies
-- ------------------------------------------------------------------
alter table if exists public.hotspot_likes enable row level security;
alter table if exists public.hotspot_saves enable row level security;
alter table if exists public.hotspot_media enable row level security;
alter table if exists public.trip_media enable row level security;
alter table if exists public.user_follows enable row level security;
alter table if exists public.activities enable row level security;
alter table if exists public.notifications enable row level security;
alter table if exists public.influencer_mentions enable row level security;
alter table if exists public.subscription_plans enable row level security;
alter table if exists public.user_subscriptions enable row level security;

drop policy if exists "hotspot_likes_select_all" on public.hotspot_likes;
create policy "hotspot_likes_select_all" on public.hotspot_likes
for select using (true);

drop policy if exists "hotspot_likes_insert_own" on public.hotspot_likes;
create policy "hotspot_likes_insert_own" on public.hotspot_likes
for insert with check (auth.uid() = user_id);

drop policy if exists "hotspot_likes_delete_own" on public.hotspot_likes;
create policy "hotspot_likes_delete_own" on public.hotspot_likes
for delete using (auth.uid() = user_id);

drop policy if exists "hotspot_saves_select_all" on public.hotspot_saves;
create policy "hotspot_saves_select_all" on public.hotspot_saves
for select using (true);

drop policy if exists "hotspot_saves_insert_own" on public.hotspot_saves;
create policy "hotspot_saves_insert_own" on public.hotspot_saves
for insert with check (auth.uid() = user_id);

drop policy if exists "hotspot_saves_delete_own" on public.hotspot_saves;
create policy "hotspot_saves_delete_own" on public.hotspot_saves
for delete using (auth.uid() = user_id);

drop policy if exists "hotspot_media_select_visibility" on public.hotspot_media;
create policy "hotspot_media_select_visibility" on public.hotspot_media
for select using (
  uploaded_by = auth.uid()
  or visibility = 'public'
  or (
    visibility = 'friends'
    and exists (
      select 1
      from public.user_follows f
      where f.follower_id = auth.uid()
        and f.followed_id = hotspot_media.uploaded_by
        and f.status = 'accepted'
    )
  )
);

drop policy if exists "hotspot_media_insert_own" on public.hotspot_media;
create policy "hotspot_media_insert_own" on public.hotspot_media
for insert with check (uploaded_by = auth.uid());

drop policy if exists "hotspot_media_update_own" on public.hotspot_media;
create policy "hotspot_media_update_own" on public.hotspot_media
for update using (uploaded_by = auth.uid()) with check (uploaded_by = auth.uid());

drop policy if exists "hotspot_media_delete_own" on public.hotspot_media;
create policy "hotspot_media_delete_own" on public.hotspot_media
for delete using (uploaded_by = auth.uid());

drop policy if exists "trip_media_select_visibility" on public.trip_media;
create policy "trip_media_select_visibility" on public.trip_media
for select using (
  uploaded_by = auth.uid()
  or visibility = 'public'
  or (
    visibility = 'friends'
    and exists (
      select 1
      from public.user_follows f
      where f.follower_id = auth.uid()
        and f.followed_id = trip_media.uploaded_by
        and f.status = 'accepted'
    )
  )
);

drop policy if exists "trip_media_insert_owner" on public.trip_media;
create policy "trip_media_insert_owner" on public.trip_media
for insert with check (
  uploaded_by = auth.uid()
  and exists (
    select 1
    from public.trips t
    where t.id = trip_media.trip_id
      and t.created_by = auth.uid()
  )
);

drop policy if exists "trip_media_update_own" on public.trip_media;
create policy "trip_media_update_own" on public.trip_media
for update using (uploaded_by = auth.uid()) with check (uploaded_by = auth.uid());

drop policy if exists "trip_media_delete_own" on public.trip_media;
create policy "trip_media_delete_own" on public.trip_media
for delete using (uploaded_by = auth.uid());

drop policy if exists "user_follows_select_related" on public.user_follows;
create policy "user_follows_select_related" on public.user_follows
for select using (auth.uid() = follower_id or auth.uid() = followed_id);

drop policy if exists "user_follows_insert_own" on public.user_follows;
create policy "user_follows_insert_own" on public.user_follows
for insert with check (auth.uid() = follower_id);

drop policy if exists "user_follows_update_own" on public.user_follows;
create policy "user_follows_update_own" on public.user_follows
for update using (auth.uid() = follower_id or auth.uid() = followed_id)
with check (auth.uid() = follower_id or auth.uid() = followed_id);

drop policy if exists "activities_select_feed" on public.activities;
create policy "activities_select_feed" on public.activities
for select using (
  visibility = 'public'
  or actor_id = auth.uid()
  or (
    visibility = 'friends'
    and exists (
      select 1
      from public.user_follows f
      where f.follower_id = auth.uid()
        and f.followed_id = activities.actor_id
        and f.status = 'accepted'
    )
  )
);

drop policy if exists "activities_insert_own" on public.activities;
create policy "activities_insert_own" on public.activities
for insert with check (actor_id = auth.uid());

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
for select using (user_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own" on public.notifications
for delete using (user_id = auth.uid());

drop policy if exists "influencer_mentions_select_all" on public.influencer_mentions;
create policy "influencer_mentions_select_all" on public.influencer_mentions
for select using (true);

drop policy if exists "subscription_plans_select_all" on public.subscription_plans;
create policy "subscription_plans_select_all" on public.subscription_plans
for select using (active = true);

drop policy if exists "user_subscriptions_select_own" on public.user_subscriptions;
create policy "user_subscriptions_select_own" on public.user_subscriptions
for select using (user_id = auth.uid());

drop policy if exists "user_subscriptions_insert_own" on public.user_subscriptions;
create policy "user_subscriptions_insert_own" on public.user_subscriptions
for insert with check (user_id = auth.uid());

drop policy if exists "user_subscriptions_update_own" on public.user_subscriptions;
create policy "user_subscriptions_update_own" on public.user_subscriptions
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table if exists storage.objects enable row level security;

drop policy if exists "spotly_media_read" on storage.objects;
create policy "spotly_media_read" on storage.objects
for select using (
  bucket_id = 'spotly-media'
  and (
    owner = auth.uid()
    or exists (
      select 1
      from public.hotspot_media hm
      where hm.storage_path = storage.objects.name
        and (
          hm.uploaded_by = auth.uid()
          or hm.visibility = 'public'
          or (
            hm.visibility = 'friends'
            and exists (
              select 1
              from public.user_follows f
              where f.follower_id = auth.uid()
                and f.followed_id = hm.uploaded_by
                and f.status = 'accepted'
            )
          )
        )
    )
    or exists (
      select 1
      from public.trip_media tm
      where tm.storage_path = storage.objects.name
        and (
          tm.uploaded_by = auth.uid()
          or tm.visibility = 'public'
          or (
            tm.visibility = 'friends'
            and exists (
              select 1
              from public.user_follows f
              where f.follower_id = auth.uid()
                and f.followed_id = tm.uploaded_by
                and f.status = 'accepted'
            )
          )
        )
    )
  )
);

drop policy if exists "spotly_media_upload" on storage.objects;
create policy "spotly_media_upload" on storage.objects
for insert with check (
  bucket_id = 'spotly-media'
  and owner = auth.uid()
);

drop policy if exists "spotly_media_update_owner" on storage.objects;
create policy "spotly_media_update_owner" on storage.objects
for update using (
  bucket_id = 'spotly-media'
  and owner = auth.uid()
)
with check (
  bucket_id = 'spotly-media'
  and owner = auth.uid()
);

drop policy if exists "spotly_media_delete_owner" on storage.objects;
create policy "spotly_media_delete_owner" on storage.objects
for delete using (
  bucket_id = 'spotly-media'
  and owner = auth.uid()
);


