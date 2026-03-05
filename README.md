# BrainDump v2 — Collect & Store Knowledge

A clean capture app for your Open Brain system. Paste anything — text, transcripts, PDFs — and it gets sent to your n8n webhook for processing and storage.

## What changed from v1

- **Email/password auth** instead of magic links
- **No API keys** in the UI — just your n8n webhook URL, stored once in your profile
- **All captures POST to your webhook** — same format as Slack, so your n8n workflow handles everything
- **Brighter design** — teal/navy palette, clean and fast

## Setup

### 1. Supabase — add the profiles table

In your Supabase SQL editor, run:

```sql
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  webhook_url text,
  updated_at timestamp default now()
);

-- Allow users to read/write their own profile only
alter table profiles enable row level security;

create policy "Users can manage their own profile"
  on profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);
```

### 2. Supabase — enable email/password auth

Go to **Authentication → Providers → Email** and make sure it's enabled.

Optionally disable magic links if you want password-only.

### 3. Environment variables

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Deploy to Vercel

```bash
vercel --prod
```

Add the two env vars in Vercel's project settings.

Update Supabase → Authentication → URL Configuration:
- Site URL: your Vercel URL
- Redirect URLs: `https://your-app.vercel.app/auth/callback`

### 5. First login

1. Sign up with email + password
2. On first login you'll be prompted to paste your n8n webhook URL
3. Find it in n8n → your workflow → Webhook node → **Production URL**
4. Save it — it's stored in your Supabase profile, never in localStorage

## How captures work

Every submit POSTs this body to your webhook:

```json
{ "body": { "event": { "text": "your content here" } } }
```

This matches the Slack event format exactly, so your existing n8n workflow handles it with no changes.

- **Short text** (≤2000 chars) → saved directly via the FALSE branch
- **Long text** (>2000 chars) → sent to Claude for atomic memory extraction via the TRUE branch
