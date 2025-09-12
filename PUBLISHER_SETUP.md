# Publisher User Type Setup Guide

This guide explains how to set up and use the new publisher user type functionality in your Filo application.

## Overview

The publisher system allows certain users to create, edit, and manage posts, while regular users (readers) can only view posts. Publishers have exclusive access to post creation and management features.

## Features Implemented

### 1. User Roles System
- **Reader**: Can view and read posts (default role)
- **Publisher**: Can create, edit, delete, and manage posts

### 2. Database Schema Updates
- New `user_roles` table to store user role information
- Updated `posts` table with `author_id` field for better tracking
- Row Level Security (RLS) policies for publisher-only post creation
- Helper functions for role checking

### 3. Authentication Updates
- Extended `AuthContext` to include user role information
- Role-based access control throughout the application
- Publisher role selection during signup

### 4. Publisher-Only Features
- **Create Post Page** (`/create-post`): Form for creating new posts
- **Publisher Dashboard** (`/publisher-dashboard`): Manage existing posts and view statistics
- **Post Management**: Edit and delete posts (publishers only)
- **Navigation**: Publisher-specific navigation and access controls

## Setup Instructions

### Step 1: Database Setup

Run the SQL script to set up the publisher system:

```sql
-- Execute the publisher_setup.sql file in your Supabase SQL editor
-- This will create the necessary tables, policies, and functions
```

The script includes:
- `user_roles` table creation
- RLS policies for publisher access
- Helper functions for role checking
- Default role assignment for existing users

### Step 2: Environment Variables

Ensure your `.env.local` file contains the Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 3: Test the Implementation

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Test Publisher Signup**:
   - Go to `/signup`
   - Select "Publisher" as account type
   - Complete the signup process
   - Verify the user role is created in the database

3. **Test Publisher Features**:
   - Sign in as a publisher
   - Navigate to `/create-post` to create a new post
   - Visit `/publisher-dashboard` to manage posts
   - Verify that regular readers cannot access publisher features

4. **Test Reader Experience**:
   - Sign up as a "Reader"
   - Verify they can only view posts
   - Confirm they cannot access publisher-only pages

## User Interface

### Publisher Navigation
Publishers see additional navigation options:
- **Create Post**: Direct access to post creation
- **Dashboard**: Publisher management interface
- **Publisher Badge**: Visual indicator of publisher status

### Post Creation Form
The create post page includes:
- Title and content fields
- Category selection
- Author information
- Thumbnail and avatar URLs
- Form validation and error handling

### Publisher Dashboard
Features include:
- Post statistics (total posts, recent activity)
- List of all published posts
- Edit and delete functionality
- Quick access to create new posts

## Security Features

### Row Level Security (RLS)
- Publishers can only create posts (not readers)
- Publishers can only edit/delete their own posts
- All users can read posts
- Role-based access control at the database level

### Access Control
- Publisher-only pages redirect non-publishers
- Role checking throughout the application
- Secure post management operations

## File Structure

```
src/
├── app/
│   ├── create-post/
│   │   └── page.tsx          # Post creation form
│   ├── publisher-dashboard/
│   │   └── page.tsx          # Publisher management interface
│   └── signup/
│       └── page.tsx          # Updated with role selection
├── components/
│   └── PublisherNav.tsx      # Publisher navigation component
├── contexts/
│   └── AuthContext.tsx       # Extended with role management
└── lib/
    └── supabase.ts           # Database client
```

## Database Tables

### user_roles
```sql
CREATE TABLE user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('reader', 'publisher')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### posts (updated)
```sql
-- Added author_id field
ALTER TABLE posts ADD COLUMN author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
```

## API Functions

### AuthContext Methods
- `isPublisher()`: Check if current user is a publisher
- `userRole`: Current user's role information
- `signUp()`: Extended to accept role parameter

### Database Functions
- `get_user_role(user_uuid)`: Get user's role
- `is_publisher(user_uuid)`: Check if user is publisher

## Troubleshooting

### Common Issues

1. **Role not being created during signup**:
   - Check Supabase RLS policies
   - Verify the `user_roles` table exists
   - Check browser console for errors

2. **Publisher features not accessible**:
   - Verify user role in database
   - Check `isPublisher()` function
   - Ensure proper authentication state

3. **Post creation fails**:
   - Check RLS policies for posts table
   - Verify publisher role assignment
   - Check form validation

### Debug Steps

1. Check user role in Supabase dashboard:
   ```sql
   SELECT * FROM user_roles WHERE user_id = 'your-user-id';
   ```

2. Verify RLS policies are active:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'posts';
   ```

3. Test publisher functions:
   ```sql
   SELECT is_publisher('your-user-id');
   ```

## Next Steps

Consider implementing:
- Post editing functionality
- Post approval workflow
- Publisher analytics and insights
- Content moderation tools
- Bulk post operations
- Post scheduling
- Draft post functionality

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify database setup and RLS policies
3. Test with different user roles
4. Review Supabase logs for database errors
