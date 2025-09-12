-- Revert Specialist System - Remove specialist tables and rating functionality
-- This script removes all specialist-related tables and reverts the posts table to its original state

-- Drop specialist-related tables and their dependencies
DROP TABLE IF EXISTS post_reviews CASCADE;
DROP TABLE IF EXISTS specialists CASCADE;

-- Remove rating columns from posts table
ALTER TABLE posts DROP COLUMN IF EXISTS average_rating;
ALTER TABLE posts DROP COLUMN IF EXISTS review_count;

-- Drop the rating statistics update function
DROP FUNCTION IF EXISTS update_post_rating_stats();

-- Note: The posts table will remain with its original structure:
-- - id (UUID)
-- - title (TEXT)
-- - content (TEXT)
-- - author_name (TEXT)
-- - author_avatar (TEXT)
-- - thumbnail_url (TEXT)
-- - category_id (TEXT)
-- - created_at (TIMESTAMP)
-- - updated_at (TIMESTAMP)

-- The user_preferences and categories tables remain unchanged
-- as they were part of the original system before specialists were added
