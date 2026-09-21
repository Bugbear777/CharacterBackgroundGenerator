@@@ P5-01
title: Relationship DB constraints and indexes
type: task
area: database
phase: 5
priority: P0
size: S
depends: P4-01
@@@
## Summary
Protect relationship integrity in the database, not only in code.

## Tasks
- [ ] Check constraint `SourceEntryId <> TargetEntryId`.
- [ ] Unique index on `(SourceEntryId, TargetEntryId, RelationshipType)`.
- [ ] Indexes on `SourceEntryId`, `TargetEntryId`, `CampaignSettingId`.
- [ ] Column lengths: `RelationshipType` max 60, `Description` max 1000.
- [ ] Migration `AddRelationshipConstraints`.

## Implementation details
- The FK behavior fix from P2-07 must already be in place; keep both migrations independent.
- Same-setting consistency (source/target belong to `CampaignSettingId`) is enforced in the service layer (P5-03) because a cross-table check constraint is not possible.

## Acceptance criteria
- Self-link and duplicate inserts fail at the DB level.

@@@ P5-02
title: GET /api/settings/{sid}/relationships
type: feature
area: api
phase: 5
priority: P1
size: S
depends: P5-01, P2-02
@@@
## Summary
List relationships, optionally scoped to one entry.

## Tasks
- [ ] Query: `entryId` (either direction), `type`, `page`, `pageSize`.
- [ ] Any member; players never see relationships where either endpoint is GM-only.
- [ ] DTO includes both endpoints' ids, names, and entry types plus relationship type/description.

## Acceptance criteria
- Filtering by `entryId` returns incoming and outgoing links; hidden endpoints excluded for players.

@@@ P5-03
title: POST /api/settings/{sid}/relationships
type: feature
area: api
phase: 5
priority: P1
size: S
depends: P5-01
@@@
## Summary
GM links two entries.

## Tasks
- [ ] GM-only. Request `(SourceEntryId, TargetEntryId, RelationshipType 1-60, Description?)`.
- [ ] Verify both entries exist **and belong to the same setting** as the URL; otherwise 400/404.
- [ ] Reject self-links (400) and duplicates (409).
- [ ] Set `CampaignSettingId` from the route, never from the body.

## Acceptance criteria
- Cross-setting linking attempts fail; valid link returns 201.

@@@ P5-04
title: PUT and DELETE /api/settings/{sid}/relationships/{id}
type: feature
area: api
phase: 5
priority: P2
size: S
depends: P5-03
@@@
## Summary
Edit or remove a relationship.

## Tasks
- [ ] PUT changes `RelationshipType` and `Description` only (endpoints are immutable; delete and recreate to re-link).
- [ ] DELETE returns 204.
- [ ] GM-only; relationship must belong to the setting in the route.

## Acceptance criteria
- Attempting to change source/target is rejected.

@@@ P5-05
title: Define the relationship-type vocabulary for builder narrowing
type: spike
area: builder
phase: 5
priority: P1
size: S
labels: needs-decision
depends:
@@@
## Summary
The builder narrows options (for example, cultures shown for a chosen homeland) using relationships. That only works if relationship types are consistent, but `RelationshipType` is a free string today.

## Questions to answer
1. Free text, a fixed catalog, or "suggested list plus free text"?
2. Which types drive narrowing (example: `native_to`, `located_in`, `practiced_in`, `member_of`)?
3. Are relationships treated as symmetric or directional when narrowing?

## Deliverable
- ADR in `docs/decisions/` and, if a catalog is chosen, a `RelationshipTypes` constants class plus validation/normalization rule (trim, lowercase, snake_case).
- Recommended default: **suggested list plus free text**, with narrowing considering a relationship in **either direction**.

## Acceptance criteria
- Decision recorded; P7-02 can implement narrowing against it.

@@@ P5-06
title: Relationship validation and visibility tests
type: test
area: testing
phase: 5
priority: P1
size: S
depends: P5-02, P5-03, P5-04
@@@
## Summary
Prove the integrity rules.

## Tasks
- [ ] Cross-setting link rejected; self-link rejected; duplicate 409.
- [ ] Hidden-endpoint relationships invisible to players in list and entry detail.
- [ ] Player write 403; non-member 404.
- [ ] Deleting an entry with `force` removes its relationships.

## Acceptance criteria
- Tests pass in CI.
