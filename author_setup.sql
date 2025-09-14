-- Author Management Setup
-- This script creates the authors table and updates the posts table

-- Create authors table
CREATE TABLE IF NOT EXISTS authors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for authors
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;

-- Create policies for authors
DO $$ 
BEGIN
    -- All authenticated users can view authors
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view authors' AND tablename = 'authors') THEN
        CREATE POLICY "Authenticated users can view authors" ON authors
          FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
    
    -- Publishers can create authors
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Publishers can create authors' AND tablename = 'authors') THEN
        CREATE POLICY "Publishers can create authors" ON authors
          FOR INSERT WITH CHECK (
            EXISTS (
              SELECT 1 FROM user_roles 
              WHERE user_id = auth.uid() 
              AND role = 'publisher'
            )
          );
    END IF;
    
    -- Publishers can update authors
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Publishers can update authors' AND tablename = 'authors') THEN
        CREATE POLICY "Publishers can update authors" ON authors
          FOR UPDATE USING (
            EXISTS (
              SELECT 1 FROM user_roles 
              WHERE user_id = auth.uid() 
              AND role = 'publisher'
            )
          );
    END IF;
    
    -- Publishers can delete authors
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Publishers can delete authors' AND tablename = 'authors') THEN
        CREATE POLICY "Publishers can delete authors" ON authors
          FOR DELETE USING (
            EXISTS (
              SELECT 1 FROM user_roles 
              WHERE user_id = auth.uid() 
              AND role = 'publisher'
            )
          );
    END IF;
END $$;

-- Create trigger to automatically update updated_at for authors
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_authors_updated_at') THEN
        CREATE TRIGGER update_authors_updated_at
          BEFORE UPDATE ON authors
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- First, handle the existing author_id column (which is actually publisher_id)
DO $$ 
BEGIN
    -- Drop existing foreign key constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'posts_author_id_fkey' 
        AND table_name = 'posts'
    ) THEN
        ALTER TABLE posts DROP CONSTRAINT posts_author_id_fkey;
    END IF;
    
    -- Rename existing author_id column to publisher_id if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'author_id'
    ) THEN
        -- Check if publisher_id already exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'posts' 
            AND column_name = 'publisher_id'
        ) THEN
            ALTER TABLE posts RENAME COLUMN author_id TO publisher_id;
        ELSE
            -- If publisher_id already exists, just drop the old author_id
            ALTER TABLE posts DROP COLUMN author_id;
        END IF;
    END IF;
    
    -- Add new author_id column for authors
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'author_id'
    ) THEN
        ALTER TABLE posts ADD COLUMN author_id UUID;
    END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_authors_name ON authors(name);

-- Insert sample authors based on existing posts
INSERT INTO authors (name, avatar_url) 
SELECT DISTINCT author_name, author_avatar
FROM posts 
WHERE author_name IS NOT NULL AND author_name != ''
ON CONFLICT DO NOTHING;

-- Update existing posts to reference the new authors
UPDATE posts 
SET author_id = authors.id
FROM authors 
WHERE posts.author_name = authors.name 
AND posts.author_avatar = authors.avatar_url;

-- Update RLS policies to use the correct column name
-- Drop and recreate policies that might be using the wrong column name
DO $$ 
BEGIN
    -- Drop existing policies that might be using author_id incorrectly
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Publishers can update their own posts' AND tablename = 'posts') THEN
        DROP POLICY "Publishers can update their own posts" ON posts;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Publishers can delete their own posts' AND tablename = 'posts') THEN
        DROP POLICY "Publishers can delete their own posts" ON posts;
    END IF;
    
    -- Recreate policies with correct column references
    CREATE POLICY "Publishers can update their own posts" ON posts
      FOR UPDATE USING (
        publisher_id = auth.uid() AND
        EXISTS (
          SELECT 1 FROM user_roles 
          WHERE user_id = auth.uid() 
          AND role = 'publisher'
        )
      );
    
    CREATE POLICY "Publishers can delete their own posts" ON posts
      FOR DELETE USING (
        publisher_id = auth.uid() AND
        EXISTS (
          SELECT 1 FROM user_roles 
          WHERE user_id = auth.uid() 
          AND role = 'publisher'
        )
      );
END $$;

-- Now add the foreign key constraint after data is populated
-- First verify that all author_id values exist in authors table
DO $$ 
BEGIN
    -- Check if there are any orphaned author_id values
    IF EXISTS (
        SELECT 1 FROM posts p 
        WHERE p.author_id IS NOT NULL 
        AND NOT EXISTS (
            SELECT 1 FROM authors a WHERE a.id = p.author_id
        )
    ) THEN
        RAISE NOTICE 'Found orphaned author_id values, setting them to NULL';
        UPDATE posts 
        SET author_id = NULL 
        WHERE author_id IS NOT NULL 
        AND NOT EXISTS (
            SELECT 1 FROM authors WHERE id = posts.author_id
        );
    END IF;
END $$;

-- Add the foreign key constraint
ALTER TABLE posts ADD CONSTRAINT posts_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE SET NULL;

-- Create a function to get or create author
CREATE OR REPLACE FUNCTION get_or_create_author(
  author_name TEXT,
  author_avatar TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  author_uuid UUID;
BEGIN
  -- Try to find existing author by name
  SELECT id INTO author_uuid 
  FROM authors 
  WHERE name = author_name 
  LIMIT 1;
  
  -- If not found, create new author
  IF author_uuid IS NULL THEN
    INSERT INTO authors (name, avatar_url)
    VALUES (author_name, author_avatar)
    RETURNING id INTO author_uuid;
  END IF;
  
  RETURN author_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
