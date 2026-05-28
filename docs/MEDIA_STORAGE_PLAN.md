# Media Storage Plan

This document outlines a future Supabase Storage approach for My Sports Resume.

## Goals

- Support highlight videos as professional resume evidence
- Keep junior uploads private until approved
- Support thumbnails for faster browsing
- Support future profile photos or avatars
- Preserve safe public resume sharing rules
- Avoid exposing raw storage objects broadly

## Recommended Buckets

### `highlight-videos-private`
- Purpose: primary highlight video uploads
- Default visibility: private
- Contents:
  - adult highlight videos
  - junior highlight videos
- Notes:
  - default to signed URL access
  - recommended as the main video bucket for both adult and junior flows

### `highlight-thumbnails`
- Purpose: thumbnails or poster images for highlights
- Default visibility: mostly private, selectively public later if appropriate
- Contents:
  - generated or uploaded highlight thumbnails
- Notes:
  - can remain private and be served through signed URLs
  - if public thumbnails are later used, only approved shareable assets should be exposed

### `profile-avatars`
- Purpose: future athlete profile photos or avatars
- Default visibility: private or controlled public by profile visibility
- Contents:
  - athlete profile photos
  - possible guardian-approved junior avatars

### Optional future bucket: `review-attachments-private`
- Purpose: supporting documents or verification evidence
- Default visibility: private
- Examples:
  - club verification uploads
  - admin review evidence

## Highlight Video Plan

Recommended flow:
1. Athlete uploads video
2. Metadata row is created in `media_assets`
3. Highlight row references the asset
4. Visibility stays private by default
5. Parent and guardian approval is required for junior public use
6. Admin or workflow checks decide showcase eligibility

## Thumbnail Plan

Recommended options:
- generate thumbnails server-side after upload
- or allow a separate thumbnail upload field

Thumbnail metadata should still be stored in `media_assets`, not hard-coded into highlight rows only.

## Future Profile Photo Plan

If profile photos are added later:
- store metadata in `media_assets`
- link a chosen avatar asset to `athlete_profiles`
- keep junior avatar visibility under guardian control

## Junior Upload Approval Flow

Recommended junior media rules:
- upload allowed for the athlete or guardian account
- media stored privately first
- highlight row marked as pending parent approval
- no public resume display until guardian approval
- no showcase visibility until required approvals are complete

## File Size Guidance

Draft recommendations:
- highlight videos:
  - target 250 MB soft limit for V1 backend rollout
  - consider 500 MB absolute ceiling only if compression/transcoding is added
- thumbnails:
  - 5 MB max
- profile avatars:
  - 5 MB max

## File Type Restrictions

Recommended accepted video types:
- `video/mp4`
- `video/quicktime`
- `video/webm`

Recommended accepted image types:
- `image/jpeg`
- `image/png`
- `image/webp`

Recommended restrictions:
- reject executable formats
- reject archive uploads
- inspect MIME type and extension together

## Moderation and Review Process

Suggested media review states:
- uploaded
- pending_parent_approval
- pending_admin_review
- approved_profile_only
- approved_showcase
- rejected
- flagged

Moderation should support:
- content flagging
- visibility downgrade
- signed URL invalidation by policy

## Public and Private Storage Rules

Recommended default:
- all videos private
- all junior media private
- adult thumbnails and avatars can become shareable only after profile visibility checks

Safer long-term rule:
- use signed URLs for almost everything
- expose truly public storage objects only if there is a strong product reason

## Signed URL Approach

Use signed URLs for:
- private highlight videos
- junior thumbnails if they must remain restricted
- future verification evidence

Recommended access flow:
1. frontend requests media access
2. backend checks user role and asset visibility
3. backend returns short-lived signed URL
4. frontend streams or loads the asset

Good signed URL duration targets:
- 1 to 15 minutes depending on asset type and route

## Future Enhancements

- server-side transcoding
- automated thumbnail generation
- moderation scanning
- upload virus scanning if needed
- resumable uploads for large files
