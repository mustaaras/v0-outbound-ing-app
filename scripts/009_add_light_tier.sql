-- Add Light tier support to the users table
ALTER TABLE users ALTER COLUMN tier TYPE VARCHAR(10);

-- Update the tier constraint to include 'light'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_tier_check;
ALTER TABLE users ADD CONSTRAINT users_tier_check CHECK (tier IN ('free', 'light', 'pro', 'ultra'));

COMMENT ON COLUMN users.tier IS 'User subscription tier: free (5 emails), light (100 emails), pro (750 emails), ultra (1500 emails)';
