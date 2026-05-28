# localStorage to Backend Mapping

This document maps the current local demo storage model to the proposed future backend model.

## `msr_profiles_v1`

- Current purpose:
  - stores athlete resume profiles
  - includes identity, sport, club, stats, achievements, references, availability, visibility, and completeness metadata
- Future tables:
  - `athlete_profiles`
  - `custom_team_entries`
  - `achievements`
  - `stats`
  - `playing_history`
  - `profile_references`
  - `availability`
  - `profile_visibility`
- Migration notes:
  - current frontend stores nested objects and arrays in one local record
  - backend should split one profile into multiple relational rows
- Fields needing normalization:
  - `achievementSections`
  - `stats`
  - `physicalDetails`
  - `playingHistory`
  - `references`
  - `availability`
  - `verificationBadges`
  - `teamDirectoryId` vs custom club entry

## `msr_highlights_v1`

- Current purpose:
  - stores highlight records, featured state, verification source, approval state, showcase state, and placeholder media URLs
- Future tables:
  - `highlights`
  - `highlight_approvals`
  - `highlight_boosts`
  - `media_assets`
- Migration notes:
  - media URLs should become asset references
  - approval history should be separated from the main highlight row
- Fields needing normalization:
  - `videoUrl`
  - `thumbnailUrl`
  - `verificationSource`
  - `approvalStatus`
  - `showcaseStatus`
  - `boostCount`
  - `isFeatured`

## `msr_contact_requests_v1`

- Current purpose:
  - stores safe contact requests and opportunity interest routing
  - includes history arrays and request counters
- Future tables:
  - `contact_requests`
  - `opportunity_interests`
  - optional `audit_log`
- Migration notes:
  - current key mixes two request types in one array
  - backend should still keep these related but structurally distinct
- Fields needing normalization:
  - `requestType`
  - `history`
  - `count`
  - `createdByRole`
  - `to`
  - `status`
  - `opportunityId`

## `msr_admin_queues_v1`

- Current purpose:
  - stores pending profile, highlight, opportunity, verification, and flagged-content review queues
- Future tables:
  - `admin_reviews`
  - `club_scout_verification_requests`
  - `moderation_flags`
- Migration notes:
  - queue arrays are currently UI-friendly and domain-mixed
  - backend should store durable review records instead of only queue cards
- Fields needing normalization:
  - `pendingProfiles`
  - `pendingHighlights`
  - `pendingOpportunities`
  - `verificationRequests`
  - `flaggedContent`
  - `status`
  - `reviewedAt`

## `msr_selected_role_v1`

- Current purpose:
  - stores the chosen demo role for onboarding and dashboard emphasis
- Future tables:
  - usually none required for core data
  - optionally `users.default_role` or a user preferences table later
- Migration notes:
  - in production, authenticated roles should come from `user_roles`
  - the local role memory can remain a client preference even after auth exists
- Fields needing normalization:
  - none beyond mapping demo labels to actual role identifiers

## `msr_opportunities_v1`

- Current purpose:
  - stores seeded and newly created opportunity board records
- Future tables:
  - `opportunities`
  - optional `admin_reviews`
- Migration notes:
  - currently includes verification state directly on the opportunity row
  - future backend can still keep a current status column while recording review events separately
- Fields needing normalization:
  - `sport`
  - `sportCategory`
  - `positionRole`
  - `verificationStatus`
  - `contactRoute`
  - `closingDate`
  - `createdAt`

## `msr_shortlist_v1`

- Current purpose:
  - stores shortlisted athlete ids for club and scout flows
- Future tables:
  - `shortlists`
- Migration notes:
  - current records are simple and easy to migrate
  - future backend should key them to a verified club or scout account
- Fields needing normalization:
  - `athleteId`
  - `createdByRole`
  - `createdAt`

## General Migration Notes

- The current frontend already normalizes older saved records safely
- The backend migration should preserve that same normalization mindset
- The safest path is a DTO layer that converts:
  - relational backend rows to current UI shapes
  - current UI shapes to relational write payloads

Recommended principle:
- do not let raw database rows leak directly into complex UI components
