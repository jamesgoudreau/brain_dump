# Open Brain — Onboarding App

A web app that lets users sign in with magic link auth and seed their Open Brain with context extracted from their LinkedIn profile, resume, or job description.

## Stack
- Next.js 14 (App Router)
- Supabase Auth (magic link)
- Deployed on Vercel

## Setup

### 1. Create a Supabase project for auth
This is separate from your brain's Supabase project — it's just for user authentication.

1. Go to supabase.com → New Project
2. Go to Settings → API and copy:
   - Project URL
   - anon/public key
3. Go to Authentication → URL Configuration → set Site URL to your Vercel URL (you can update this after deploy)
4. Add `https://your-vercel-url.vercel.app/auth/callback` to Redirect URLs

### 2. Set up environment variables
Copy `.env.local.example` to `.env.local` and fill in:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Deploy to Vercel
1. Push this repo to GitHub
2. Go to vercel.com → New Project → import your repo
3. Add the two environment variables in Vercel's settings
4. Deploy

### 4. Update Supabase redirect URL
After deploying, copy your Vercel URL and add it to:
Supabase → Authentication → URL Configuration → Redirect URLs

## How it works for users
1. User visits the app and enters their email
2. They receive a magic link — click it to sign in
3. First time: they enter their Supabase URL, anon key, and Anthropic API key (stored locally in browser only)
4. They paste in their LinkedIn/resume/job description
5. Claude extracts structured memories across 5 categories
6. User reviews and saves directly to their own Supabase brain

## User credentials
Each user connects their own brain by entering:
- Their Supabase project URL
- Their Supabase anon key  
- Their Anthropic API key

These are stored in localStorage only — never sent to any server.
