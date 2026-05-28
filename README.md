# My Sports Resume

My Sports Resume is a premium React + Vite sports resume platform with guarded Supabase-backed auth, metadata persistence, private media uploads, and signed owner previews.

## Current status

- full app QA pass completed
- `npm run build` passes
- selected black/gold multi-sport hero banner is wired into the homepage hero
- approved standalone My Sports Resume logo is wired into the header, homepage brand mark, and auth/account logo badge areas
- Supabase Auth works
- app user profiles, athlete profiles, highlights metadata, opportunities metadata, contact requests, shortlists, admin queues, and media assets all have guarded Supabase-backed paths
- private profile photo, highlight thumbnail, and highlight video uploads work for signed-in owner use
- signed private previews work
- main profile/search/opportunity flow now starts with postcode/suburb and a simple sport list, then suggested clubs/teams
- the simple main sports list now covers Rugby League, Rugby Union, AFL, Soccer, Netball, Basketball, Cricket, Touch Football, Oztag, Athletics, Swimming, Boxing, Martial Arts, Tennis, Hockey, Golf, Baseball, Softball, Volleyball, Rowing, Surf Life Saving, and Other
- the postcode-first starter directory now supports a multi-sport 2460 / Grafton / South Grafton / Clarence Valley seed
- NSW Rugby League Group 2 starter clubs are retained in the postcode/suburb directory for easier testing
- a starter NSW Rugby League directory now powers click-based group, club, position, and highlight-type selectors for the first real sport focus
- broad sport categories are now internal catalogue metadata instead of the primary user-facing filter path
- Rugby League age groups now run cleanly from `Under 6` through `Under 18`, with senior footy options starting after that
- Highlight Manager now uses click-based sport-specific highlight chips plus collapsed optional match details so kids and parents do not need to type long match context just to save a clip
- the Australian sports directory is starter and expandable, not a complete official national club database yet
- custom club and competition fallback remains available when a family cannot find the right starter entry and displays as `Added manually - pending verification`
- public media access remains disabled
- public media URLs remain disabled
- public media feed remains disabled
- payments are not added
- messaging and social features are not added
- deployment has not been performed yet

For account, verification, or platform support, contact `mysportsresumeaus@outlook.com`.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Local audits

```bash
npm run audit:secrets
npm run audit:deployment
```

## Supabase frontend env setup

Use local-only frontend env values in `.env.local`:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_ENABLE_BACKEND=true
VITE_APP_ENV=local
```

Important:

- `.env.local` must remain local only and gitignored
- only the Supabase anon or publishable key is frontend-safe
- never place a `service_role` key in frontend code or Vercel client env vars
- turning backend on does not permit public media, public URLs, or public unauthenticated private-media access

## Deployment planning docs

- `docs/DEPLOYMENT_READINESS_PLAN.md`
- `docs/PRODUCTION_SAFETY_CHECKLIST.md`
- `docs/SUPABASE_PRODUCTION_CHECKS.md`
- `docs/BACKEND_READINESS_PLAN.md`
- `docs/MEDIA_STORAGE_ARCHITECTURE.md`
- `docs/AUTH_QA_CHECKLIST.md`
- `docs/PROJECT_SAVEPOINT.md`

## No-social product rule

My Sports Resume remains a sports resume platform, not social media.

- no chat
- no comments
- no DMs
- no followers
- no user-to-user messaging
- no inbox
- no conversation threads
- no public media feed

## Public media safety

- public media access remains disabled
- public media URLs remain disabled
- public unauthenticated private-media access remains disabled
- public video access remains disabled
- signed URLs are owner-scoped and short-lived only
- contact requests remain structured review records only
