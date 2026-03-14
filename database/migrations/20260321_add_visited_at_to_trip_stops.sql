-- Add visited_at column to trip_stops table
-- This allows users to set a date/time for when they visited each stop
-- This enables timeline view and chronological sorting of memories

ALTER TABLE trip_stops 
ADD COLUMN IF NOT EXISTS visited_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries on visited_at
CREATE INDEX IF NOT EXISTS idx_trip_stops_visited_at ON trip_stops(visited_at);

