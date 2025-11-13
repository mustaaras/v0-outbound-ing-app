-- Update strategies tier constraint to include 'light' tier
-- Migration: 024_add_light_tier_to_strategies.sql

-- Update the tier constraint to include 'light'
ALTER TABLE strategies DROP CONSTRAINT IF EXISTS strategies_tier_check;
ALTER TABLE strategies ADD CONSTRAINT strategies_tier_check CHECK (tier IN ('free', 'light', 'pro', 'ultra'));