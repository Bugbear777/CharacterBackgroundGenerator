@@@ P3-01
title: SettingInvite entity and migration
type: task
area: database
phase: 3
priority: P0
size: S
depends: P2-01
@@@
## Summary
Invite codes let a GM share a setting with players.

## Tasks
- [ ] `SettingInvite { Id, CampaignSettingId, Code, CreatedByUserId, ExpiresAt?, MaxUses?, UseCount, RevokedAt?, CreatedAt }`.
- [ ] Unique index on `Code`; index on `CampaignSettingId`.
- [ ] Invites always grant `Player`; no role column is needed.
- [ ] Cascade delete with the setting; `CreatedByUserId` FK `Restrict`.
- [ ] Migration `AddSettingInvites`.

## Implementation details
- Code: 10 characters from Crockford base32 (no `I L O U`) generated with `RandomNumberGenerator.GetInt32`; retry on unique-index collision.
- Codes are stored in plain text so a GM can view and re-share them; they are unguessable and revocable.

## Acceptance criteria
- Migration applies; code uniqueness enforced.

@@@ P3-02
title: POST /api/settings/{sid}/invites
type: feature
area: sharing
phase: 3
priority: P0
size: S
depends: P3-01, P2-02
@@@
## Summary
GM creates an invite code.

## Tasks
- [ ] GM-only (`RequireGameMasterAsync`).
- [ ] Request `CreateInviteRequest(ExpiresInDays? 1-90 default 7, MaxUses? 1-100)`.
- [ ] Return `InviteDto { id, code, expiresAt, maxUses, useCount, createdAt }` and a shareable `joinUrl` built from `App:FrontendBaseUrl` (`/join/{code}`).
- [ ] Cap active (unrevoked, unexpired) invites per setting at 20.

## Acceptance criteria
- Player gets 403; GM receives a code and URL.

@@@ P3-03
title: List and revoke invites
type: feature
area: sharing
phase: 3
priority: P1
size: S
depends: P3-02
@@@
## Summary
GM management of existing invites.

## Tasks
- [ ] `GET /api/settings/{sid}/invites` returns invites with computed `status` (`active|expired|revoked|exhausted`).
- [ ] `DELETE /api/settings/{sid}/invites/{id}` sets `RevokedAt` (soft revoke) and returns 204.
- [ ] Revoking an already revoked invite is idempotent.

## Acceptance criteria
- Revoked code can no longer be accepted (verified in P3-08).

@@@ P3-04
title: GET /api/invites/{code} (preview)
type: feature
area: sharing
phase: 3
priority: P0
size: S
depends: P3-02
@@@
## Summary
Let a signed-in user see what they are joining before accepting.

## Tasks
- [ ] Authenticated (not anonymous); returns `{ settingName, gmDisplayName, alreadyMember }`.
- [ ] Unknown, expired, revoked, or exhausted codes all return the **same 404** so validity cannot be probed.
- [ ] Rate limit with the `auth` policy family (10/min) to slow code guessing.

## Acceptance criteria
- Valid code returns details; every invalid state returns identical 404.

@@@ P3-05
title: POST /api/invites/{code}/accept (idempotent, race-safe)
type: feature
area: sharing
phase: 3
priority: P0
size: M
depends: P3-04
@@@
## Summary
Join a setting as a Player.

## Tasks
- [ ] If the user is already a member, return 200 with the setting summary and **do not** consume a use.
- [ ] Otherwise, in one transaction: atomically increment `UseCount` and insert a `Player` membership.
- [ ] Return 200 `{ settingId, myRole: "Player" }`.
- [ ] Invalid states return the same 404 as preview.

## Implementation details
- Consume atomically: `ExecuteUpdateAsync(i => i.UseCount + 1)` with `WHERE UseCount < MaxUses OR MaxUses IS NULL`, not revoked, not expired; zero rows affected means invalid.
- Insert membership first; on unique-violation treat as already-member and roll back the increment.

## Acceptance criteria
- Two parallel accepts on a 1-use code result in exactly one membership.

@@@ P3-06
title: Members list and owner-only role change
type: feature
area: sharing
phase: 3
priority: P1
size: S
depends: P2-02
@@@
## Summary
See who is in a setting and let the owner promote or demote.

## Tasks
- [ ] `GET /api/settings/{sid}/members` (any member) returns `{ userId, displayName, role, isOwner, joinedAt }`; emails are **not** exposed.
- [ ] `PATCH /api/settings/{sid}/members/{userId}` body `{ role }`: **owner only**.
- [ ] The owner cannot be demoted; a role change to the same role is a no-op 200.

## Implementation details
- Non-owner GMs can manage invites and remove players but cannot change roles (keeps "no co-owners" simple).

## Acceptance criteria
- Owner promotes a player to GameMaster; non-owner gets 403.

@@@ P3-07
title: Remove a member or leave a setting
type: feature
area: sharing
phase: 3
priority: P1
size: S
depends: P3-06
@@@
## Summary
`DELETE /api/settings/{sid}/members/{userId}` covers both "GM removes player" and "member leaves".

## Tasks
- [ ] A member may remove themself (leave) unless they are the owner (owner must delete the setting instead; 409).
- [ ] A GM may remove Players; only the owner may remove another GameMaster.
- [ ] The owner can never be removed.
- [ ] Return 204. Removing is immediate; characters are **not** deleted (their read-only behavior is enforced in P6-10).

## Acceptance criteria
- Removed user immediately gets 404 on the setting; their characters still exist.

@@@ P3-08
title: Sharing authorization and invite edge-case tests
type: test
area: testing
phase: 3
priority: P0
size: M
depends: P3-03, P3-05, P3-07
@@@
## Summary
Invites are a security boundary; test them thoroughly.

## Tasks
- [ ] Expired, revoked, exhausted, and unknown codes all produce identical 404.
- [ ] Concurrency: parallel accepts of a 1-use code create one membership.
- [ ] Idempotent accept does not consume a use.
- [ ] Owner cannot be removed/demoted; owner cannot leave.
- [ ] Player cannot create invites or manage members; non-member receives 404.
- [ ] Members list never contains emails.

## Acceptance criteria
- All cases pass in CI.
