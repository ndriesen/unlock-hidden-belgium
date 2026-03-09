# Database Migration Checklist (Exact)

Run these SQL files in this order:
1. `database/migrations/20260308_backend_upgrade.sql`
2. `database/migrations/20260308_product_upgrade.sql`

## 1) Core profile + buddies + trips + missions + rules

### `users` table (columns to exist)
- `city text`
- `travel_style text`
- `interests text[]`
- `availability text`
- `bio text`
- `avatar_url text`

### Buddy tables
- `buddy_profiles`
- `buddy_requests`

### Trip builder tables
- `trips`
- `trip_stops`
- `trip_likes`
- `trip_saves`

### Missions and app config
- `mission_templates`
- `user_missions`
- `league_tiers`
- `app_rules`

## 2) Product expansion (likes/saves/uploads/activity/monetization)

### `hotspots` table (columns to exist)
- `likes_count integer default 0`
- `saves_count integer default 0`

### Hotspot interactions
- `hotspot_likes`
- `hotspot_saves`
- Trigger `trg_hotspot_likes_counter`
- Trigger `trg_hotspot_saves_counter`

### User uploads
- `hotspot_media`
- `trip_media`
- Storage bucket `spotly-media` (private uploads)
- Storage bucket `spotly-public` (public default/base hotspot images)

### Social feed and notifications
- `user_follows`
- `activities`
- `notifications`

### Influencer insights + monetization
- `influencer_mentions`
- `subscription_plans`
- `user_subscriptions`

## 3) What you must still do manually in Supabase

1. Run both SQL migration files in the SQL editor.
2. Verify bucket `spotly-media` exists in Storage and is private.
3. Verify bucket `spotly-public` exists in Storage and is public.
4. In Authentication > URL configuration, ensure your production URL is added correctly.
5. Optional: create a scheduled ingestion job that writes into `influencer_mentions`.
6. Optional: seed extra rows in `subscription_plans`.

## 4) Quick verification queries

```sql
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'hotspots'
and column_name in ('likes_count', 'saves_count');
```

```sql
select tablename from pg_tables
where schemaname='public'
and tablename in (
  'trips','trip_stops','trip_likes','trip_saves',
  'hotspot_likes','hotspot_saves','hotspot_media','trip_media',
  'activities','notifications','user_follows',
  'influencer_mentions','subscription_plans','user_subscriptions'
)
order by tablename;
```

```sql
select id, name, public
from storage.buckets
where id in ('spotly-media', 'spotly-public')
order by id;
```

## 5) App asset locations

- App logo path: `public/branding/spotly-logo.svg`
- Optional logo override: `public/branding/spotly-logo.png`
- Optional default hotspot image: `spotly-public/defaults/hotspot-default.jpg`
