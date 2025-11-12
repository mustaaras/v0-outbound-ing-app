-- Fix RLS policies for companies and contacts tables
-- The issue is that the current policy checks auth.role() which may not work correctly
-- We need to use auth.uid() IS NOT NULL instead

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can insert companies" ON companies;
DROP POLICY IF EXISTS "Authenticated users can update companies" ON companies;
DROP POLICY IF EXISTS "Authenticated users can insert contacts" ON contacts;
DROP POLICY IF EXISTS "Authenticated users can update contacts" ON contacts;

-- Recreate with proper checks
CREATE POLICY "Authenticated users can insert companies" ON companies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update companies" ON companies
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert contacts" ON contacts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update contacts" ON contacts
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('companies', 'contacts')
ORDER BY tablename, policyname;
