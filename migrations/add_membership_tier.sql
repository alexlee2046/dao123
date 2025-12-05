-- Add membership_tier and membership_expires_at to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS membership_tier TEXT DEFAULT 'free' CHECK (membership_tier IN ('free', 'pro')),
ADD COLUMN IF NOT EXISTS membership_expires_at TIMESTAMP WITH TIME ZONE;

-- Update existing rows to have 'free' if null
UPDATE profiles SET membership_tier = 'free' WHERE membership_tier IS NULL;
