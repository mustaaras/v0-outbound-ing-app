-- Create table to store saved buyer contacts per user
create table if not exists public.saved_buyers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  email text not null,
  first_name text,
  last_name text,
  company text,
  title text,
  created_at timestamptz not null default now(),
  constraint saved_buyers_user_fk foreign key (user_id) references auth.users (id) on delete cascade
);

-- Unique constraint: each user can save an email at most once
create unique index if not exists saved_buyers_user_email_idx on public.saved_buyers (user_id, lower(email));
