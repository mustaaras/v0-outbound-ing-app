-- Ensure email is stored lowercase in app code; switch to a simple unique constraint on (user_id, email)
-- Drop the expression-based unique index which cannot be used by ON CONFLICT
DROP INDEX IF EXISTS public.saved_buyers_user_email_idx;

-- Add a proper unique constraint on (user_id, email)
ALTER TABLE public.saved_buyers
  ADD CONSTRAINT saved_buyers_user_email_unique UNIQUE (user_id, email);
