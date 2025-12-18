-- Add missing columns to contacts table
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS company_name text,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS confidence_score float;

-- Update user_id for existing records if possible (this might fail if no link exists)
-- For now, we leave existing records with user_id NULL or rely on manually fixing them

-- Enable RLS (already enabled)
-- Update policies
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON contacts;
DROP POLICY IF EXISTS "Enable read access for authenticated users on contacts" ON contacts;

CREATE POLICY "Users can view their own contacts"
  ON contacts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contacts"
  ON contacts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts"
  ON contacts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts"
  ON contacts
  FOR DELETE
  USING (auth.uid() = user_id);
