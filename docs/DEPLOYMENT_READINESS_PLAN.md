# Deployment Readiness Plan

## Current app status

My Sports Resume is now in a pre-deployment planning state with:

- passing `npm run build`
- passing full app QA notes in `PROJECT_SAVEPOINT.md`
- working Supabase Auth
- guarded Supabase-backed metadata for:
  - `app_user_profiles`
  - `athlete_profiles`
  - `highlights`
  - `opportunities`
  - `contact_requests`
  - `shortlists`
  - `admin_queue_items`
  - `media_assets`
- working private storage for:
  - profile photos
  - highlight thumbnails
  - highlight videos
- signed owner previews only
- public media still disabled

Deployment has not been performed yet.

## Local development command

```bash
npm run dev
```

## Build command

```bash
npm run build
```

## Required audit commands

```bash
npm run audit:secrets
npm run audit:deployment
```

## Supabase project requirements

The deployment target must point at the intended My Sports Resume Supabase project with:

- Auth enabled for email/password sign-in
- required public schema tables present:
  - `app_user_profiles`
  - `athlete_profiles`
  - `highlights`
  - `opportunities`
  - `contact_requests`
  - `shortlists`
  - `admin_queue_items`
  - `media_assets`
- RLS enabled on the tables above
- private storage buckets configured:
  - `msr-profile-photos`
  - `msr-highlight-thumbnails`
  - `msr-highlight-videos`
- owner-scoped storage object policies in place
- no public storage bucket access

## Required Vercel env variables

Client-safe frontend env vars for preview and production:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_ENABLE_BACKEND=true
VITE_APP_ENV=production
```

For preview deployments, `VITE_APP_ENV=preview` is also acceptable.

Important:

- never add a Supabase `service_role` key to frontend code or Vercel client env
- `.env.local` must remain local-only and gitignored
- only the anon or publishable Supabase key is frontend-safe

## What must stay disabled

These must remain disabled during deployment planning and initial release:

- public media URLs
- public media buckets
- public unauthenticated private-media access
- public media feed
- public video feed
- payments
- chat
- comments
- DMs
- followers
- user-to-user messaging
- inbox
- conversation threads

## Pre-deploy checklist

- run `npm run build`
- run `npm run audit:secrets`
- run `npm run audit:deployment`
- verify `.env.local` is not committed
- verify only `VITE_SUPABASE_ANON_KEY` is exposed to the frontend
- verify Supabase SQL tables and storage buckets match `SUPABASE_PRODUCTION_CHECKS.md`
- verify RLS remains enabled on all production tables
- verify storage buckets remain private
- verify public media URLs remain disabled
- verify public resume still stays metadata-safe
- verify contact requests remain structured review records only
- verify junior media remains parent/guardian approval-gated

## Post-deploy checklist

- confirm homepage loads in the deployment URL
- confirm login and create-account pages render
- confirm signed-in Account page shows the expected backend status
- confirm public resume route stays safe and does not expose private media
- confirm private owner media still loads only via signed preview
- confirm no public bucket browsing is possible
- confirm no public media feed exists
- confirm support email displays correctly

## Known non-blockers

- current Vite build still shows the existing chunk-size warning
- current dev browser still shows React Router future-flag warnings in development
- some QA panels intentionally create temporary test rows and should be used deliberately in preview/production

## Known safety rules

- This is not social media.
- No direct messaging.
- No public media by default.
- No public URLs for private media.
- Junior media requires parent/guardian approval.
- Admin review controls remain metadata-led and safe.
