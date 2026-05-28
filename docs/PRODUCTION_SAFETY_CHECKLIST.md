# Production Safety Checklist

Use this checklist before any preview or production deployment is considered ready.

## Frontend env safety

- `VITE_SUPABASE_URL` is set correctly
- `VITE_SUPABASE_ANON_KEY` is set correctly
- `VITE_ENABLE_BACKEND=true`
- `VITE_APP_ENV=preview` or `VITE_APP_ENV=production`
- no `service_role` key is present in frontend env vars
- `.env.local` remains local-only and gitignored

## Database safety

- RLS is enabled on:
  - `app_user_profiles`
  - `athlete_profiles`
  - `highlights`
  - `opportunities`
  - `contact_requests`
  - `shortlists`
  - `admin_queue_items`
  - `media_assets`
- owner-scoped policies remain active
- no public table-wide read policies are added by accident

## Storage safety

- `msr-profile-photos` is private
- `msr-highlight-thumbnails` is private
- `msr-highlight-videos` is private
- no public media bucket is enabled
- no public storage object policies are enabled
- public media URLs remain disabled
- signed URLs remain short-lived and owner-scoped

## Product safety

- public unauthenticated private-media access is blocked
- public media feed is disabled
- public video feed is disabled
- public resume remains metadata-safe
- contact requests remain structured review records only
- junior media remains parent/guardian approval-gated
- admin media review remains active

## No-social rule

- no chat
- no comments
- no DMs
- no followers
- no user-to-user messaging
- no inbox
- no conversation threads

## Payments

- no payments
- no payment provider keys in frontend env

## Final checks

- `npm run build` passes
- `npm run audit:secrets` passes
- `npm run audit:deployment` passes
- support email still points to `mysportsresumeaus@outlook.com`
