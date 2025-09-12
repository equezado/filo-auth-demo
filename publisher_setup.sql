-- Add user roles and publisher privileges
-- This script extends the existing database schema

-- Create user_roles table to store user role information
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('reader', 'publisher')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security for user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_roles
DO $$ 
BEGIN
    -- Users can view their own role
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own role' AND tablename = 'user_roles') THEN
        CREATE POLICY "Users can view their own role" ON user_roles
          FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    -- Users can insert their own role (for signup)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own role' AND tablename = 'user_roles') THEN
        CREATE POLICY "Users can insert their own role" ON user_roles
          FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    -- Users can update their own role
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own role' AND tablename = 'user_roles') THEN
        CREATE POLICY "Users can update their own role" ON user_roles
          FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create trigger to automatically update updated_at for user_roles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_roles_updated_at') THEN
        CREATE TRIGGER update_user_roles_updated_at
          BEFORE UPDATE ON user_roles
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Update posts table to include author_id for better tracking
ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update posts policies to allow publishers to create posts
DO $$ 
BEGIN
    -- Publishers can create posts
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Publishers can create posts' AND tablename = 'posts') THEN
        CREATE POLICY "Publishers can create posts" ON posts
          FOR INSERT WITH CHECK (
            EXISTS (
              SELECT 1 FROM user_roles 
              WHERE user_id = auth.uid() 
              AND role = 'publisher'
            )
          );
    END IF;
    
    -- Publishers can update their own posts
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Publishers can update their own posts' AND tablename = 'posts') THEN
        CREATE POLICY "Publishers can update their own posts" ON posts
          FOR UPDATE USING (
            author_id = auth.uid() AND
            EXISTS (
              SELECT 1 FROM user_roles 
              WHERE user_id = auth.uid() 
              AND role = 'publisher'
            )
          );
    END IF;
    
    -- Publishers can delete their own posts
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Publishers can delete their own posts' AND tablename = 'posts') THEN
        CREATE POLICY "Publishers can delete their own posts" ON posts
          FOR DELETE USING (
            author_id = auth.uid() AND
            EXISTS (
              SELECT 1 FROM user_roles 
              WHERE user_id = auth.uid() 
              AND role = 'publisher'
            )
          );
    END IF;
END $$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM user_roles 
    WHERE user_id = user_uuid 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is publisher
CREATE OR REPLACE FUNCTION is_publisher(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role(user_uuid) = 'publisher';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default role for existing users (if any)
INSERT INTO user_roles (user_id, role)
SELECT id, 'reader' 
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM user_roles)
ON CONFLICT (user_id) DO NOTHING;
