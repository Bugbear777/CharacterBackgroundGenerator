## Summary
<!-- What changed and why. One issue per PR. -->

Closes #

## Type of change
- [ ] Feature
- [ ] Bug fix
- [ ] Task / chore
- [ ] Test / docs only

## Test plan
- [ ] `dotnet build` and `dotnet test` pass (API changes)
- [ ] `npm run lint` and `npm run build` pass (frontend changes)
- [ ] Permission matrix tested where relevant: anonymous 401, non-member 404, player 403 on writes, GM/owner success
- [ ] Requests added to `api/Lorebound.Api.http`
- [ ] Manually verified in the browser / API client

## Checklist
- [ ] Targets `dev` (not `main`)
- [ ] Migration included and reviewed, if the schema changed (announced to the team)
- [ ] No secrets, tokens, or `.env` files committed
- [ ] No token or credential is returned in a response body or stored in JS (auth changes)
- [ ] Docs/README updated if behavior or setup changed
