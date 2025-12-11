-- Create ai_logs table
create table if not exists public.ai_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id),
  type text not null, -- 'chat', 'parse', 'architect'
  model text,
  input_snippet text,
  output_snippet text,
  status text not null, -- 'success', 'error', 'pending'
  error text,
  duration_ms integer,
  meta jsonb default '{}'::jsonb
);

-- Enable RLS
alter table public.ai_logs enable row level security;

-- Policies
-- Admin can view all logs
create policy "Admins can view all logs"
  on public.ai_logs
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Service role can insert logs
create policy "Service role can insert logs"
  on public.ai_logs
  for insert
  to service_role
  with check (true);

-- Authenticated users can insert their own logs (if client side logging needed)
create policy "Users can insert their own logs"
  on public.ai_logs
  for insert
  to authenticated
  with check (auth.uid() = user_id);
