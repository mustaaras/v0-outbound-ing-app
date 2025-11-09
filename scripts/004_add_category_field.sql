-- Add category field to strategies table
ALTER TABLE strategies ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'General Purpose';

-- Add input_fields column to track what fields this strategy needs
ALTER TABLE strategies ADD COLUMN IF NOT EXISTS input_fields TEXT[] DEFAULT ARRAY['recipient_name', 'recipient_email'];

-- Update templates table to be more flexible
ALTER TABLE templates ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS input_data JSONB DEFAULT '{}'::jsonb;

-- Rename domain column to subject for more flexibility
ALTER TABLE templates RENAME COLUMN domain TO subject;
