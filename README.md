# Filo - Authentication Proof of Concept

A simple, modern authentication system built with Next.js 14, Supabase, and Tailwind CSS.

## Features

- ✅ User registration and login
- ✅ Protected routes
- ✅ Responsive design with Tailwind CSS
- ✅ TypeScript support
- ✅ Modern Next.js 14 App Router
- ✅ Supabase authentication backend

## Tech Stack

- **Frontend**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Language**: TypeScript
- **Deployment**: Vercel (recommended)

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd filo
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to Settings → API
3. Copy your project URL and anon key

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# NextAuth Configuration (optional for this demo)
NEXTAUTH_SECRET=your_nextauth_secret_key_here
NEXTAUTH_URL=http://localhost:3000
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── dashboard/         # Protected dashboard page
│   ├── signin/           # Sign-in page
│   ├── signup/           # Sign-up page
│   ├── layout.tsx        # Root layout with AuthProvider
│   └── page.tsx          # Home page with redirects
├── contexts/
│   └── AuthContext.tsx   # Authentication context
└── lib/
    └── supabase.ts       # Supabase client configuration
```

## Authentication Flow

1. **Home Page** (`/`) - Redirects based on auth status
2. **Sign Up** (`/signup`) - Create new account
3. **Sign In** (`/signin`) - Login to existing account
4. **Dashboard** (`/dashboard`) - Protected welcome screen

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add your environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Make sure to set these in your production environment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (your production domain)

## Customization

### Adding New Protected Routes

1. Create a new page in `src/app/`
2. Use the `useAuth()` hook to check authentication
3. Redirect unauthenticated users to `/signin`

### Styling

The app uses Tailwind CSS. You can customize colors, spacing, and components in `tailwind.config.js`.

## Security Features

- Password validation (minimum 6 characters)
- Protected routes with automatic redirects
- Secure session management
- CSRF protection via Supabase

## Next Steps

This is a basic proof of concept. Consider adding:

- Email verification
- Password reset functionality
- Social authentication (Google, GitHub)
- User profile management
- Role-based access control
- Database tables for user data

## Support

For issues or questions:
1. Check Supabase documentation
2. Review Next.js documentation
3. Check the browser console for errors

## License

MIT License - feel free to use this code for your projects!
