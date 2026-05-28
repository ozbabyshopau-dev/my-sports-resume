# Supabase Auth Setup

This guide is for My Sports Resume Supabase Auth Phase 1 only.

What this phase includes:
- real account sign up
- real login
- logout
- session detection
- lightweight account role sync with `app_user_profiles`

What this phase does not migrate yet:
- athlete profiles
- highlights
- opportunities
- shortlist data
- contact request data
- admin queue data

Those product records still stay in localStorage in this phase.

For account, verification, or platform support, contact mysportsresumeaus@outlook.com.

## 1. Create or open a Supabase project

1. Sign in to [Supabase](https://supabase.com/).
2. Create a new project or open the existing My Sports Resume project.
3. Wait for the project to finish provisioning before continuing.

## 2. Find the frontend-safe API values

In Supabase:

1. Open `Project Settings`.
2. Open `API`.
3. Copy:
   - `Project URL`
   - `anon public` key

Use only those frontend-safe values in My Sports Resume.

Never place the `service_role` key in the frontend app.

## 3. Create your local env file

In the project root, create `.env.local` using `.env.example` as the template.

Use:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_ENABLE_BACKEND=false
VITE_APP_ENV=local
```

Important:
- keep `VITE_ENABLE_BACKEND=false` until the SQL below has been run
- keeping it `false` preserves the local demo account flow while you finish setup

## 4. Enable Email / Password auth

In Supabase:

1. Open `Authentication`.
2. Open `Providers`.
3. Find `Email`.
4. Enable email and password sign-in.

Recommended for testing:
- leave confirmation email settings however you prefer for your test project
- if email confirmation is required, the app will still create the account, but sign-in may require email confirmation first

## 5. Run the Phase 1 SQL

Use the focused SQL file:

- `supabase/auth_phase_1.sql`

In Supabase:

1. Open `SQL Editor`.
2. Paste the contents of `supabase/auth_phase_1.sql`.
3. Run the script.

This creates only the Phase 1 account table and policies:
- `public.app_user_profiles`
- role constraint
- indexes
- `updated_at` trigger
- authenticated table grants
- RLS policies for own-row select, insert, and update

## 6. Turn backend auth on for testing

After the SQL has been created successfully, update `.env.local`:

```env
VITE_ENABLE_BACKEND=true
```

At that point, real auth should activate only when all of these are true:
- `VITE_ENABLE_BACKEND=true`
- `VITE_SUPABASE_URL` exists
- `VITE_SUPABASE_ANON_KEY` exists
- the Supabase client validates successfully

If any of those are missing, the app stays in safe local mode.

## 7. Start the app

```bash
npm install
npm run dev
```

Build check:

```bash
npm run build
```

## 8. Test the real auth flow

With backend enabled:

1. Open `Create Account`.
2. Create a real account with:
   - full name
   - email
   - password
   - role
   - optional organisation name
3. Open `Login`.
4. Sign in with the same email and password.
5. Open `Account`.
6. Confirm it shows:
   - `Supabase account active`
   - email
   - full name
   - selected role
7. Open `Admin Dashboard`.
8. Confirm backend status shows:
   - `Supabase Auth Active`

## 9. If `app_user_profiles` is missing

The app should not crash.

Instead, it will show a warning similar to:

`Supabase auth is connected, but app_user_profiles has not been created yet. Role data is temporarily falling back to auth metadata.`

That means:
- auth is working
- the lightweight profile table is not ready yet
- sports data is still local either way

If you see a permission warning instead, such as:

`app_user_profiles is missing the required authenticated table grants`

rerun the latest `supabase/auth_phase_1.sql` file. The updated Phase 1 SQL now includes the required `GRANT` statements for signed-in users.

## 10. Current safe product limits

This phase still keeps the existing product rules:
- no chat
- no comments
- no DMs
- no followers
- no user-to-user messaging
- juniors still require parent or guardian approval
- clubs and scouts still use contact requests only
- exact addresses are not shown

## 11. Next phase after auth testing

After auth is working reliably, the next backend phase should be:

1. keep local sports data active
2. verify `app_user_profiles` role sync
3. plan profile read/write migration behind the existing data-service boundary
4. leave highlights and opportunities local until their schema and safety checks are ready
