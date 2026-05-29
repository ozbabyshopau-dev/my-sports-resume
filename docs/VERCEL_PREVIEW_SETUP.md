# Vercel Preview Setup

This document is for setting up a Vercel preview deployment for My Sports Resume only. Do not production deploy until preview QA has passed.

## Repository

- GitHub repository: https://github.com/ozbabyshopau-dev/my-sports-resume.git
- Branch: `main`
- Latest prepared commit: `92397c2` (`Polish logo hero and pilot profile flow`)

## Vercel Project Settings

- Framework preset: `Vite`
- Install command: Vercel default is acceptable (`npm install`)
- Build command: `npm run build`
- Output directory: `dist`

## Required Environment Variables

Add these in Vercel before the first preview deployment:

```text
VITE_SUPABASE_URL=<your Supabase project URL>
VITE_SUPABASE_ANON_KEY=<your frontend-safe Supabase anon/publishable key>
VITE_ENABLE_BACKEND=true
VITE_APP_ENV=preview
```

Only use the Supabase anon/publishable key in Vercel client environment variables.

Never add any of these to Vercel frontend/client env:

- `service_role`
- `SUPABASE_SERVICE_ROLE`
- `sb_secret`
- `DATABASE_URL`
- `postgres://...`
- JWT or private signing secrets

`.env.local` must stay local-only and must not be uploaded, committed, or pasted into documentation.

## Manual Dashboard Steps

1. Open Vercel Dashboard.
2. Choose `Import Git Repository`.
3. Select `ozbabyshopau-dev/my-sports-resume`.
4. Set Framework Preset to `Vite`.
5. Confirm Build Command is `npm run build`.
6. Confirm Output Directory is `dist`.
7. Add the required preview environment variables before deploying.
8. Deploy a preview first.
9. Run preview QA before any production deploy.

## What Must Stay Disabled

- Public media access remains disabled.
- Public media URLs remain disabled.
- Public media feed remains disabled.
- Public video feed remains disabled.
- Payments are not added.
- Chat, DMs, inbox, comments, followers, conversation threads, and user-to-user messaging are not added.
- Supabase storage buckets remain private unless a later reviewed phase changes that intentionally.

## Preview QA Checklist

After the preview URL is created, verify:

- Homepage loads with approved logo and hero banner.
- Create Profile uses the simplified postcode-first flow.
- Scout Search and Opportunities use parent-friendly sport/postcode/club filters.
- Login and Supabase Auth work with preview env vars.
- Backend test panels still pass where applicable.
- Private media previews remain signed/private only.
- Public resume remains public-safe.
- No service role or secret key is exposed in frontend code or browser output.

## Production Deploy Rule

Do not run `vercel --prod`, promote a preview, or assign production domains until Nathan confirms preview QA is complete.
