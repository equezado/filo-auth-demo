# Database Setup Instructions

To set up the new Posts table and sample data in your Supabase database, follow these steps:

## 1. Run the Database Setup Script

Execute the SQL commands in `database_setup.sql` in your Supabase SQL editor:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `database_setup.sql`
4. Run the script

**Note**: The script is now safe to run multiple times - it includes checks to prevent duplicate policies, triggers, and posts.

This will:
- Create the `posts` table with proper relationships to categories (if it doesn't exist)
- Set up Row Level Security (RLS) policies (only if they don't already exist)
- Insert 35 sample posts (5 for each category) - only new posts that don't already exist
- Create necessary triggers for automatic timestamp updates (only if they don't exist)

## 2. Verify the Setup

After running the script, you can verify the setup by:

1. Checking the `posts` table in the Table Editor
2. Running a test query: `SELECT * FROM posts LIMIT 5;`
3. Checking the relationship: `SELECT p.title, c.name FROM posts p JOIN categories c ON p.category_id = c.id LIMIT 5;`

## 3. Test the Application

1. Start the development server: `npm run dev`
2. Sign up or sign in to your account
3. Complete the category selection process
4. You should be redirected to the new `/feeds` page
5. The feeds page should display posts based on your selected categories

## Features of the New Feeds Page

- **Category Filtering**: Switch between your selected categories
- **Post Cards**: Each post shows:
  - Thumbnail image
  - Author name and avatar
  - Post title
  - Content preview
  - Category badge
  - Publication date
- **Responsive Design**: Works on desktop and mobile
- **Error Handling**: Graceful fallbacks for missing images

## Sample Data Included

The database now includes 35 sample posts across all 7 categories:

- **Physical Activity** (5 posts): Exercise, fitness, and health topics
- **Emotional Well-being** (5 posts): Mental health and emotional balance
- **Mindful Awareness** (5 posts): Meditation and mindfulness
- **Financial Well-being** (5 posts): Money management and investing
- **Career & Development** (5 posts): Professional growth and skills
- **Relationships** (5 posts): Family, friends, and social connections
- **Nutrition & Lifestyle** (5 posts): Healthy eating and daily routines

Each post includes realistic content, author information, and relevant images from Unsplash.
