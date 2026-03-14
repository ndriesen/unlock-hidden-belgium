-- Hotspot Ranking Engine Migration
-- Date: 2026-03-29

-- ==============================================================================
-- STEP 1: Add ranking-related columns to hotspots table
-- ==============================================================================

-- Add views_count and trip_visits_count if they don't exist
ALTER TABLE IF EXISTS public.hotspots
  ADD COLUMN IF NOT EXISTS views_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trip_visits_count INTEGER NOT NULL DEFAULT 0;

-- Add indexes for ranking queries
CREATE INDEX IF NOT EXISTS idx_hotspots_saves_count ON public.hotspots (saves_count DESC);
CREATE INDEX IF NOT EXISTS idx_hotspots_views_count ON public.hotspots (views_count DESC);
CREATE INDEX IF NOT EXISTS idx_hotspots_trip_visits_count ON public.hotspots (trip_visits_count DESC);
CREATE INDEX IF NOT EXISTS idx_hotspots_created_at ON public.hotspots (created_at DESC);

-- ==============================================================================
-- STEP 2: Update user_activity table with additional action types
-- ==============================================================================

-- Drop existing check constraint and recreate with more action types
ALTER TABLE public.user_activity
  DROP CONSTRAINT IF EXISTS user_activity_action_type_check;

ALTER TABLE public.user_activity
  ADD CONSTRAINT user_activity_action_type_check
  CHECK (action_type IN (
    'view_hotspot',
    'open_hotspot',
    'save_hotspot',
    'unsave_hotspot',
    'add_hotspot_to_trip',
    'visit_hotspot',
    'create_hotspot',
    'create_list',
    'follow_user',
    'create_collection'
  ));

-- ==============================================================================
-- STEP 3: Create trigger function for updating hotspot counters
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.apply_hotspot_activity_counter()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update views_count for view_hotspot and open_hotspot
    IF NEW.action_type IN ('view_hotspot', 'open_hotspot') AND NEW.entity_type = 'hotspot' THEN
      UPDATE public.hotspots
      SET views_count = views_count + 1
      WHERE id = NEW.entity_id;
    END IF;
    
    -- Update saves_count for save_hotspot
    IF NEW.action_type = 'save_hotspot' AND NEW.entity_type = 'hotspot' THEN
      UPDATE public.hotspots
      SET saves_count = saves_count + 1
      WHERE id = NEW.entity_id;
    END IF;
    
    -- Update trip_visits_count for add_hotspot_to_trip
    IF NEW.action_type = 'add_hotspot_to_trip' AND NEW.entity_type = 'hotspot' THEN
      UPDATE public.hotspots
      SET trip_visits_count = trip_visits_count + 1
      WHERE id = NEW.entity_id;
    END IF;
    
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    -- Update saves_count for unsave_hotspot
    IF OLD.action_type = 'unsave_hotspot' AND OLD.entity_type = 'hotspot' THEN
      UPDATE public.hotspots
      SET saves_count = GREATEST(saves_count - 1, 0)
      WHERE id = OLD.entity_id;
    END IF;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create trigger on user_activity
DROP TRIGGER IF EXISTS trg_hotspot_activity_counter ON public.user_activity;
CREATE TRIGGER trg_hotspot_activity_counter
AFTER INSERT OR DELETE ON public.user_activity
FOR EACH ROW EXECUTE FUNCTION public.apply_hotspot_activity_counter();

-- ==============================================================================
-- STEP 4: Also update counters directly via triggers on trip_stops
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.apply_trip_stop_counter()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.hotspot_id IS NOT NULL THEN
    UPDATE public.hotspots
    SET trip_visits_count = trip_visits_count + 1
    WHERE id = NEW.hotspot_id;
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'DELETE' AND OLD.hotspot_id IS NOT NULL THEN
    UPDATE public.hotspots
    SET trip_visits_count = GREATEST(trip_visits_count - 1, 0)
    WHERE id = OLD.hotspot_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_trip_stop_hotspot_counter ON public.trip_stops;
CREATE TRIGGER trg_trip_stop_hotspot_counter
AFTER INSERT OR DELETE ON public.trip_stops
FOR EACH ROW EXECUTE FUNCTION public.apply_trip_stop_counter();

-- ==============================================================================
-- STEP 5: Create materialized view for hotspot rankings
-- ==============================================================================

-- Drop existing materialized view if exists
DROP MATERIALIZED VIEW IF EXISTS public.hotspot_rankings;

-- Create the materialized view with explicit column selection
CREATE MATERIALIZED VIEW public.hotspot_rankings AS
SELECT
  h.id AS hotspot_id,
  h.name AS hotspot_name,
  h.latitude,
  h.longitude,
  h.category,
  h.province,
  h.description,
  h.images,
  h.tags,
  h.saves_count,
  h.views_count,
  h.trip_visits_count,
  h.created_at,
  h.status,
  
  -- Popularity Score: (LOG(saves+1) * 0.6) + (LOG(views+1) * 0.4)
  ((LOG(GREATEST(h.saves_count, 0) + 1) * 0.6) + 
   (LOG(GREATEST(h.views_count, 0) + 1) * 0.4)) AS popularity_score,
  
  -- Recency Score: 1 / (1 + days_since_creation/30)
  (1.0 / (1.0 + (EXTRACT(day FROM NOW() - h.created_at) / 30.0))) AS recency_score,
  
  -- Quality Score: description + images + tags
  (CASE WHEN LENGTH(COALESCE(h.description, '')) > 200 THEN 0.4 ELSE 0 END +
   CASE WHEN h.images IS NOT NULL AND ARRAY_LENGTH(h.images, 1) > 0 THEN 0.3 ELSE 0 END +
   CASE WHEN h.tags IS NOT NULL AND ARRAY_LENGTH(h.tags, 1) > 0 THEN 0.3 ELSE 0 END) AS quality_score,
  
  -- Trip Usage Score: LOG(trip_visits+1)
  LOG(GREATEST(h.trip_visits_count, 0) + 1) AS trip_usage_score,
  
  -- Social Score: LOG(unique_savers+1)
  LOG(GREATEST(COALESCE(s.unique_savers, 0), 0) + 1) AS social_score,
  
  -- Final Ranking Score with weighted formula
  (((LOG(GREATEST(h.saves_count, 0) + 1) * 0.6) + 
    (LOG(GREATEST(h.views_count, 0) + 1) * 0.4)) * 0.30) +
  ((1.0 / (1.0 + (EXTRACT(day FROM NOW() - h.created_at) / 30.0))) * 0.20) +
  ((CASE WHEN LENGTH(COALESCE(h.description, '')) > 200 THEN 0.4 ELSE 0 END +
    CASE WHEN h.images IS NOT NULL AND ARRAY_LENGTH(h.images, 1) > 0 THEN 0.3 ELSE 0 END +
    CASE WHEN h.tags IS NOT NULL AND ARRAY_LENGTH(h.tags, 1) > 0 THEN 0.3 ELSE 0 END) * 0.15) +
  (LOG(GREATEST(h.trip_visits_count, 0) + 1) * 0.20) +
  (LOG(GREATEST(COALESCE(s.unique_savers, 0), 0) + 1) * 0.15) AS ranking_score
  
FROM public.hotspots h
LEFT JOIN (
  SELECT hotspot_id, COUNT(DISTINCT user_id) AS unique_savers
  FROM public.hotspot_saves
  GROUP BY hotspot_id
) s ON s.hotspot_id = h.id
WHERE h.status = 'approved';

-- Create indexes for the materialized view
CREATE INDEX IF NOT EXISTS idx_hotspot_rankings_score ON public.hotspot_rankings (ranking_score DESC);
CREATE INDEX IF NOT EXISTS idx_hotspot_rankings_location ON public.hotspot_rankings (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_hotspot_rankings_created ON public.hotspot_rankings (created_at DESC);

-- ==============================================================================
-- STEP 6: Create view for approved hotspots with rankings
-- ==============================================================================

DROP VIEW IF EXISTS public.hotspots_with_rankings;

CREATE OR REPLACE VIEW public.hotspots_with_rankings AS
SELECT
  h.id,
  h.name,
  h.latitude,
  h.longitude,
  h.category,
  h.province,
  h.description,
  h.images,
  h.tags,
  h.opening_hours,
  h.combine_with,
  h.visit_count,
  h.likes_count,
  h.saves_count,
  h.views_count,
  h.trip_visits_count,
  h.status,
  h.created_at,
  h.created_by,
  r.ranking_score,
  r.popularity_score,
  r.recency_score,
  r.quality_score,
  r.trip_usage_score,
  r.social_score
FROM public.hotspots h
LEFT JOIN public.hotspot_rankings r ON h.id = r.hotspot_id
WHERE h.status = 'approved';

-- ==============================================================================
-- STEP 7: Create ranking configuration table
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.ranking_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_name TEXT NOT NULL UNIQUE,
  weight NUMERIC NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.ranking_weights (signal_name, weight, description) VALUES
  ('popularity', 0.30, 'Weight for popularity signals (saves + views)'),
  ('recency', 0.20, 'Weight for recency signal'),
  ('quality', 0.15, 'Weight for content quality signals'),
  ('trip_usage', 0.20, 'Weight for trip usage signals'),
  ('social', 0.15, 'Weight for social signals')
ON CONFLICT (signal_name) DO NOTHING;

-- ==============================================================================
-- STEP 8: Create refresh function
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.refresh_hotspot_rankings()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.hotspot_rankings;
END;
$$;

-- ==============================================================================
-- STEP 9: RLS policies
-- ==============================================================================

ALTER TABLE IF EXISTS public.ranking_weights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ranking_weights_select_all" ON public.ranking_weights;
CREATE POLICY "ranking_weights_select_all" ON public.ranking_weights
FOR SELECT USING (true);

-- ==============================================================================
-- STEP 10: Grant permissions
-- ==============================================================================

GRANT SELECT ON public.hotspot_rankings TO anon, authenticated;
GRANT SELECT ON public.hotspots_with_rankings TO anon, authenticated;
GRANT SELECT, UPDATE ON public.ranking_weights TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_hotspot_rankings() TO anon, authenticated;

-- ==============================================================================
-- STEP 11: Initial refresh
-- ==============================================================================

SELECT public.refresh_hotspot_rankings();

-- Note: For automatic refresh every 10 minutes, add pg_cron:
-- SELECT cron.schedule('refresh-hotspot-rankings', '*/10 * * * *', 
--   'SELECT public.refresh_hotspot_rankings();');

