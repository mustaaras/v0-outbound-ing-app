-- Ensure all user-related tables have proper CASCADE DELETE
-- This is critical for account deletion to work properly

-- Fix saved_buyers table (if it exists)
DO $$ 
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'saved_buyers_user_id_fkey' 
    AND table_name = 'saved_buyers'
  ) THEN
    ALTER TABLE public.saved_buyers DROP CONSTRAINT saved_buyers_user_id_fkey;
  END IF;
  
  -- Add constraint with CASCADE DELETE
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'saved_buyers') THEN
    ALTER TABLE public.saved_buyers 
    ADD CONSTRAINT saved_buyers_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Fix public_email_searches table (if it exists and missing cascade)
DO $$ 
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'public_email_searches_user_id_fkey' 
    AND table_name = 'public_email_searches'
  ) THEN
    ALTER TABLE public.public_email_searches DROP CONSTRAINT public_email_searches_user_id_fkey;
  END IF;
  
  -- Add constraint with CASCADE DELETE
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'public_email_searches') THEN
    ALTER TABLE public.public_email_searches 
    ADD CONSTRAINT public_email_searches_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Fix contacts table (if it exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'contacts_user_id_fkey' 
    AND table_name = 'contacts'
  ) THEN
    ALTER TABLE public.contacts DROP CONSTRAINT contacts_user_id_fkey;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contacts') THEN
    ALTER TABLE public.contacts 
    ADD CONSTRAINT contacts_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Fix companies table (if it exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'companies_user_id_fkey' 
    AND table_name = 'companies'
  ) THEN
    ALTER TABLE public.companies DROP CONSTRAINT companies_user_id_fkey;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') THEN
    ALTER TABLE public.companies 
    ADD CONSTRAINT companies_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Fix user_saved_contacts table (if it exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_saved_contacts_user_id_fkey' 
    AND table_name = 'user_saved_contacts'
  ) THEN
    ALTER TABLE public.user_saved_contacts DROP CONSTRAINT user_saved_contacts_user_id_fkey;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_saved_contacts') THEN
    ALTER TABLE public.user_saved_contacts 
    ADD CONSTRAINT user_saved_contacts_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Fix contact_search_history table (if it exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'contact_search_history_user_id_fkey' 
    AND table_name = 'contact_search_history'
  ) THEN
    ALTER TABLE public.contact_search_history DROP CONSTRAINT contact_search_history_user_id_fkey;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contact_search_history') THEN
    ALTER TABLE public.contact_search_history 
    ADD CONSTRAINT contact_search_history_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Verify all constraints are properly set
SELECT 
  tc.table_name, 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
LEFT JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND kcu.column_name = 'user_id'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;
