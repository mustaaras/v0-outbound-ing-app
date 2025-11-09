-- Add 'ultra' as a valid tier option
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_tier_check;
ALTER TABLE users ADD CONSTRAINT users_tier_check CHECK (tier IN ('free', 'pro', 'ultra'));

-- Add 'ultra' to strategies tier constraint
ALTER TABLE strategies DROP CONSTRAINT IF EXISTS strategies_tier_check;
ALTER TABLE strategies ADD CONSTRAINT strategies_tier_check CHECK (tier IN ('free', 'pro', 'ultra'));
