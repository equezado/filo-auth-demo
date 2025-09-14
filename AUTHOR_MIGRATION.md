# Author Selection Feature - Database Migration

This document describes the database changes needed to support the new author selection feature.

## Overview

The author selection feature allows publishers to:
- Select existing authors from a dropdown when creating posts
- Add new authors on-the-fly during post creation
- Reuse author information across multiple posts

## Database Changes Required

### 1. Create Authors Table

Run the SQL script `author_setup.sql` in your Supabase SQL editor:

```sql
-- This script creates the authors table and updates the posts table
-- See author_setup.sql for the complete migration
```

### 2. Manual Migration Steps

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to SQL Editor

2. **Run the Migration**
   - Copy the contents of `author_setup.sql`
   - Paste into the SQL Editor
   - Click "Run" to execute

3. **Verify the Migration**
   - Check that the `authors` table was created
   - Verify the `author_id` column was added to `posts` table
   - Confirm existing posts have been linked to authors

## What the Migration Does

1. **Creates `authors` table** with:
   - `id` (UUID primary key)
   - `name` (author name)
   - `avatar_url` (optional avatar image)
   - `created_at` and `updated_at` timestamps

2. **Updates `posts` table** by:
   - Adding `author_id` column referencing authors table
   - Creating indexes for better performance

3. **Migrates existing data** by:
   - Creating author records from existing post author names
   - Linking existing posts to their corresponding authors

4. **Sets up security** with:
   - Row Level Security (RLS) policies
   - Proper permissions for publishers

## Testing the Feature

After running the migration:

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Test author selection**
   - Go to `/create-post` as a publisher
   - Try selecting an existing author
   - Try adding a new author
   - Create a post with the selected author

3. **Verify in database**
   - Check that new posts have `author_id` populated
   - Verify author information is consistent

## Troubleshooting

### Common Issues

1. **"Authors table not found" error**
   - Make sure you ran the migration script
   - Check that the `authors` table exists in your database

2. **"Permission denied" error**
   - Verify RLS policies are set up correctly
   - Check that your user has publisher role

3. **Existing posts not linked to authors**
   - Run the migration script again
   - Check for any data inconsistencies

### Rollback (if needed)

If you need to rollback the changes:

```sql
-- Remove author_id column from posts
ALTER TABLE posts DROP COLUMN IF EXISTS author_id;

-- Drop authors table
DROP TABLE IF EXISTS authors;
```

## Next Steps

After successful migration:

1. Test the author selection feature thoroughly
2. Consider adding author management features
3. Monitor database performance with the new indexes
4. Plan for author profile enhancements

## Support

If you encounter issues:

1. Check the Supabase logs for detailed error messages
2. Verify your database permissions
3. Ensure all migration steps completed successfully
4. Test with a fresh database if needed
