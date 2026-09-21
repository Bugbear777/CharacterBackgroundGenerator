@@@ P2-01
title: SettingMembership entity, SettingRole enum and migration
type: task
area: database
phase: 2
priority: P0
size: S
depends: P0-08
@@@
## Summary
Access to a setting is defined by membership. Two roles only: `GameMaster` and `Player`.

## Tasks
- [ ] `SettingRole { GameMaster, Player }` stored as string.
- [ ] `SettingMembership { Id, CampaignSettingId, UserId, Role, JoinedAt }` + timestamps.
- [ ] Unique index on `(CampaignSettingId, UserId)`; FK to setting cascades on delete; FK to user `Restrict`.
- [ ] Add `Memberships` navigation on `CampaignSetting` and `ApplicationUser`.
- [ ] Migration `AddSettingMemberships`.

## Implementation details
- `CampaignSetting.OwnerUserId` remains the immutable owner. The owner **also** has a GameMaster membership row so "settings I belong to" is a single query.
- Invariant: the owner's membership can never be removed or demoted (enforced in P3-06/P3-07).

## Acceptance criteria
- Migration applies; duplicate (setting, user) insert violates the unique index.

@@@ P2-02
title: ISettingAccess authorization helper
type: task
area: auth
phase: 2
priority: P0
size: S
depends: P2-01, P1-09
@@@
## Summary
One place decides who can do what on a setting.

## Tasks
- [ ] `ISettingAccess.GetRoleAsync(settingId)` returns the current user's role or null.
- [ ] `RequireMemberAsync`, `RequireGameMasterAsync`, `RequireOwnerAsync` returning the setting or throwing.
- [ ] Non-member (or missing setting) throws `NotFoundException` (404). Member without permission throws `ForbiddenException` (403).
- [ ] `IQueryable<CampaignSetting> VisibleToCurrentUser()` for list queries.

## Implementation details
- Uses `ICurrentUser` and one indexed query on memberships.
- Every controller in later phases must call this before touching setting data (checked in tests).

## Acceptance criteria
- Unit/integration tests for each role x method combination.

@@@ P2-03
title: POST /api/settings (create setting with GM membership)
type: feature
area: api
phase: 2
priority: P0
size: S
depends: P2-02
@@@
## Summary
Create a campaign setting. The creator becomes owner and GameMaster.

## Tasks
- [ ] Request `CreateSettingRequest(Name 1-100, Description max 2000)`.
- [ ] In one transaction create the setting (`OwnerUserId = current user`) and a `GameMaster` membership.
- [ ] Return **201** with `SettingDto` and a `Location` header.
- [ ] Reject duplicate names per owner (409), case-insensitive.

## Acceptance criteria
- Setting and membership exist after one call; failure rolls back both.

@@@ P2-04
title: GET /api/settings (list with role filter, search, paging)
type: feature
area: api
phase: 2
priority: P0
size: M
depends: P2-02
@@@
## Summary
Feeds the Settings page and dashboard cards for both GM-owned and joined settings.

## Tasks
- [ ] Query params: `search`, `role` (`gm|player`), `page`, `pageSize`.
- [ ] Return `SettingListItemDto { id, name, description, entryCount, myRole, isOwner, ownerDisplayName, updatedAt }`.
- [ ] Sort by `updatedAt` descending.
- [ ] `entryCount` for players must exclude GM-only entries (implemented once P4-01 lands; write the query so the filter is one line).

## Implementation details
- Project with `Select` and `AsNoTracking`; compute `entryCount` via a correlated `Count()` in the projection to avoid loading entries.
- Search uses `EF.Functions.ILike` with escaped `%`/`_`.

## Acceptance criteria
- Only settings the user belongs to appear; role filter and paging work.

@@@ P2-05
title: GET /api/settings/{id} (detail with per-type entry counts)
type: feature
area: api
phase: 2
priority: P1
size: S
depends: P2-02
@@@
## Summary
Detail header and Overview tab data.

## Tasks
- [ ] Return `SettingDetailDto` including `myRole`, `isOwner`, `ownerDisplayName`, `memberCount`, and `entryCountsByType` (dictionary keyed by `SettingEntryType`).
- [ ] Players see counts that exclude GM-only entries (finalized with P4-01).
- [ ] Non-member returns 404.

## Acceptance criteria
- Counts match seeded entries; player and GM see role-appropriate numbers.

@@@ P2-06
title: PUT /api/settings/{id}
type: feature
area: api
phase: 2
priority: P1
size: XS
depends: P2-02
@@@
## Summary
Edit setting name and description.

## Tasks
- [ ] GM-only via `RequireGameMasterAsync`; players get 403.
- [ ] Same validation as create, including duplicate-name check excluding self.
- [ ] Return 200 with updated `SettingDetailDto`.

## Acceptance criteria
- GM updates; player receives 403; non-member receives 404.

@@@ P2-07
title: Deleting a setting with entries and relationships may violate Restrict FKs
type: bug
area: database
phase: 2
priority: P0
size: S
labels: needs-repro
depends: P2-03
@@@
## Summary
`SettingEntryRelationship` FKs to `SettingEntry` use `DeleteBehavior.Restrict`, while `CampaignSetting` cascades to both entries and relationships. On PostgreSQL `RESTRICT` is checked immediately (unlike `NO ACTION`, which is checked at end of statement), so cascading a setting delete may fail with an FK violation depending on delete order.

## Steps to reproduce (write as a failing test first)
1. Create a setting with two entries and a relationship between them.
2. `DELETE /api/settings/{id}` (or `db.Remove(setting); SaveChanges`).
3. Observe `23001`/`23503` FK violation.

## Tasks
- [ ] Add the failing integration test in `api.Tests`.
- [ ] Fix: change the two relationship-to-entry FKs to `DeleteBehavior.NoAction` (or `ClientCascade`), or delete relationships explicitly before entries inside a transaction.
- [ ] Add a migration for the FK change if the model changes.
- [ ] Confirm deleting a single entry with relationships still returns the intended 409 (P4-06).

## Acceptance criteria
- Deleting a fully populated setting succeeds and leaves no orphan rows.

@@@ P2-08
title: DELETE /api/settings/{id} (owner only)
type: feature
area: api
phase: 2
priority: P1
size: S
depends: P2-07
@@@
## Summary
Only the **owner** may delete a setting.

## Tasks
- [ ] `RequireOwnerAsync`; non-owner GM/player gets 403, non-member 404.
- [ ] Delete setting and cascade to entries, relationships, memberships, invites (characters handled in P6-01 config: cascade delete characters of that setting).
- [ ] Respond 204.
- [ ] Optional confirmation guard: require `?confirm=<exact setting name>` to reduce accidental deletes.

## Acceptance criteria
- Owner deletes; all child rows are gone; non-owner blocked.

@@@ P2-09
title: Settings authorization matrix tests
type: test
area: testing
phase: 2
priority: P0
size: M
depends: P2-04, P2-05, P2-06, P2-08
@@@
## Summary
Lock in the permission matrix for every settings endpoint.

## Tasks
- [ ] Matrix test: anonymous (401), non-member (404), player, GM (non-owner), owner across create/list/detail/update/delete.
- [ ] List returns only member settings; role filter correct.
- [ ] Cascade delete integration test from P2-07 kept as a regression test.

## Acceptance criteria
- All matrix cells asserted; tests pass in CI.
