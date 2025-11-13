-- Migration: 021_add_location_searches_table.sql

-- Create the table
CREATE TABLE IF NOT EXISTS location_searches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    search_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index to ensure one record per user per month
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'location_searches_user_month_idx') THEN
        CREATE UNIQUE INDEX location_searches_user_month_idx ON location_searches(user_id, month);
    END IF;
END $$;

-- Create index on user_id for faster queries
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'location_searches_user_id_idx') THEN
        CREATE INDEX location_searches_user_id_idx ON location_searches(user_id);
    END IF;
END $$;

-- Enable RLS
ALTER TABLE location_searches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own location searches" ON location_searches
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own location searches" ON location_searches
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own location searches" ON location_searches
    FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON location_searches TO authenticated;
GRANT SELECT, INSERT, UPDATE ON location_searches TO anon;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_location_searches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_location_searches_updated_at') THEN
        CREATE TRIGGER trigger_update_location_searches_updated_at
            BEFORE UPDATE ON location_searches
            FOR EACH ROW
            EXECUTE FUNCTION update_location_searches_updated_at();
    END IF;
END $$;