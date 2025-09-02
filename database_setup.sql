-- Create user_preferences table to store user category selections
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_categories TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create categories table for reference (optional, for future extensibility)
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the predefined categories
INSERT INTO categories (id, name, description) VALUES
  ('physical-activity', 'Physical activity', 'Exercise, fitness, and physical health'),
  ('emotional-wellbeing', 'Emotional well-being', 'Mental health, emotions, and psychological balance'),
  ('mindful-awareness', 'Mindful awareness', 'Meditation, mindfulness, and conscious living'),
  ('financial-wellbeing', 'Financial well-being', 'Money management, savings, and financial planning'),
  ('career-development', 'Career & development', 'Professional growth, skills, and career advancement'),
  ('relationships', 'Relationships', 'Family, friends, and social connections'),
  ('nutrition-lifestyle', 'Nutrition & lifestyle', 'Healthy eating, habits, and daily routines')
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policies for user_preferences (with IF NOT EXISTS equivalent)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own preferences' AND tablename = 'user_preferences') THEN
        CREATE POLICY "Users can view their own preferences" ON user_preferences
          FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own preferences' AND tablename = 'user_preferences') THEN
        CREATE POLICY "Users can insert their own preferences" ON user_preferences
          FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own preferences' AND tablename = 'user_preferences') THEN
        CREATE POLICY "Users can update their own preferences" ON user_preferences
          FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create policies for categories (read-only for all authenticated users)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view categories' AND tablename = 'categories') THEN
        CREATE POLICY "Authenticated users can view categories" ON categories
          FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at (with IF NOT EXISTS equivalent)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_preferences_updated_at') THEN
        CREATE TRIGGER update_user_preferences_updated_at
          BEFORE UPDATE ON user_preferences
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  thumbnail_url TEXT,
  category_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create policies for posts (read-only for all authenticated users)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view posts' AND tablename = 'posts') THEN
        CREATE POLICY "Authenticated users can view posts" ON posts
          FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Create trigger to automatically update updated_at for posts
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_posts_updated_at') THEN
        CREATE TRIGGER update_posts_updated_at
          BEFORE UPDATE ON posts
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Insert sample posts for each category (only if they don't already exist)
INSERT INTO posts (title, content, author_name, author_avatar, thumbnail_url, category_id) 
SELECT * FROM (VALUES
-- Physical Activity Posts
('5 Morning Exercises That Will Transform Your Day', 'Start your day with these simple yet effective exercises that boost energy and set a positive tone for the entire day.', 'Sarah Johnson', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop', 'physical-activity'),
('The Science Behind High-Intensity Interval Training', 'Discover why HIIT workouts are so effective and how to incorporate them into your fitness routine for maximum results.', 'Mike Chen', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400&h=250&fit=crop', 'physical-activity'),
('Building Strength at Home: No Gym Required', 'Learn how to build muscle and strength using just your body weight and minimal equipment in the comfort of your home.', 'Emma Rodriguez', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=250&fit=crop', 'physical-activity'),
('Yoga for Beginners: Finding Your Flow', 'Start your yoga journey with these foundational poses and breathing techniques that will help you build strength and flexibility.', 'David Park', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=250&fit=crop', 'physical-activity'),
('The Mental Benefits of Regular Exercise', 'Explore how physical activity not only transforms your body but also enhances your mental clarity, mood, and overall well-being.', 'Lisa Thompson', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop', 'physical-activity'),

-- Emotional Well-being Posts
('Understanding and Managing Anxiety in Daily Life', 'Practical strategies to recognize anxiety triggers and develop healthy coping mechanisms for a more balanced life.', 'Dr. Amanda Foster', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop', 'emotional-wellbeing'),
('The Power of Gratitude: A Daily Practice', 'Learn how cultivating gratitude can significantly improve your emotional well-being and overall life satisfaction.', 'James Wilson', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=250&fit=crop', 'emotional-wellbeing'),
('Building Emotional Resilience in Challenging Times', 'Discover techniques to strengthen your emotional resilience and bounce back from setbacks with greater ease.', 'Maria Garcia', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop', 'emotional-wellbeing'),
('The Art of Self-Compassion: Being Kind to Yourself', 'Explore how practicing self-compassion can transform your relationship with yourself and improve your mental health.', 'Dr. Robert Kim', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=250&fit=crop', 'emotional-wellbeing'),
('Creating Healthy Boundaries for Better Relationships', 'Learn how setting clear boundaries can protect your emotional well-being and improve your relationships with others.', 'Jennifer Lee', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop', 'emotional-wellbeing'),

-- Mindful Awareness Posts
('Meditation for Beginners: Your First Steps', 'Start your meditation journey with these simple techniques that will help you develop mindfulness and inner peace.', 'Zen Master Alex', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=250&fit=crop', 'mindful-awareness'),
('Mindful Eating: Transforming Your Relationship with Food', 'Discover how practicing mindfulness during meals can improve your digestion, satisfaction, and overall health.', 'Dr. Sarah Martinez', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=250&fit=crop', 'mindful-awareness'),
('The Science of Mindfulness: What Research Tells Us', 'Explore the latest scientific findings on how mindfulness practices affect the brain and improve mental health.', 'Dr. Michael Brown', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=250&fit=crop', 'mindful-awareness'),
('Walking Meditation: Finding Peace in Motion', 'Learn how to practice meditation while walking, combining physical activity with mindfulness for a unique experience.', 'Luna Chen', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop', 'mindful-awareness'),
('Digital Detox: Reclaiming Your Attention', 'Discover the benefits of reducing screen time and how to create a healthier relationship with technology.', 'Tom Anderson', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=250&fit=crop', 'mindful-awareness'),

-- Financial Well-being Posts
('Building Your First Emergency Fund: A Step-by-Step Guide', 'Learn how to create a financial safety net that will protect you during unexpected life events and emergencies.', 'Financial Advisor Rachel', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=250&fit=crop', 'financial-wellbeing'),
('Investing 101: Making Your Money Work for You', 'Start your investment journey with these fundamental concepts that every beginner should understand.', 'Mark Thompson', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop', 'financial-wellbeing'),
('Debt-Free Living: Strategies That Actually Work', 'Discover proven methods to eliminate debt and build a solid foundation for long-term financial freedom.', 'Lisa Chang', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=250&fit=crop', 'financial-wellbeing'),
('Budgeting Made Simple: The 50/30/20 Rule', 'Learn this popular budgeting method that helps you allocate your income effectively while maintaining financial balance.', 'David Miller', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop', 'financial-wellbeing'),
('Retirement Planning: It''s Never Too Early to Start', 'Understand the importance of early retirement planning and simple steps to secure your financial future.', 'Jennifer Walsh', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=250&fit=crop', 'financial-wellbeing'),

-- Career & Development Posts
('Networking That Actually Works: Building Meaningful Connections', 'Learn how to network authentically and build professional relationships that advance your career.', 'Career Coach Alex', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&h=250&fit=crop', 'career-development'),
('The Future of Work: Skills You Need to Thrive', 'Discover the essential skills and mindset shifts needed to succeed in the rapidly evolving job market.', 'Dr. Sarah Johnson', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop', 'career-development'),
('Leadership Skills for the Modern Workplace', 'Develop the leadership qualities that will set you apart and help you advance in your professional journey.', 'Michael Rodriguez', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&h=250&fit=crop', 'career-development'),
('Remote Work Mastery: Thriving in a Digital Environment', 'Learn how to excel in remote work settings and maintain productivity while working from home.', 'Emma Chen', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop', 'career-development'),
('Personal Branding: Making Your Mark in the Professional World', 'Discover how to build a strong personal brand that opens doors and creates opportunities in your field.', 'Lisa Park', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&h=250&fit=crop', 'career-development'),

-- Relationships Posts
('The Art of Active Listening: Strengthening Your Connections', 'Learn how to truly listen to others and build deeper, more meaningful relationships in all areas of life.', 'Relationship Coach Maria', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=250&fit=crop', 'relationships'),
('Building Trust in Relationships: A Foundation for Love', 'Discover the key elements that build and maintain trust in romantic, family, and friendship relationships.', 'Dr. James Wilson', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&h=250&fit=crop', 'relationships'),
('Conflict Resolution: Turning Disagreements into Growth', 'Learn healthy ways to handle conflicts and disagreements that strengthen rather than damage your relationships.', 'Sarah Thompson', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=250&fit=crop', 'relationships'),
('Long-Distance Relationships: Making Love Work Across Miles', 'Practical tips and strategies for maintaining strong, healthy relationships when you''re physically apart.', 'David Kim', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&h=250&fit=crop', 'relationships'),
('Family Dynamics: Navigating Complex Relationships', 'Understanding and improving family relationships through better communication and emotional intelligence.', 'Dr. Amanda Foster', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=250&fit=crop', 'relationships'),

-- Nutrition & Lifestyle Posts
('Meal Prep Mastery: Healthy Eating Made Simple', 'Learn how to prepare nutritious meals in advance and maintain a healthy diet despite a busy schedule.', 'Nutritionist Lisa', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=250&fit=crop', 'nutrition-lifestyle'),
('The Power of Hydration: Water''s Impact on Your Health', 'Discover how proper hydration affects your energy, mood, and overall well-being, plus practical tips to drink more water.', 'Dr. Mark Johnson', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=400&h=250&fit=crop', 'nutrition-lifestyle'),
('Sleep Optimization: Creating the Perfect Night Routine', 'Learn how to improve your sleep quality and create evening routines that promote restful, restorative sleep.', 'Sleep Expert Sarah', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&h=250&fit=crop', 'nutrition-lifestyle'),
('Plant-Based Nutrition: A Beginner''s Guide', 'Explore the benefits of incorporating more plant-based foods into your diet and how to make the transition smoothly.', 'Chef Michael', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=250&fit=crop', 'nutrition-lifestyle'),
('Stress-Free Living: Creating Balance in Your Daily Life', 'Discover practical strategies for managing stress and creating a more balanced, fulfilling lifestyle.', 'Wellness Coach Emma', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face', 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&h=250&fit=crop', 'nutrition-lifestyle')
) AS new_posts(title, content, author_name, author_avatar, thumbnail_url, category_id)
WHERE NOT EXISTS (
    SELECT 1 FROM posts WHERE posts.title = new_posts.title
);
