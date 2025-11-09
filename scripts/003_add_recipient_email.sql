-- Add recipient_email column to templates table
ALTER TABLE templates ADD COLUMN IF NOT EXISTS recipient_email TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_templates_recipient_email ON templates(recipient_email);
