-- Add first_name and last_name fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Update the trigger function to handle name fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, tier, first_name, last_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    'free',
    COALESCE(NEW.raw_user_meta_data->>'first_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'last_name', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
