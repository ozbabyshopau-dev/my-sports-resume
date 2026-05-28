# Supabase Production Checks

Use these checks before any public deployment is approved.

## Expected tables

These public schema tables are expected:

- `app_user_profiles`
- `athlete_profiles`
- `highlights`
- `opportunities`
- `contact_requests`
- `shortlists`
- `admin_queue_items`
- `media_assets`

## Expected storage buckets

These private buckets are expected:

- `msr-profile-photos`
- `msr-highlight-thumbnails`
- `msr-highlight-videos`

Optional future buckets such as verification documents should remain separate and private if introduced later.

## Expected RLS posture

- RLS enabled on all app data tables
- owner-scoped select/insert/update/delete rules where designed
- no unauthenticated table reads for private data
- no public policy added for private media assets
- no public bucket browsing

## Frontend key rule

Frontend environments must use:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Never expose:

- `service_role`
- `SUPABASE_SERVICE_ROLE`
- any backend secret key

## Manual SQL checks

### Confirm required tables exist

```sql
select table_schema, table_name
from information_schema.tables
where table_schema = 'public'
and table_name in (
  'app_user_profiles',
  'athlete_profiles',
  'highlights',
  'opportunities',
  'contact_requests',
  'shortlists',
  'admin_queue_items',
  'media_assets'
)
order by table_name;
```

### Confirm RLS is enabled

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
and tablename in (
  'app_user_profiles',
  'athlete_profiles',
  'highlights',
  'opportunities',
  'contact_requests',
  'shortlists',
  'admin_queue_items',
  'media_assets'
)
order by tablename;
```

### Confirm policies exist

```sql
select schemaname, tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
and tablename in (
  'app_user_profiles',
  'athlete_profiles',
  'highlights',
  'opportunities',
  'contact_requests',
  'shortlists',
  'admin_queue_items',
  'media_assets'
)
order by tablename, policyname;
```

### Confirm buckets are private

```sql
select id, name, public
from storage.buckets
where name in (
  'msr-profile-photos',
  'msr-highlight-thumbnails',
  'msr-highlight-videos'
)
order by name;
```

### Confirm storage policies exist

```sql
select schemaname, tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'storage'
and tablename = 'objects'
order by policyname;
```

## How to verify public unauthenticated media is blocked

1. Open a private or incognito browser window with no active session.
2. Visit public resume and highlight routes.
3. Confirm:
   - private images do not render
   - private videos do not render
   - no signed private preview appears
   - no public bucket listing is available
4. If a raw object URL is known, verify it does not load anonymously.

## How to verify owner-scoped records

1. Sign in as user A and create or review:
   - an athlete profile
   - a highlight
   - a shortlist
   - a contact request
   - a media asset
2. Sign out, then sign in as user B.
3. Confirm user B cannot see or mutate user A owner-scoped records unless an explicit route is intentionally designed for that relationship.
4. Confirm admin and parent dashboards do not expose unrelated private media.

## Media-specific production checks

- `public_url` remains empty for private media assets
- signed preview expiry remains short-lived
- junior media remains parent/guardian approval-gated
- admin review remains required before broader visibility
