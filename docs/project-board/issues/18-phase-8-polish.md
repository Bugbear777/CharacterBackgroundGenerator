@@@ P8-01
title: GET /api/dashboard aggregate
type: feature
area: api
phase: 8
priority: P1
size: M
depends: P2-04, P6-04
@@@
## Summary
One request for the dashboard page.

## Tasks
- [ ] Return `{ counts: { settingsAsGm, settingsAsPlayer, charactersDraft, charactersComplete }, recentSettings (5), recentCharacters (5), recentActivity (10) }`.
- [ ] `recentActivity` is derived from `UpdatedAt` across the caller's settings, visible entries, and characters (no activity-log table).
- [ ] Activity items: `{ kind, text, at }` with texts such as "Edited Osepia" or "Updated Theron Vale".
- [ ] Respect visibility rules (no hidden entries for players).

## Implementation details
- Use three small `AsNoTracking` queries; union in memory; avoid N+1.

## Acceptance criteria
- Response matches what the dashboard renders today.

@@@ P8-02
title: Development seed data
type: task
area: devex
phase: 8
priority: P2
size: S
depends: P5-03, P6-03
@@@
## Summary
A fresh clone should look like the wireframes.

## Tasks
- [ ] Dev-only seeder behind `--seed` or `Seed:Enabled` config.
- [ ] Users: a GM and a Player (documented dev passwords, never in Production).
- [ ] Setting "Osepia" with entries (Sasymon, Ymenite Region, Northern Marches, Nigallu, Merchant Guild, Cult of Beléna), at least one GM-only entry, and relationships.
- [ ] Player membership and a draft character (Theron Vale).
- [ ] Idempotent (safe to run twice).

## Acceptance criteria
- After seeding, both users can log in and see role-appropriate data.

@@@ P8-03
title: OpenAPI polish and API explorer in Development
type: task
area: docs
phase: 8
priority: P2
size: S
depends: P7-05
@@@
## Summary
Make the API self-documenting.

## Tasks
- [ ] `ProducesResponseType` on all actions (200/201/204/400/401/403/404/409).
- [ ] XML doc comments surfaced as operation descriptions.
- [ ] Add an explorer UI in Development only (for example Scalar) against the built-in OpenAPI document.
- [ ] Document the cookie auth flow and the `X-Requested-With` requirement in the OpenAPI description.

## Acceptance criteria
- Every endpoint appears with request/response schemas.

@@@ P8-04
title: Query performance and index review
type: task
area: database
phase: 8
priority: P2
size: S
depends: P8-01
@@@
## Summary
Verify list endpoints scale before more data exists.

## Tasks
- [ ] Log generated SQL for list/dashboard endpoints in Development.
- [ ] Ensure `AsNoTracking` and projection everywhere; no N+1 or cartesian explosion.
- [ ] Run `EXPLAIN ANALYZE` on entry search and dashboard with seeded volume (thousands of entries).
- [ ] Add missing indexes via migration; consider `pg_trgm` for `ILIKE` search if slow.

## Acceptance criteria
- Findings recorded; no list endpoint runs more than a handful of queries.

@@@ P8-05
title: Health checks and structured logging
type: task
area: api
phase: 8
priority: P2
size: S
depends: P0-08
@@@
## Summary
Operational visibility.

## Tasks
- [ ] Extend `/api/health` with a DB check (`AddDbContextCheck`), keeping the current JSON shape and adding `database: "up|down"`.
- [ ] Request logging with correlation id (`traceId`) that matches ProblemDetails.
- [ ] Never log passwords, cookies, invite codes, or full emails.

## Acceptance criteria
- Stopping Postgres makes health report database down (HTTP 503).

@@@ P8-06
title: Final README and API documentation pass
type: docs
area: docs
phase: 8
priority: P2
size: S
depends: P8-03
@@@
## Summary
Documentation matches the finished API.

## Tasks
- [ ] README: DB setup, migrations, seed data, auth (cookie-only) and CSRF header, sharing model, permission matrix.
- [ ] `docs/api/` endpoint reference generated or copied from OpenAPI.
- [ ] Update the repository tree (Services/Dtos/Tests).
- [ ] Link the project board.

## Acceptance criteria
- A new teammate can run, seed, and log in using only the docs.

@@@ P8-07
title: Security review pass
type: task
area: security
phase: 8
priority: P1
size: S
depends: P8-04
@@@
## Summary
Checklist review before frontend goes live on real data.

## Tasks
- [ ] Cookie flags in Production; HSTS enabled; `AllowedHosts` restricted.
- [ ] CORS allowlist and CSRF checks re-verified.
- [ ] Every controller has an authorization test (grep for controllers with no matrix test).
- [ ] Rate limits on invite preview/accept and auth endpoints.
- [ ] Dependency audit (`dotnet list package --vulnerable`, `npm audit`).
- [ ] No secrets in repo; verify with a secret scan.

## Acceptance criteria
- Findings resolved or filed as issues.
