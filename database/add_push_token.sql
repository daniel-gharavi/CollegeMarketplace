-- Add push_token column to profiles table
-- Run this in your Supabase SQL editor

-- Add push_token column to store notification tokens
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Add index for better performance when querying by push_token
CREATE INDEX IF NOT EXISTS idx_profiles_push_token ON profiles(push_token);

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'push_token'; 