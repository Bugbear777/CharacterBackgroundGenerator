@@@ P4-01
title: Add IsGmOnly, citext names and indexes to SettingEntry
type: task
area: database
phase: 4
priority: P0
size: S
depends: P0-08
@@@
## Summary
Secret lore support and case-insensitive uniqueness.

## Tasks
- [ ] `bool IsGmOnly` (default false, not null).
- [ ] Enable the Postgres `citext` extension (`HasPostgresExtension("citext")`) and map `SettingEntry.Name` with `HasColumnType("citext")`.
- [ ] Unique index on `(CampaignSettingId, EntryType, Name)`.
- [ ] Index on `(CampaignSettingId, EntryType)` and `(CampaignSettingId, IsGmOnly)`.
- [ ] Migration `AddEntryVisibilityAndIndexes`.

## Implementation details
- Add a reusable query extension `VisibleTo(SettingRole role)` that appends `Where(!IsGmOnly)` for players; every read path must use it.

## Acceptance criteria
- Two entries differing only by case in the same setting/type are rejected by the DB.

@@@ P4-02
title: GET /api/settings/{sid}/entries (type, search, paging, visibility)
type: feature
area: api
phase: 4
priority: P0
size: M
depends: P4-01, P2-02
@@@
## Summary
Feeds the setting detail tabs and search, and the builder's option lists.

## Tasks
- [ ] Query: `type` (enum name), `search`, `page`, `pageSize`, `gmOnly` (GM only filter).
- [ ] Any member may call; players get `!IsGmOnly` only.
- [ ] `EntryListItemDto { id, name, entryType, description, isGmOnly (GM only), relationshipCount, updatedAt }`.
- [ ] `relationshipCount` counts relationships in both directions whose **other** endpoint is visible to the caller.
- [ ] Search with `ILike` over name and description (escape wildcards).

## Acceptance criteria
- A player never sees a GM-only entry or its relationship contribution to any count.

@@@ P4-03
title: POST /api/settings/{sid}/entries
type: feature
area: api
phase: 4
priority: P0
size: S
depends: P4-01
@@@
## Summary
GM adds lore.

## Tasks
- [ ] GM-only. Request `CreateEntryRequest(Name 1-120, EntryType, Description max 4000, IsGmOnly)`.
- [ ] Validate `EntryType` is a defined enum value.
- [ ] Duplicate `(setting, type, name)` returns 409.
- [ ] Return 201 with `EntryDto`.

## Acceptance criteria
- Player gets 403; GM creates; duplicates return 409.

@@@ P4-04
title: GET /api/settings/{sid}/entries/{id} (detail with relationships)
type: feature
area: api
phase: 4
priority: P1
size: S
depends: P4-02
@@@
## Summary
Detail view for the edit dialog and relationship panel.

## Tasks
- [ ] Return the entry plus incoming and outgoing relationships (other endpoint id, name, type, relationship type, description).
- [ ] Player requesting a GM-only entry gets **404** (not 403).
- [ ] Relationships whose other endpoint is GM-only are omitted for players.

## Acceptance criteria
- Player never learns a hidden entry exists via detail or via another entry's relationships.

@@@ P4-05
title: PUT /api/settings/{sid}/entries/{id}
type: feature
area: api
phase: 4
priority: P1
size: S
depends: P4-03
@@@
## Summary
GM edits an entry, including toggling secrecy.

## Tasks
- [ ] GM-only; same validation as create; uniqueness check excludes self.
- [ ] `EntryType` may change; `IsGmOnly` may toggle.
- [ ] Changing an entry to GM-only does **not** alter existing character choices (decision recorded in P6-05).

## Acceptance criteria
- Updates persist and bump `UpdatedAt`.

@@@ P4-06
title: DELETE /api/settings/{sid}/entries/{id} (409 unless force)
type: feature
area: api
phase: 4
priority: P1
size: S
depends: P4-05
@@@
## Summary
Deleting lore can orphan relationships and (later) character choices. Make it deliberate.

## Tasks
- [ ] GM-only.
- [ ] If relationships reference the entry, return **409** with `{ relationshipCount }` unless `?force=true`.
- [ ] With `force=true`: delete the entry's relationships then the entry, in one transaction.
- [ ] Character-choice guard is added in P6-09; leave a clearly marked extension point.
- [ ] Return 204.

## Acceptance criteria
- Delete without force on a linked entry returns 409 and changes nothing.

@@@ P4-07
title: Entries authorization and visibility tests
type: test
area: testing
phase: 4
priority: P0
size: M
depends: P4-02, P4-04, P4-05, P4-06
@@@
## Summary
Secret lore must never leak.

## Tasks
- [ ] Player list/search/detail/count never include GM-only entries.
- [ ] Player detail of a hidden entry returns 404.
- [ ] Relationship counts exclude links to hidden entries for players.
- [ ] Setting detail `entryCountsByType` (P2-05) excludes hidden entries for players.
- [ ] Non-member 404, anonymous 401, player write 403.
- [ ] Delete 409 vs force behavior; uniqueness case-insensitivity.

## Acceptance criteria
- Tests pass in CI.
