-- Enable RLS and add basic policies for saved_buyers
ALTER TABLE public.saved_buyers ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own rows
CREATE POLICY IF NOT EXISTS saved_buyers_insert_own
ON public.saved_buyers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to select their own rows
CREATE POLICY IF NOT EXISTS saved_buyers_select_own
ON public.saved_buyers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
