# Project Board Settings

Complete configuration for the **Lorebound API Roadmap** GitHub Project (Projects v2). Items marked **[script]** are created by `scripts/setup-github.mjs`; items marked **[manual]** must be done in the GitHub UI because the API cannot create them.

GitHub's UI changes over time. If a menu name differs slightly or a workflow is not offered on your plan, skip it; the board still works because the script and the PR conventions do the essential linking.

---

## 0. Run order

1. **Token** [manual]: GitHub, Settings, Developer settings, Personal access tokens, **Tokens (classic)**. Scopes: `repo`, `project`. (Fine-grained tokens cannot manage user-owned Projects.) Keep it out of files:
   ```powershell
   $env:GITHUB_TOKEN = "<paste token>"
   ```
2. **Dry run** (no network):
   ```powershell
   node docs/project-board/scripts/setup-github.mjs
   node docs/project-board/scripts/setup-github.mjs --print P2-04
   ```
3. **Apply**:
   ```powershell
   node docs/project-board/scripts/setup-github.mjs --apply
   ```
   Options: `--owner`, `--repo`, `--project "<title>"`, `--skip-project` (issues only), `--resync-fields` (re-set Priority/Size/Type/Area on existing items). Re-running never duplicates issues.
4. **Views and workflows** [manual]: sections 4 and 5 below.
5. **Revoke the token** when finished.

---

## 1. General

| Setting | Value |
|---|---|
| Title | Lorebound API Roadmap [script] |
| Short description | Roadmap and task tracking for the Lorebound API, auth, sharing, characters and frontend integration. [script] |
| README | Contents of `docs/project-board/README.md` [script] |
| Visibility | Private [script]. Change to Public only if the repository is public and you want that. |
| Linked repository | `Bugbear777/CharacterBackgroundGenerator` [script] (Project, Settings, Manage access / Linked repositories to confirm) |
| Owner | The user account that owns the repository |
| Template | Off |

## 2. Access [manual]

Project, Settings, **Manage access**:

| Who | Role |
|---|---|
| Project owner | Admin |
| Each teammate (add by GitHub username) | Write |
| Repository collaborators | Ensure each teammate is also a repo collaborator with Write so they can be assigned issues |

## 3. Fields

Built-in fields to show: Title, Assignees, Status, Labels, Milestone, Repository, Linked pull requests, Reviewers, Parent issue, Sub-issues progress.

| Field | Type | Options | Source |
|---|---|---|---|
| **Status** | Single select | Backlog (gray), Ready (blue), In Progress (yellow), In Review (purple), Blocked (red), Done (green) | script tries to replace the default Todo/In Progress/Done; if it warns, edit the options by hand |
| **Priority** | Single select | P0 - Critical (red), P1 - High (orange), P2 - Medium (yellow), P3 - Low (gray) | [script] |
| **Size** | Single select | XS, S, M, L | [script] |
| **Type** | Single select | Epic, Feature, Task, Bug, Spike, Test, Docs, Chore | [script] |
| **Area** | Single select | API, Auth, Database, Sharing, Characters, Builder, Frontend, DevEx, Docs, Testing, Security | [script] |
| **Milestone** (phase) | Built-in | Phase 0 - Foundations ... Phase 9 - Frontend Integration | [script] creates milestones and assigns them |
| Target date | Date | (optional, needed for Roadmap layout) | [manual] |
| Sprint | Iteration | (optional) 1-week iterations | [manual] |

Field values are set once when an item is first added. Later changes are yours; the script does not overwrite them unless you pass `--resync-fields`.

## 4. Views [manual]

Create each via **New view**. Filter syntax: comma = OR within one field; separate qualifiers = AND; quote values with spaces.

| # | Name | Layout | Filter | Group by | Sort | Visible fields |
|---|---|---|---|---|---|---|
| 1 | **Board** | Board | `-is:archived` | (column field: Status) | Priority asc | Type, Priority, Size, Milestone, Assignees, Linked pull requests, Sub-issues progress. Column limits if offered: In Progress 6, In Review 6. |
| 2 | **Backlog** | Table | `status:Backlog,Ready -label:"type: epic"` | Milestone | Priority asc | Title, Type, Area, Priority, Size, Status, Assignees |
| 3 | **Current Phase** | Table | `milestone:"Phase 0 - Foundations" -label:"type: epic"` (edit to the active phase) | Status | Priority asc | Title, Type, Area, Priority, Size, Assignees |
| 4 | **My Work** | Table | `assignee:@me -status:Done` | Status | Priority asc | Title, Type, Priority, Size, Milestone |
| 5 | **In Review** | Table | `status:"In Review"` | none | Updated desc | Title, Assignees, Linked pull requests, Reviewers |
| 6 | **Blocked** | Table | `status:Blocked` | Milestone | Priority asc | Title, Assignees, Labels, Parent issue |
| 7 | **Needs Decision** | Table | `label:needs-decision -status:Done` | Milestone | Priority asc | Title, Type, Assignees, Milestone |
| 8 | **Bugs** | Table | `label:"type: bug"` | Status | Priority asc | Title, Priority, Size, Assignees |
| 9 | **Epics** | Table | `label:"type: epic"` | none | Milestone asc | Title, Milestone, Status, Sub-issues progress |
| 10 | **Critical Path (P0)** | Table | `priority:"P0 - Critical" -status:Done` | Milestone | Title asc | Title, Type, Area, Size, Status, Assignees |
| 11 | **By Area** | Table | `-status:Done -label:"type: epic"` | Area | Priority asc | Title, Type, Priority, Size, Status |
| 12 | **Roadmap** | Roadmap | `-status:Done` | Milestone | Target date | Dates: Target date (or Sprint); Markers: Milestones; Zoom: Quarter. Set milestone due dates and Target dates first or items will not appear. |

Make **Board** the default (first) view.

## 5. Workflows [manual]

Project, top-right menu, **Workflows**. Enable each that your plan offers.

| Workflow | Configuration |
|---|---|
| **Auto-add to project** | Repository `Bugbear777/CharacterBackgroundGenerator`; filter `is:issue,pr is:open`. (Plans limit how many auto-add workflows exist; one is enough.) |
| **Auto-add sub-issues to project** | On |
| **Item added to project** | Set Status = Backlog |
| **Item reopened** | Set Status = Ready |
| **Item closed** | Set Status = Done |
| **Pull request merged** | Set Status = Done |
| **Pull request linked to issue** | Set Status = In Review |
| **Code changes requested** | Set Status = In Progress |
| **Auto-close issue** | When Status = Done, close the issue |
| **Auto-archive items** | Filter `is:closed updated:<@today-14d` |

**Important:** GitHub closes issues from `Closes #N` only when the PR merges into the repository's **default branch**. Because team PRs target `dev`, resolve issue `P0-12` (make `dev` the default branch, or add a workflow that closes referenced issues on merge into `dev`). Until then the **Item closed** and **Auto-close issue** workflows are what move cards to Done, so close issues by hand after merge.

## 6. Insights (charts) [manual]

Project, top-right, **Insights**, New chart:

| Chart | Layout | X axis | Y axis | Group by | Filter |
|---|---|---|---|---|---|
| Progress by phase | Stacked column | Milestone | Count | Status | `-label:"type: epic"` |
| Burn-up | Historical | Time | Count | Status | `-label:"type: epic"` |
| Work by area | Bar | Area | Count | Status | `-label:"type: epic"` |
| Priority mix | Column | Priority | Count | Type | `-status:Done` |

## 7. Repository settings that support the board

| Item | Setting |
|---|---|
| **Labels** [script] | `type: epic/feature/task/bug/spike/test/docs/chore`, `area: api/auth/database/sharing/characters/builder/frontend/devex/docs/testing/security`, `blocked`, `needs-decision`, `needs-repro` |
| **Milestones** [script] | Phase 0 - Foundations, Phase 1 - Authentication, Phase 2 - Settings CRUD, Phase 3 - Sharing, Phase 4 - Setting Entries, Phase 5 - Entry Relationships, Phase 6 - Characters, Phase 7 - Builder Support, Phase 8 - Dashboard and Polish, Phase 9 - Frontend Integration. Add due dates by hand. |
| **Issue forms** | `.github/ISSUE_TEMPLATE/` (task, bug, feature); blank issues disabled |
| **PR template** | `.github/pull_request_template.md` (forces `Closes #N`) |
| **Default branch** | Decide in `P0-12` (`dev` recommended) |
| **Branch protection** | `P0-14`: require PR, 1 approval, checks `api` and `frontend`, no force pushes, delete head branches after merge |
| **Issues feature** | Enabled. Sub-issues and issue dependencies are used when available. |

## 8. How every issue is linked (verification checklist)

After applying, confirm:

- [ ] The board shows **109** items and the repo shows 109 issues with the `[E#]` / `[P#-##]` title prefixes.
- [ ] Each issue has a milestone, a `type:` label, and an `area:` label.
- [ ] Each work issue shows a **Parent epic** line and (if native sub-issues worked) a parent in the sidebar.
- [ ] Each epic body lists its children as a task list and shows Sub-issues progress in the Epics view.
- [ ] Dependencies sections show `#N` links (not bare keys such as `P2-02`).
- [ ] Priority, Size, Type, Area fields are populated for every item; Status is Ready for unblocked Phase 0 items and Backlog otherwise.
- [ ] A test PR containing `Closes #N` links to the issue and moves it on the board.

## 9. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `createProjectV2` fails with a permissions error | The token lacks the `project` scope, or it is a fine-grained token. Use a classic token. |
| Script says native sub-issues or blocked-by are unavailable | Feature not enabled for the account. The epic task lists and Dependencies sections still link everything; ignore. |
| Status options not replaced | Edit the Status field by hand (section 3) and re-run with `--resync-fields`. |
| Secondary rate limit messages | The script waits and retries automatically; just let it run. |
| Issues exist but are not on the board | Re-run `--apply`; existing issues are detected by their hidden key marker and only missing items are added. |
