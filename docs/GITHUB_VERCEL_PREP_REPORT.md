# GitHub / Vercel Prep Report

Date: 2026-05-28

This report prepares My Sports Resume for GitHub and Vercel planning only. No deploy was run.

## Git availability

- Git on PATH: no
- `git --version`: failed because `git` is not on PATH
- `where git`: failed because `git` is not on PATH
- Git installed at `C:\Program Files\Git\cmd\git.exe`: yes
- Git installed at `C:\Program Files\Git\bin\git.exe`: yes
- Git installed at `C:\Users\natha\AppData\Local\Programs\Git\cmd\git.exe`: no
- Verified installed version: `git version 2.54.0.windows.1`

## Local repository status

- Local `.git` folder exists: no
- `git status` using `C:\Program Files\Git\cmd\git.exe`: failed because this folder is not a git repository
- Repository was not initialised automatically
- No commit, push, or deploy command was run

## Ignore safety

`.gitignore` now protects:

- `node_modules`
- `dist`
- `.DS_Store`
- `.env`
- `.env.local`
- `.env.*.local`
- `npm-debug.log*`
- `yarn-debug.log*`
- `yarn-error.log*`
- `pnpm-debug.log*`
- `.vite`
- `.cache`

`dist/` is ignored. For Vite + Vercel, source files should be committed and Vercel should build `dist` during deployment.

## Secret audit result

Command run:

```bash
npm run audit:secrets
```

Result: passed.

Summary:

- no frontend Supabase service-role usage was found by the audit
- no Supabase secret key was found by the audit
- no database URL assignment was found by the audit
- no postgres connection string was found by the audit
- `.env.local` was skipped as a local-only env file
- frontend env documentation expects only the Supabase URL, anon key, backend enable flag, and app environment flag

## Deployment audit result

Command run:

```bash
npm run audit:deployment
```

Result: passed.

Summary:

- deployment readiness docs exist
- required package scripts exist
- `.env.local` and `.env.*.local` are ignored
- frontend Supabase client uses the anon key
- no frontend service-role usage was found in the Supabase client
- private media service still keeps `public_url` unset
- public-media-disabled and no-direct-messaging markers are present
- README includes the official support email
- README documents that public media stays disabled

## Build result

Command run:

```bash
npm run build
```

Result: passed.

Note: the existing Vite chunk-size warning remains. This is not currently a deployment blocker.

## Production safety status

- Public media access: disabled
- Public media URLs: disabled
- Public media feed: disabled
- Payments: not added
- Messaging/social features: not added
- Supabase RLS/public media safety: not changed in this prep pass
- `.env.local`: protected by `.gitignore`
- `dist/`: ignored by `.gitignore`

## Recommended next step

If Nathan wants to initialise local source control from this folder, use the installed Git path explicitly or add Git to PATH first.

Suggested next command from this project folder:

```powershell
& "C:\Program Files\Git\cmd\git.exe" init
```

After initialising, run:

```powershell
& "C:\Program Files\Git\cmd\git.exe" status --short
```

Then review the file list before staging anything. Do not push to GitHub or deploy to Vercel until the staged file list is confirmed clean and no env/secrets are included.
