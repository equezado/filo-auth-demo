# Setup Guide for Filo Authentication

## Step 1: Supabase Setup

1. **Create Supabase Account**
   - Go to [supabase.com](https://supabase.com)
   - Sign up with GitHub or email
   - Create a new organization (free)

2. **Create New Project**
   - Click "New Project"
   - Choose your organization
   - Enter project name: `filo-auth-demo`
   - Enter database password (save this!)
   - Choose region closest to you
   - Click "Create new project"

3. **Get API Keys**
   - Wait for project to finish setting up (2-3 minutes)
   - Go to Settings → API
   - Copy these values:
     - Project URL (starts with `https://`)
     - `anon` `public` key

## Step 2: Environment Configuration

1. **Create `.env.local` file**
   ```bash
   # In your project root directory
   touch .env.local
   ```

2. **Add your Supabase credentials**
   ```bash
   # .env.local
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Step 3: Test Locally

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Open browser**
   - Go to [http://localhost:3000](http://localhost:3000)
   - You should be redirected to `/signin`

## Step 4: Test Authentication

1. **Create Account**
   - Go to `/signup`
   - Enter email and password
   - Click "Create account"
   - Check your email for verification (if enabled)

2. **Sign In**
   - Go to `/signin`
   - Enter your credentials
   - You should be redirected to `/dashboard`

3. **Dashboard**
   - You should see your user information
   - Try the sign-out button

## Step 5: Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial authentication setup"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app is live! 🎉

## Troubleshooting

### Common Issues

1. **"Invalid API key" error**
   - Check your `.env.local` file
   - Make sure you copied the `anon` key, not the `service_role` key

2. **"Project not found" error**
   - Verify your Supabase project URL
   - Make sure the project is fully set up

3. **Authentication not working**
   - Check browser console for errors
   - Verify environment variables are loaded
   - Restart your development server

4. **Styling issues**
   - Make sure Tailwind CSS is working
   - Check if `npm run dev` completed successfully

### Getting Help

- Check the browser console for error messages
- Verify your Supabase project settings
- Ensure all environment variables are set correctly
- Try clearing browser cache and cookies

## Next Steps

Once everything is working:

1. **Customize the UI** - Modify colors, fonts, and layout
2. **Add features** - User profiles, password reset, social auth
3. **Database tables** - Create custom tables for user data
4. **Email templates** - Customize verification emails
5. **Security** - Add rate limiting, 2FA, etc.

## Production Considerations

- Enable email verification in Supabase
- Set up proper CORS policies
- Configure authentication providers
- Set up monitoring and logging
- Regular security updates
