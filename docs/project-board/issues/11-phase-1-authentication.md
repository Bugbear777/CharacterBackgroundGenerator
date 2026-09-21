@@@ P1-01
title: Identity core with cookie-only authentication, password policy and lockout
type: task
area: auth
phase: 1
priority: P0
size: M
depends: P0-08
@@@
## Summary
Wire ASP.NET Core Identity with a **cookie** scheme only. No bearer or refresh tokens exist anywhere in the API.

## Tasks
- [ ] `AddIdentityCore<ApplicationUser>().AddEntityFrameworkStores<LoreboundDbContext>().AddSignInManager().AddDefaultTokenProviders()`.
- [ ] `AddAuthentication(IdentityConstants.ApplicationScheme).AddIdentityCookies()`.
- [ ] Configure the application cookie: name `lorebound.auth`, `HttpOnly = true`, `SecurePolicy = Always`, `SameSite = Lax`, 14-day sliding expiry.
- [ ] Override `OnRedirectToLogin` to return **401** and `OnRedirectToAccessDenied` to return **403** (problem JSON, no redirects).
- [ ] Password policy: min length 10, no forced symbol rules, unique email; lockout 5 attempts / 15 minutes for new users.
- [ ] `RequireConfirmedEmail` driven by config key `Auth:RequireConfirmedEmail` (false in Development, true in Production).
- [ ] Add `UseAuthentication()` and `UseAuthorization()` after CORS in the pipeline.

## Implementation details
- **Do not call `MapIdentityApi`/`AddIdentityApiEndpoints`**: its login endpoint can return bearer tokens in the JSON body, which violates the no-tokens-in-JS rule.
- Chrome accepts `Secure` cookies on `http://localhost`; the `https` launch profile is still preferred.
- Verify the cookie has no `Expires` in the body/headers other than Set-Cookie.

## Acceptance criteria
- App starts with Identity registered; unauthenticated protected call returns 401 JSON.
- No route in the API returns a token in a response body.

@@@ P1-02
title: POST /api/auth/register
type: feature
area: auth
phase: 1
priority: P0
size: S
depends: P1-01
@@@
## Summary
Create an account with email, password, and display name.

## Tasks
- [ ] `AuthController` with `[Route("api/auth")]`, `[AllowAnonymous]`.
- [ ] Request `RegisterRequest(Email, Password, DisplayName)` with validation (email format, DisplayName 1-60 chars, password policy).
- [ ] Use `UserManager.CreateAsync`; surface Identity errors as `ValidationProblem` (400).
- [ ] If confirmation is required, generate a confirmation token and send via `IEmailSender` (P1-05); otherwise respond immediately.
- [ ] Respond **201** with `{ id, email, displayName, emailConfirmed }`. Do **not** sign the user in and do not return any token.

## Implementation details
- Normalize email casing via Identity's normalizer; duplicate email returns 400 with a generic "could not register" message when confirmation is required (reduces enumeration).

## Acceptance criteria
- Valid registration creates the user; duplicates and weak passwords return 400.
- Response body contains no token/secret fields.

@@@ P1-03
title: POST /api/auth/login (cookie session)
type: feature
area: auth
phase: 1
priority: P0
size: S
depends: P1-01
@@@
## Summary
Sign in and set the httpOnly auth cookie. The body contains only the user summary.

## Tasks
- [ ] Request `LoginRequest(Email, Password, RememberMe)`.
- [ ] Find user by email; call `SignInManager.PasswordSignInAsync(user, password, isPersistent: RememberMe, lockoutOnFailure: true)`.
- [ ] Success: **200** `{ id, email, displayName }` with `Set-Cookie`.
- [ ] Failure: **401** with one generic message for wrong password, unknown email, and unconfirmed email; lockout: **423/429-style** problem JSON with retry hint.
- [ ] Constant-ish time behavior: still hash-verify against a dummy when the user is not found.

## Implementation details
- `RememberMe = false` yields a session cookie; `true` uses the 14-day persistent cookie.
- Never log passwords or full emails at Information level.

## Acceptance criteria
- Response has `Set-Cookie` with `HttpOnly; Secure; SameSite=Lax` and no token in the body.
- Five bad attempts lock the account.

@@@ P1-04
title: POST /api/auth/logout
type: feature
area: auth
phase: 1
priority: P1
size: XS
depends: P1-03
@@@
## Summary
End the session by clearing the cookie.

## Tasks
- [ ] `[Authorize] POST /api/auth/logout` calling `SignInManager.SignOutAsync()`.
- [ ] Respond **204**.

## Implementation details
- Cookie deletion must use the same path/domain settings as issuance.

## Acceptance criteria
- After logout, `GET /api/users/me` returns 401.

@@@ P1-05
title: Email sender abstraction with development console sender
type: task
area: auth
phase: 1
priority: P1
size: S
depends: P1-01
@@@
## Summary
Confirmation and reset flows need to send email. Real provider choice is deferred; development logs the links.

## Tasks
- [ ] Implement `IEmailSender<ApplicationUser>` (`SendConfirmationLinkAsync`, `SendPasswordResetLinkAsync`, `SendPasswordResetCodeAsync`).
- [ ] `ConsoleEmailSender` (Development): logs the full link so a developer can click it.
- [ ] Config `App:FrontendBaseUrl`; links point at the **frontend** pages (`/confirm-email`, `/reset-password`).
- [ ] Leave a documented extension point for a real SMTP/API provider.

## Implementation details
- Encode tokens with `WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token))` and decode on receipt.
- The emailed one-time token is a link parameter, not a session token; it is consumed once and is not stored in JS state.

## Acceptance criteria
- Registering in Development prints a clickable confirmation link.

@@@ P1-06
title: Email confirmation endpoints
type: feature
area: auth
phase: 1
priority: P1
size: S
depends: P1-02, P1-05
@@@
## Summary
Confirm an email address and resend the confirmation.

## Tasks
- [ ] `POST /api/auth/confirm-email` body `{ userId, code }` returns 204 or 400.
- [ ] `POST /api/auth/resend-confirmation` body `{ email }` always returns 204 (no enumeration).
- [ ] Ignore already-confirmed accounts silently.

## Implementation details
- Rate limited by P1-08.
- Login for unconfirmed users (when required) returns the generic failure from P1-03.

## Acceptance criteria
- Valid code confirms; invalid or reused code returns 400.
- Resend for unknown email still returns 204.

@@@ P1-07
title: Forgot-password and reset-password endpoints
type: feature
area: auth
phase: 1
priority: P1
size: S
depends: P1-05
@@@
## Summary
Self-service password reset by emailed link.

## Tasks
- [ ] `POST /api/auth/forgot-password` `{ email }` always 204; email sent only if the account exists and is confirmed.
- [ ] `POST /api/auth/reset-password` `{ email, code, newPassword }` returns 204 or 400.
- [ ] After reset, reset the security stamp so existing cookies become invalid.

## Implementation details
- `UserManager.GeneratePasswordResetTokenAsync` / `ResetPasswordAsync`; same Base64Url encoding as P1-05.

## Acceptance criteria
- Old password stops working; old sessions are invalidated.

@@@ P1-08
title: Rate limiting for /api/auth endpoints
type: task
area: security
phase: 1
priority: P1
size: S
depends: P1-01
@@@
## Summary
Throttle credential-guessing and email-spam vectors.

## Tasks
- [ ] `AddRateLimiter` with policy `auth`: fixed window, 10 requests / minute / IP.
- [ ] Apply `[EnableRateLimiting("auth")]` to login, register, forgot-password, resend-confirmation.
- [ ] Rejection returns **429** problem JSON with `Retry-After`.
- [ ] `app.UseRateLimiter()` after routing/CORS.
- [ ] Configure `ForwardedHeaders` if deployed behind a proxy so the client IP is correct.

## Acceptance criteria
- Eleventh login attempt inside a minute returns 429.

@@@ P1-09
title: Fallback authorization policy and ICurrentUser service
type: task
area: auth
phase: 1
priority: P0
size: S
depends: P1-01
@@@
## Summary
Secure-by-default: every endpoint requires authentication unless explicitly anonymous.

## Tasks
- [ ] `SetFallbackPolicy(RequireAuthenticatedUser())`.
- [ ] `[AllowAnonymous]` on `HealthController` and register/login/confirm/forgot/reset actions.
- [ ] `ICurrentUser { Guid UserId; string Email; string DisplayName; }` backed by `IHttpContextAccessor`, throwing `UnauthorizedAccessException` if unauthenticated.
- [ ] Register `ICurrentUser` as scoped.
- [ ] Test helper for authenticated clients (from P0-09).

## Acceptance criteria
- A new controller without attributes returns 401 for anonymous calls.

@@@ P1-10
title: CSRF defense for cookie auth (Origin allowlist + custom header)
type: task
area: security
phase: 1
priority: P0
size: S
depends: P0-07, P1-09
@@@
## Summary
Cookie auth is vulnerable to CSRF. We avoid a JS-readable CSRF token by combining SameSite=Lax, a strict CORS allowlist, and server-side checks on unsafe methods.

## Tasks
- [ ] Middleware for `POST/PUT/PATCH/DELETE`: require header `X-Requested-With: Lorebound` (forces a CORS preflight for cross-origin callers).
- [ ] If an `Origin` header is present it must be in `Cors:AllowedOrigins`, otherwise 403.
- [ ] Return problem JSON (403) on violations.
- [ ] Exempt only `OPTIONS` and safe methods.
- [ ] Document the header in the auth docs; frontend client sends it (P9-03).

## Implementation details
- Non-browser test clients omit Origin; the custom header is still required so tests must send it.

## Acceptance criteria
- POST without the header returns 403; with header and disallowed Origin returns 403; valid request passes.

@@@ P1-11
title: GET and PUT /api/users/me
type: feature
area: auth
phase: 1
priority: P1
size: S
depends: P1-09
@@@
## Summary
Current-user profile for the sidebar and settings, replacing the hardcoded "Joseph Marlow".

## Tasks
- [ ] `GET /api/users/me` returns `{ id, email, displayName, emailConfirmed, createdAt }`.
- [ ] `PUT /api/users/me` updates `displayName` (1-60 chars).
- [ ] Email and password change are explicitly out of scope for this pass.

## Acceptance criteria
- Anonymous returns 401; authenticated returns own profile; update persists.

@@@ P1-12
title: Decide production topology so cookies work (same-site)
type: spike
area: auth
phase: 1
priority: P1
size: S
labels: needs-decision
depends:
@@@
## Summary
Cookie auth works cross-port on `localhost` because ports do not change the "site". In production the frontend and API must share a registrable domain or the cookie will not be sent.

## Options to evaluate (time-box: half a day)
1. **Same-origin proxy**: Next.js `rewrites()` forwards `/api/*` to the API. Browser talks only to one origin; no CORS and simplest CSRF story.
2. **Sibling subdomains**: `app.example.com` and `api.example.com` with cookie `Domain=example.com`, SameSite=Lax.
3. Separate domains (not viable with SameSite=Lax; requires `SameSite=None`, rejected).

## Deliverable
- A short ADR in `docs/decisions/` naming the chosen option, the required environment variables (`NEXT_PUBLIC_API_URL`, `Cors__AllowedOrigins`, cookie domain), and how local dev mirrors it.

## Acceptance criteria
- Decision recorded; P9-03 can proceed without ambiguity.

@@@ P1-13
title: Authentication integration test suite
type: test
area: testing
phase: 1
priority: P0
size: M
depends: P0-09, P1-04, P1-06, P1-07, P1-08, P1-10, P1-11
@@@
## Summary
Prove the auth surface end to end using the real-Postgres harness.

## Tasks
- [ ] Register then login sets a cookie; assert `HttpOnly`, `Secure`, `SameSite=Lax` in the `Set-Cookie` header.
- [ ] Assert no login/register response body contains `token`, `access`, or `refresh` fields.
- [ ] Logout invalidates the session.
- [ ] Lockout after 5 failures; generic errors for unknown user vs wrong password.
- [ ] Confirm-email and reset-password happy and failure paths.
- [ ] Rate limit returns 429.
- [ ] CSRF middleware cases from P1-10.
- [ ] Anonymous call to a protected route returns 401 problem JSON.

## Acceptance criteria
- All tests pass in CI.
