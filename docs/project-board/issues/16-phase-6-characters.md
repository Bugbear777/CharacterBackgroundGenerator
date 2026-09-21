@@@ P6-01
title: Character and CharacterChoice entities with migration
type: task
area: database
phase: 6
priority: P0
size: M
depends: P4-01
@@@
## Summary
The models that back the characters list and the builder.

## Tasks
- [ ] `CharacterStatus { Draft, Complete }` stored as string.
- [ ] `Character { Id, CampaignSettingId, OwnerUserId, Name (max 100, default "Unnamed Character"), Status, CurrentStep (int), Backstory (text, max 10000, nullable), CreatedAt, UpdatedAt }`.
- [ ] `CharacterChoice { Id, CharacterId, StepKey (max 40), Ordinal (int), EntryId (nullable), FreeText (nullable, max 2000) }`.
- [ ] Unique `(CharacterId, StepKey, Ordinal)`; index on `EntryId`.
- [ ] FKs: setting to character **cascade** (deleting a setting deletes its characters); owner user `Restrict`; choice to character cascade; choice to entry **SetNull**.
- [ ] Migration `AddCharacters`.

## Implementation details
- **Backstory is free text only.** No generation or AI features.
- Choices are rows, not columns, so adding builder steps never needs a migration.
- A choice has either `EntryId` or `FreeText` (check constraint: not both null, not both set).

## Acceptance criteria
- Migration applies; check constraint and unique index enforced.

@@@ P6-02
title: ICharacterAccess (owner, read-only and GM rules)
type: task
area: auth
phase: 6
priority: P0
size: S
depends: P6-01, P2-02
@@@
## Summary
Centralize character permissions, including the "removed player keeps a read-only character" rule.

## Tasks
- [ ] Owner **and** current setting member: read + write.
- [ ] Owner **no longer a member**: read + delete only (`isReadOnly = true`).
- [ ] GM of the character's setting: read only.
- [ ] Everyone else (including anonymous-to-setting members): 404.
- [ ] Methods: `RequireReadAsync`, `RequireWriteAsync` (403 when read-only), `RequireOwnerAsync`.

## Acceptance criteria
- Permission table verified by tests in P6-12.

@@@ P6-03
title: POST /api/characters
type: feature
area: characters
phase: 6
priority: P0
size: S
depends: P6-02
@@@
## Summary
Start a new draft character in a setting.

## Tasks
- [ ] Request `(SettingId, Name?)`; caller must be a **member** of the setting (else 404).
- [ ] Create with `Status = Draft`, `CurrentStep = 1`, `OwnerUserId = current user`.
- [ ] GMs may create characters too (NPCs or their own PC).
- [ ] Return 201 with `CharacterDto`.

## Acceptance criteria
- Non-member cannot create; draft returned with defaults.

@@@ P6-04
title: GET /api/characters (own characters list)
type: feature
area: characters
phase: 6
priority: P0
size: M
depends: P6-02
@@@
## Summary
Feeds the Characters page and dashboard.

## Tasks
- [ ] Only characters owned by the caller.
- [ ] Query: `status`, `settingId`, `search`, `page`, `pageSize`; sort by `updatedAt` desc.
- [ ] `CharacterListItemDto { id, name, status, settingId, settingName, homelandName?, currentStep, isReadOnly, updatedAt }`.
- [ ] `isReadOnly` is true when the caller is no longer a member of the setting.
- [ ] `homelandName` from the `homeland` choice if present.

## Acceptance criteria
- Filters and paging work; read-only flag correct after removal.

@@@ P6-05
title: GET /api/characters/{id}
type: feature
area: characters
phase: 6
priority: P1
size: S
depends: P6-02
@@@
## Summary
Full character with resolved choices for the builder and summary.

## Tasks
- [ ] `CharacterDetailDto` includes `choices[]` with `{ stepKey, ordinal, entryId, entryName, entryType, freeText }`.
- [ ] Readable by owner (even if read-only) and by the setting's GMs.
- [ ] A choice whose entry became GM-only afterward **keeps showing its name** to the owner (decision: do not retroactively hide or break a character); a deleted entry appears as `entryName: null`.

## Acceptance criteria
- Owner and GM can read; others receive 404.

@@@ P6-06
title: PUT /api/characters/{id} (name and backstory)
type: feature
area: characters
phase: 6
priority: P1
size: S
depends: P6-02
@@@
## Summary
Edit character name and free-text backstory.

## Tasks
- [ ] Requires write access (owner and still a member); read-only owner gets 403.
- [ ] `Name` 1-100; `Backstory` optional, max 10000, plain text (no HTML rendering server-side).
- [ ] Bump `UpdatedAt`.

## Acceptance criteria
- Update persists; read-only owner blocked.

@@@ P6-07
title: DELETE /api/characters/{id}
type: feature
area: characters
phase: 6
priority: P2
size: XS
depends: P6-02
@@@
## Summary
Owner deletes their character.

## Tasks
- [ ] Owner only, allowed even when the character is read-only.
- [ ] Cascade removes choices; return 204.

## Acceptance criteria
- GM cannot delete another player's character (403).

@@@ P6-08
title: GET /api/settings/{sid}/characters (GM view)
type: feature
area: characters
phase: 6
priority: P1
size: S
depends: P6-02
@@@
## Summary
GM sees the characters players built for their setting.

## Tasks
- [ ] GM-only for that setting; players get 403, non-members 404.
- [ ] Query `status`, `search`, paging; DTO includes owner display name.
- [ ] Read-only: GM has no write endpoints for other people's characters.

## Acceptance criteria
- GM sees all characters in their setting including those of removed players.

@@@ P6-09
title: Guard entry deletion against character references
type: task
area: api
phase: 6
priority: P1
size: S
depends: P6-01, P4-06
@@@
## Summary
Extends P4-06 now that characters reference entries.

## Tasks
- [ ] `DELETE .../entries/{id}` returns 409 with `{ relationshipCount, characterCount }` when referenced, unless `?force=true`.
- [ ] `force=true`: delete relationships and let `CharacterChoice.EntryId` become null (FK SetNull).
- [ ] Add tests for both paths.

## Acceptance criteria
- Forced delete leaves characters intact with a null choice.

@@@ P6-10
title: Enforce read-only characters after removal from a setting
type: task
area: characters
phase: 6
priority: P1
size: S
depends: P3-07, P6-06
@@@
## Summary
A removed player keeps their characters but can no longer edit them (rule: read-only).

## Tasks
- [ ] Verify removal (P3-07) leaves characters untouched.
- [ ] All character write endpoints (update, choices, complete, reopen) return 403 with a clear problem detail when `isReadOnly`.
- [ ] Re-joining via a new invite restores write access automatically.
- [ ] Add regression tests.

## Acceptance criteria
- Removed player can GET and DELETE, but every other write returns 403.

@@@ P6-11
title: DELETE /api/users/me (blocked while owning a shared setting)
type: feature
area: auth
phase: 6
priority: P1
size: M
depends: P1-11, P2-08, P3-07, P6-07
@@@
## Summary
Account deletion with the rule: **blocked while the user owns a setting that has other members.**

## Tasks
- [ ] Require password re-entry in the request body.
- [ ] If the user owns any setting with at least one other member, return **409** listing those settings and instructing to delete or hand off first.
- [ ] Otherwise, in one transaction: delete owned settings (sole member), the user's memberships in others' settings, their characters, their invites, then the user.
- [ ] Sign the user out; respond 204.
- [ ] Ownership transfer is out of scope (documented limitation).

## Acceptance criteria
- Blocked case returns 409 and deletes nothing; allowed case leaves no orphan rows.

@@@ P6-12
title: Character authorization and lifecycle tests
type: test
area: testing
phase: 6
priority: P0
size: M
depends: P6-03, P6-04, P6-05, P6-06, P6-08, P6-10
@@@
## Summary
Prove the ownership matrix.

## Tasks
- [ ] Matrix: owner-member, owner-removed, GM, other player, non-member, anonymous.
- [ ] Setting delete cascades characters.
- [ ] Entry force-delete nulls choices (P6-09).
- [ ] Re-joining restores write access.

## Acceptance criteria
- Tests pass in CI.
