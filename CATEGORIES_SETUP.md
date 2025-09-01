# Categories Feature Setup

This document explains how to set up the categories feature for the Filo application.

## Overview

The categories feature allows users to select two areas of focus from a predefined list:
- Physical activity
- Emotional well-being
- Mindful awareness
- Financial well-being
- Career & development
- Relationships
- Nutrition & lifestyle

## Database Setup

### 1. Run the SQL Script

Copy and paste the contents of `database_setup.sql` into your Supabase SQL editor and execute it. This will:

- Create the `user_preferences` table to store user category selections
- Create the `categories` table with predefined categories
- Set up Row Level Security (RLS) policies
- Create triggers for automatic timestamp updates

### 2. Verify Table Creation

After running the script, you should see:
- `user_preferences` table with columns: `id`, `user_id`, `selected_categories`, `created_at`, `updated_at`
- `categories` table with the 7 predefined categories
- RLS policies ensuring users can only access their own preferences

## User Flow

1. User signs up/signs in
2. User is redirected to `/intro` page
3. User clicks "Start" button
4. User is redirected to `/categories` page
5. User selects exactly 2 categories
6. User clicks "Continue" to save preferences
7. User is redirected to `/dashboard`

## Files Created/Modified

### New Files:
- `src/app/categories/page.tsx` - Main categories selection page
- `src/lib/userPreferences.ts` - Utility functions for preferences
- `database_setup.sql` - Database schema and setup
- `CATEGORIES_SETUP.md` - This setup guide

### Modified Files:
- `src/app/intro/page.tsx` - Updated to redirect to `/categories` instead of `/dashboard`

## Features

### Category Selection
- Users can select up to 2 categories
- Visual feedback with checkmarks and color changes
- Responsive grid layout
- Clear descriptions for each category

### Data Persistence
- User preferences are saved to Supabase
- Each user can only have one preference record (upsert)
- Automatic timestamp tracking

### Security
- Row Level Security ensures users can only access their own data
- Proper authentication checks
- Input validation

## Future Enhancements

The system is designed to be extensible:
- Categories can be easily added/modified in the database
- User preferences can be used to personalize content
- The `hasUserCompletedOnboarding()` function can be used to check if users need to complete the flow

## Testing

1. Create a new user account
2. Sign in and navigate to the intro page
3. Click "Start" to go to categories
4. Select 2 categories
5. Click "Continue" to save and proceed to dashboard
6. Verify preferences are saved in the database
