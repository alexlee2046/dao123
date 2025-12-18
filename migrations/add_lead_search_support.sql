-- Add lead search related fields to contacts table
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verification_status text,
ADD COLUMN IF NOT EXISTS email_source text DEFAULT 'manual';

-- Create lead_search_history table
CREATE TABLE IF NOT EXISTS lead_search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  search_type text NOT NULL, -- 'domain', 'email', 'verify', 'find'
  query jsonb NOT NULL,
  result_summary jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE lead_search_history ENABLE ROW LEVEL SECURITY;

-- Create policies for lead_search_history
-- Check if policies exist before creating them to avoid errors on repeated runs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'lead_search_history' AND policyname = 'Users can view their own search history'
    ) THEN
        CREATE POLICY "Users can view their own search history"
          ON lead_search_history
          FOR SELECT
          USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'lead_search_history' AND policyname = 'Users can insert their own search history'
    ) THEN
        CREATE POLICY "Users can insert their own search history"
          ON lead_search_history
          FOR INSERT
          WITH CHECK (auth.uid() = user_id);
    END IF;
END
$$;
