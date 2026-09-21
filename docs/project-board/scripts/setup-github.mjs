#!/usr/bin/env node
/**
 * Lorebound GitHub setup: labels, milestones, issues, epics, and a Projects v2 board.
 *
 *   node setup-github.mjs                    dry run (default): parse + validate + summary, NO network calls
 *   node setup-github.mjs --print P2-04      dry run and print one rendered issue body
 *   GITHUB_TOKEN=... node setup-github.mjs --apply
 *
 * Options: --owner <login> --repo <name> --project "<title>" --skip-project --resync-fields
 *
 * Token: classic PAT with scopes `repo` and `project` (fine-grained PATs cannot manage
 * user-owned Projects v2). Never commit the token. Re-running is safe: issues are matched by
 * a hidden `<!-- lorebound-key: KEY -->` marker and nothing is duplicated.
 *
 * Views and workflows cannot be created through the API; follow PROJECT-SETTINGS.md for those.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const BOARD_DIR = join(HERE, '..');
const ISSUES_DIR = join(BOARD_DIR, 'issues');
const README_PATH = join(BOARD_DIR, 'README.md');

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d;
};

const APPLY = flag('apply');
const OWNER = opt('owner', 'Bugbear777');
const REPO = opt('repo', 'CharacterBackgroundGenerator');
const PROJECT_TITLE = opt('project', 'Lorebound API Roadmap');
const SKIP_PROJECT = flag('skip-project');
const RESYNC = flag('resync-fields');
const TOKEN = process.env.GITHUB_TOKEN;

// ---------------------------------------------------------------- configuration
const PHASES = {
  0: 'Phase 0 - Foundations',
  1: 'Phase 1 - Authentication',
  2: 'Phase 2 - Settings CRUD',
  3: 'Phase 3 - Sharing',
  4: 'Phase 4 - Setting Entries',
  5: 'Phase 5 - Entry Relationships',
  6: 'Phase 6 - Characters',
  7: 'Phase 7 - Builder Support',
  8: 'Phase 8 - Dashboard and Polish',
  9: 'Phase 9 - Frontend Integration',
};

const TYPES = {
  epic: { color: '3E4B9E', option: 'Epic', pcolor: 'PURPLE', desc: 'Phase-level parent issue' },
  feature: { color: '0E8A16', option: 'Feature', pcolor: 'GREEN', desc: 'New user-visible capability or endpoint' },
  task: { color: '1D76DB', option: 'Task', pcolor: 'BLUE', desc: 'Implementation work unit' },
  bug: { color: 'D73A4A', option: 'Bug', pcolor: 'RED', desc: 'Defect or suspected defect' },
  spike: { color: 'FBCA04', option: 'Spike', pcolor: 'YELLOW', desc: 'Time-boxed investigation or decision' },
  test: { color: '5319E7', option: 'Test', pcolor: 'PINK', desc: 'Automated test work' },
  docs: { color: '0075CA', option: 'Docs', pcolor: 'GRAY', desc: 'Documentation' },
  chore: { color: 'C5DEF5', option: 'Chore', pcolor: 'GRAY', desc: 'Maintenance and cleanup' },
};

const AREAS = {
  api: 'API',
  auth: 'Auth',
  database: 'Database',
  sharing: 'Sharing',
  characters: 'Characters',
  builder: 'Builder',
  frontend: 'Frontend',
  devex: 'DevEx',
  docs: 'Docs',
  testing: 'Testing',
  security: 'Security',
};

const PRIORITIES = {
  P0: { option: 'P0 - Critical', color: 'RED', desc: 'On the critical path; blocks other work' },
  P1: { option: 'P1 - High', color: 'ORANGE', desc: 'Important; schedule soon' },
  P2: { option: 'P2 - Medium', color: 'YELLOW', desc: 'Normal priority' },
  P3: { option: 'P3 - Low', color: 'GRAY', desc: 'Nice to have' },
};

const SIZES = {
  XS: { color: 'GRAY', desc: 'About 1 hour or less' },
  S: { color: 'GREEN', desc: 'Up to half a day' },
  M: { color: 'YELLOW', desc: 'About 1 day' },
  L: { color: 'RED', desc: 'Epic-sized; task issues of this size must be split' },
};

const STATUSES = [
  { name: 'Backlog', color: 'GRAY', description: 'Not ready to start' },
  { name: 'Ready', color: 'BLUE', description: 'Dependencies met; can be picked up' },
  { name: 'In Progress', color: 'YELLOW', description: 'Being worked on' },
  { name: 'In Review', color: 'PURPLE', description: 'Pull request open' },
  { name: 'Blocked', color: 'RED', description: 'Waiting on a dependency or decision' },
  { name: 'Done', color: 'GREEN', description: 'Merged and closed' },
];

const EXTRA_LABELS = [
  { name: 'blocked', color: 'B60205', description: 'Waiting on another issue or external factor' },
  { name: 'needs-decision', color: 'FEF2C0', description: 'A team decision is required before or during this work' },
  { name: 'needs-repro', color: 'FEF2C0', description: 'Suspected defect; reproduce with a failing test first' },
];

const API_AREAS = ['api', 'auth', 'database', 'sharing', 'characters', 'builder', 'security'];

// ---------------------------------------------------------------- parsing
function parseIssues() {
  const files = readdirSync(ISSUES_DIR).filter((f) => f.endsWith('.md')).sort();
  const issues = [];
  for (const file of files) {
    const text = readFileSync(join(ISSUES_DIR, file), 'utf8').replace(/\r\n/g, '\n');
    const parts = text.split(/^@@@ (\S+)\n/m);
    for (let i = 1; i < parts.length; i += 2) {
      const key = parts[i];
      const rest = parts[i + 1];
      const m = rest.match(/^([\s\S]*?)^@@@\n([\s\S]*)$/m);
      if (!m) throw new Error(`${file}: issue ${key} is missing the closing "@@@" line after its metadata`);
      const meta = {};
      for (const line of m[1].split('\n')) {
        if (!line.trim()) continue;
        const idx = line.indexOf(':');
        if (idx < 0) throw new Error(`${file}: bad metadata line in ${key}: "${line}"`);
        meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
      }
      const list = (v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : []);
      issues.push({
        key,
        file,
        title: meta.title,
        type: meta.type,
        area: meta.area,
        phase: Number(meta.phase),
        priority: meta.priority,
        size: meta.size,
        depends: list(meta.depends),
        labels: list(meta.labels),
        body: m[2].trim(),
      });
    }
  }
  const order = (i) => (i.type === 'epic' ? 0 : 1);
  issues.sort((a, b) => order(a) - order(b) || a.key.localeCompare(b.key, undefined, { numeric: true }));
  return issues;
}

function validate(issues) {
  const errors = [];
  const warnings = [];
  const byKey = new Map();
  for (const i of issues) {
    if (byKey.has(i.key)) errors.push(`duplicate key ${i.key}`);
    byKey.set(i.key, i);
    if (!/^(E\d|P\d-\d{2})$/.test(i.key)) errors.push(`${i.key}: key format must be E<n> or P<phase>-<nn>`);
    if (!i.title) errors.push(`${i.key}: missing title`);
    if (!TYPES[i.type]) errors.push(`${i.key}: unknown type "${i.type}"`);
    if (!AREAS[i.area]) errors.push(`${i.key}: unknown area "${i.area}"`);
    if (!(i.phase in PHASES)) errors.push(`${i.key}: unknown phase "${i.phase}"`);
    if (!PRIORITIES[i.priority]) errors.push(`${i.key}: unknown priority "${i.priority}"`);
    if (!SIZES[i.size]) errors.push(`${i.key}: unknown size "${i.size}"`);
    if (i.type !== 'epic' && i.size === 'L') warnings.push(`${i.key}: size L on a non-epic; split it`);
    if (i.type !== 'epic' && !/^## Acceptance criteria/m.test(i.body)) warnings.push(`${i.key}: no "## Acceptance criteria" section`);
    if (i.type === 'spike' && !/^## Deliverable/m.test(i.body)) warnings.push(`${i.key}: spike without "## Deliverable"`);
    if (i.type === 'bug' && !/Steps to reproduce/i.test(i.body)) warnings.push(`${i.key}: bug without "Steps to reproduce"`);
    for (const l of i.labels) if (!EXTRA_LABELS.some((e) => e.name === l)) errors.push(`${i.key}: unknown extra label "${l}"`);
  }
  for (const i of issues) {
    for (const d of i.depends) {
      if (!byKey.has(d)) errors.push(`${i.key}: depends on unknown ${d}`);
      else if (d === i.key) errors.push(`${i.key}: depends on itself`);
      else if (byKey.get(d).phase > i.phase) warnings.push(`${i.key}: depends on later-phase ${d}`);
    }
  }
  for (const p of Object.keys(PHASES)) {
    const epics = issues.filter((i) => i.phase === Number(p) && i.type === 'epic');
    if (epics.length !== 1) errors.push(`phase ${p} must have exactly one epic (found ${epics.length})`);
  }
  const state = new Map();
  const visit = (k, stack) => {
    if (state.get(k) === 2) return;
    if (state.get(k) === 1) {
      errors.push(`dependency cycle: ${[...stack, k].join(' -> ')}`);
      return;
    }
    state.set(k, 1);
    for (const d of byKey.get(k)?.depends ?? []) if (byKey.has(d)) visit(d, [...stack, k]);
    state.set(k, 2);
  };
  for (const i of issues) visit(i.key, []);
  return { errors, warnings, byKey };
}

// ---------------------------------------------------------------- rendering
function definitionOfDone(issue, number) {
  if (issue.type === 'epic') return '';
  const l = [];
  l.push(`- [ ] Branch \`${issue.type === 'bug' ? 'fix' : 'feature'}/${number ?? '<issue>'}-short-slug\` merged into \`dev\` by a PR whose description contains \`Closes #${number ?? '<issue>'}\``);
  if (API_AREAS.includes(issue.area)) {
    l.push('- [ ] `dotnet build` and `dotnet test` pass locally and in CI');
    if (['feature', 'task', 'bug'].includes(issue.type) && issue.area !== 'database') {
      l.push('- [ ] Tests cover the permission matrix that applies: anonymous 401, non-member 404, player 403 on writes, GM/owner success');
    }
    if (issue.type === 'feature') l.push('- [ ] Requests added or updated in `api/Lorebound.Api.http`');
    if (issue.area === 'database') l.push('- [ ] Migration reviewed, applies to a fresh database, model snapshot committed');
  } else if (issue.area === 'frontend') {
    l.push('- [ ] `npm run lint` and `npm run build` pass in `frontend/`');
    l.push('- [ ] Golden path plus loading, error and empty states checked in the browser; no console errors');
  }
  if (issue.type === 'bug') l.push('- [ ] Regression test added that fails before the fix');
  l.push('- [ ] README/docs updated if behavior, setup, or a contract changed');
  return l.join('\n');
}

function renderBody(issue, ctx) {
  const ref = (k) => ctx.ref(k);
  const parts = [issue.body];
  if (issue.type === 'epic') {
    const kids = ctx.children(issue.phase);
    parts.push(`## Child issues\n${kids.map((k) => `- [ ] ${ref(k.key)} ${k.title}`).join('\n')}`);
  } else {
    parts.push(`## Dependencies\n${issue.depends.length ? issue.depends.map((d) => `- Blocked by ${ref(d)}`).join('\n') : '- None'}`);
    parts.push(`## Definition of done\n${definitionOfDone(issue, ctx.number(issue.key))}`);
  }
  const epic = ctx.epicFor(issue);
  parts.push(
    [
      '## Metadata',
      '| Field | Value |',
      '|---|---|',
      `| Key | ${issue.key} |`,
      `| Phase | ${PHASES[issue.phase]} |`,
      `| Type | ${issue.type} |`,
      `| Area | ${AREAS[issue.area]} |`,
      `| Priority | ${PRIORITIES[issue.priority].option} |`,
      `| Size | ${issue.size} |`,
      ...(epic && epic.key !== issue.key ? [`| Parent epic | ${ref(epic.key)} |`] : []),
    ].join('\n'),
  );
  parts.push(`<!-- lorebound-key: ${issue.key} -->`);
  return parts.join('\n\n');
}

// ---------------------------------------------------------------- HTTP helpers
const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'Content-Type': 'application/json',
  'User-Agent': 'lorebound-setup',
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function http(url, init, attempt = 1) {
  const res = await fetch(url, init);
  const retryAfter = Number(res.headers.get('retry-after'));
  const limited = res.status === 429 || (res.status === 403 && (retryAfter || res.headers.get('x-ratelimit-remaining') === '0'));
  if ((limited || res.status >= 500) && attempt <= 5) {
    const wait = retryAfter ? retryAfter * 1000 : 2000 * attempt * attempt;
    console.log(`  ... ${res.status} from GitHub, waiting ${Math.round(wait / 1000)}s (attempt ${attempt})`);
    await sleep(wait);
    return http(url, init, attempt + 1);
  }
  return res;
}

async function rest(method, path, body) {
  const res = await http(`https://api.github.com${path}`, { method, headers: HEADERS, body: body ? JSON.stringify(body) : undefined });
  if (res.status === 204) return null;
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const e = new Error(`${method} ${path} -> ${res.status} ${data?.message ?? ''}`);
    e.status = res.status;
    throw e;
  }
  return data;
}

async function paginate(path) {
  const out = [];
  for (let page = 1; ; page++) {
    const items = await rest('GET', `${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
    out.push(...items);
    if (items.length < 100) break;
  }
  return out;
}

async function gql(query, variables = {}, features) {
  const res = await http('https://api.github.com/graphql', {
    method: 'POST',
    headers: { ...HEADERS, ...(features ? { 'GraphQL-Features': features } : {}) },
    body: JSON.stringify({ query, variables }),
  });
  const data = await res.json();
  if (data.errors?.length) throw new Error(data.errors.map((e) => e.message).join('; '));
  return data.data;
}

// ---------------------------------------------------------------- apply
async function apply(issues, byKey) {
  const me = await rest('GET', '/user');
  console.log(`Authenticated as ${me.login}`);
  const repo = await rest('GET', `/repos/${OWNER}/${REPO}`);
  if (!repo.permissions?.push) throw new Error(`No write access to ${OWNER}/${REPO}`);
  console.log(`Repository ${repo.full_name} (default branch: ${repo.default_branch})`);

  // labels
  console.log('\n[1/6] Labels');
  const wanted = [
    ...Object.entries(TYPES).map(([k, v]) => ({ name: `type: ${k}`, color: v.color, description: v.desc })),
    ...Object.entries(AREAS).map(([k, v]) => ({ name: `area: ${k}`, color: '006B75', description: `Area: ${v}` })),
    ...EXTRA_LABELS,
  ];
  const haveLabels = new Set((await paginate(`/repos/${OWNER}/${REPO}/labels`)).map((l) => l.name.toLowerCase()));
  for (const l of wanted) {
    if (haveLabels.has(l.name.toLowerCase())) continue;
    await rest('POST', `/repos/${OWNER}/${REPO}/labels`, l);
    console.log(`  + ${l.name}`);
  }

  // milestones
  console.log('\n[2/6] Milestones');
  const milestones = new Map((await paginate(`/repos/${OWNER}/${REPO}/milestones?state=all`)).map((m) => [m.title, m.number]));
  const msNumber = {};
  for (const [phase, title] of Object.entries(PHASES)) {
    if (!milestones.has(title)) {
      const epic = issues.find((i) => i.phase === Number(phase) && i.type === 'epic');
      const created = await rest('POST', `/repos/${OWNER}/${REPO}/milestones`, { title, description: epic.title });
      milestones.set(title, created.number);
      console.log(`  + ${title}`);
    }
    msNumber[phase] = milestones.get(title);
  }

  // issues (pass 1: create)
  console.log('\n[3/6] Issues (create)');
  const existing = new Map();
  for (const it of await paginate(`/repos/${OWNER}/${REPO}/issues?state=all`)) {
    if (it.pull_request) continue;
    const m = (it.body ?? '').match(/<!-- lorebound-key: (\S+) -->/);
    if (m) existing.set(m[1], it);
  }
  const made = new Map(); // key -> { number, id, node_id }
  for (const i of issues) {
    let it = existing.get(i.key);
    if (!it) {
      const labels = [`type: ${i.type}`, `area: ${i.area}`, ...i.labels];
      it = await rest('POST', `/repos/${OWNER}/${REPO}/issues`, {
        title: `[${i.key}] ${i.title}`,
        body: `Provisional body; the setup script replaces it.\n\n<!-- lorebound-key: ${i.key} -->`,
        labels,
        milestone: msNumber[i.phase],
      });
      console.log(`  + #${it.number} [${i.key}] ${i.title}`);
      await sleep(1000);
    }
    made.set(i.key, { number: it.number, id: it.id, node_id: it.node_id, body: it.body });
  }

  // issues (pass 2: final bodies with real cross-references)
  console.log('\n[4/6] Issues (final bodies and links)');
  const epicByPhase = new Map(issues.filter((i) => i.type === 'epic').map((e) => [e.phase, e]));
  const ctx = {
    ref: (k) => `#${made.get(k).number}`,
    number: (k) => made.get(k).number,
    children: (phase) => issues.filter((x) => x.phase === phase && x.type !== 'epic'),
    epicFor: (i) => epicByPhase.get(i.phase),
  };
  for (const i of issues) {
    const body = renderBody(i, ctx);
    const cur = made.get(i.key);
    if (cur.body !== body) {
      await rest('PATCH', `/repos/${OWNER}/${REPO}/issues/${cur.number}`, { body });
      await sleep(400);
    }
  }
  console.log(`  ${issues.length} issues up to date`);

  // native relationships (best effort)
  let subIssues = true;
  let blockedBy = true;
  for (const i of issues) {
    const cur = made.get(i.key);
    if (i.type !== 'epic' && subIssues) {
      try {
        await gql(
          'mutation($p:ID!,$c:ID!){ addSubIssue(input:{issueId:$p,subIssueId:$c}){ issue{ id } } }',
          { p: made.get(epicByPhase.get(i.phase).key).node_id, c: cur.node_id },
          'sub_issues',
        );
      } catch (e) {
        if (!/already|duplicate|exist/i.test(e.message)) {
          console.log(`  ! Native sub-issue linking unavailable (${e.message}). Task lists in epic bodies still link children.`);
          subIssues = false;
        }
      }
    }
    if (blockedBy) {
      for (const d of i.depends) {
        try {
          await rest('POST', `/repos/${OWNER}/${REPO}/issues/${cur.number}/dependencies/blocked_by`, { issue_id: made.get(d).id });
        } catch (e) {
          if (![422].includes(e.status)) {
            console.log(`  ! Native "blocked by" unavailable (${e.message}). The Dependencies section in each body still records it.`);
            blockedBy = false;
            break;
          }
        }
      }
    }
  }

  if (SKIP_PROJECT) {
    console.log('\n--skip-project set; stopping before the project board.');
    return;
  }

  // project
  console.log('\n[5/6] Project board');
  const owner = await gql(
    `query($login:String!){ repositoryOwner(login:$login){ __typename id
       ... on User { projectsV2(first:100){ nodes{ id number title url } } }
       ... on Organization { projectsV2(first:100){ nodes{ id number title url } } } } }`,
    { login: OWNER },
  );
  let project = owner.repositoryOwner.projectsV2.nodes.find((p) => p.title === PROJECT_TITLE);
  if (!project) {
    const created = await gql(
      'mutation($o:ID!,$t:String!,$r:ID!){ createProjectV2(input:{ownerId:$o,title:$t,repositoryId:$r}){ projectV2{ id number title url } } }',
      { o: owner.repositoryOwner.id, t: PROJECT_TITLE, r: repo.node_id },
    );
    project = created.createProjectV2.projectV2;
    console.log(`  + created project #${project.number}`);
  } else {
    console.log(`  = project #${project.number} exists`);
    try {
      await gql('mutation($p:ID!,$r:ID!){ linkProjectV2ToRepository(input:{projectId:$p,repositoryId:$r}){ repository{ id } } }', { p: project.id, r: repo.node_id });
    } catch (e) {
      console.log(`  (repo link: ${e.message})`);
    }
  }
  const readme = readFileSync(README_PATH, 'utf8');
  await gql(
    'mutation($p:ID!,$d:String!,$r:String!){ updateProjectV2(input:{projectId:$p,shortDescription:$d,readme:$r,public:false}){ projectV2{ id } } }',
    { p: project.id, d: 'Roadmap and task tracking for the Lorebound API, auth, sharing, characters and frontend integration.', r: readme },
  );
  console.log('  + description and README set (project visibility: private)');

  const loadFields = async () => {
    const d = await gql(
      `query($id:ID!){ node(id:$id){ ... on ProjectV2 { fields(first:50){ nodes{
         ... on ProjectV2Field{ id name }
         ... on ProjectV2SingleSelectField{ id name options{ id name } }
         ... on ProjectV2IterationField{ id name } } } } } }`,
      { id: project.id },
    );
    return d.node.fields.nodes.filter((f) => f && f.id);
  };
  let fields = await loadFields();
  const selectDefs = {
    Priority: Object.values(PRIORITIES).map((p) => ({ name: p.option, color: p.color, description: p.desc })),
    Size: Object.entries(SIZES).map(([n, s]) => ({ name: n, color: s.color, description: s.desc })),
    Type: Object.values(TYPES).map((t) => ({ name: t.option, color: t.pcolor, description: t.desc })),
    Area: Object.values(AREAS).map((a) => ({ name: a, color: 'BLUE', description: `${a} work` })),
  };
  for (const [name, options] of Object.entries(selectDefs)) {
    if (fields.some((f) => f.name === name)) continue;
    await gql(
      'mutation($i:CreateProjectV2FieldInput!){ createProjectV2Field(input:$i){ projectV2Field{ ... on ProjectV2SingleSelectField{ id } } } }',
      { i: { projectId: project.id, dataType: 'SINGLE_SELECT', name, singleSelectOptions: options } },
    );
    console.log(`  + field ${name}`);
  }
  fields = await loadFields();
  const status = fields.find((f) => f.name === 'Status');
  if (status && !STATUSES.every((s) => status.options?.some((o) => o.name === s.name))) {
    try {
      await gql(
        'mutation($i:UpdateProjectV2FieldInput!){ updateProjectV2Field(input:$i){ projectV2Field{ ... on ProjectV2SingleSelectField{ id } } } }',
        { i: { fieldId: status.id, singleSelectOptions: STATUSES } },
      );
      console.log('  + Status options set');
      fields = await loadFields();
    } catch (e) {
      console.log(`  ! Could not update Status options automatically (${e.message}). Set them manually: ${STATUSES.map((s) => s.name).join(', ')}`);
    }
  }
  const F = (name) => fields.find((f) => f.name === name);
  const opt2 = (field, optName) => F(field)?.options?.find((o) => o.name === optName)?.id;

  // items
  console.log('\n[6/6] Board items');
  const present = new Map();
  let cursor = null;
  for (;;) {
    const page = await gql(
      `query($id:ID!,$c:String){ node(id:$id){ ... on ProjectV2 { items(first:100, after:$c){ pageInfo{ hasNextPage endCursor }
         nodes{ id content{ ... on Issue{ id } } } } } } }`,
      { id: project.id, c: cursor },
    );
    for (const n of page.node.items.nodes) if (n.content?.id) present.set(n.content.id, n.id);
    if (!page.node.items.pageInfo.hasNextPage) break;
    cursor = page.node.items.pageInfo.endCursor;
  }
  let added = 0;
  for (const i of issues) {
    const cur = made.get(i.key);
    let itemId = present.get(cur.node_id);
    const isNew = !itemId;
    if (isNew) {
      const r = await gql('mutation($p:ID!,$c:ID!){ addProjectV2ItemById(input:{projectId:$p,contentId:$c}){ item{ id } } }', { p: project.id, c: cur.node_id });
      itemId = r.addProjectV2ItemById.item.id;
      added++;
    }
    if (!isNew && !RESYNC) continue;
    const startStatus = i.type !== 'epic' && i.phase === 0 && i.depends.length === 0 ? 'Ready' : 'Backlog';
    const sets = [
      ['Priority', PRIORITIES[i.priority].option],
      ['Size', i.size],
      ['Type', TYPES[i.type].option],
      ['Area', AREAS[i.area]],
      ...(isNew ? [['Status', startStatus]] : []),
    ];
    const muts = [];
    sets.forEach(([field, optName], n) => {
      const optionId = opt2(field, optName);
      if (!F(field) || !optionId) return;
      muts.push(`m${n}: updateProjectV2ItemFieldValue(input:{projectId:"${project.id}",itemId:"${itemId}",fieldId:"${F(field).id}",value:{singleSelectOptionId:"${optionId}"}}){ clientMutationId }`);
    });
    if (muts.length) await gql(`mutation{ ${muts.join('\n')} }`);
    await sleep(300);
  }
  console.log(`  ${added} items added, ${issues.length - added} already on the board`);

  console.log(`
Done. Board: ${project.url}

Remaining MANUAL steps (the GitHub API cannot create views or workflows):
  1. Create the views listed in docs/project-board/PROJECT-SETTINGS.md
  2. Enable the built-in workflows listed there (auto-add, closed -> Done, PR merged -> Done, ...)
  3. Optional: add an Iteration field named "Sprint" and a date field "Target date".
`);
}

// ---------------------------------------------------------------- main
function summarize(issues) {
  const count = (fn) => issues.reduce((m, i) => ((m[fn(i)] = (m[fn(i)] ?? 0) + 1), m), {});
  console.log(`Parsed ${issues.length} issues (${issues.filter((i) => i.type === 'epic').length} epics)`);
  console.log('\nPer phase:');
  for (const [p, t] of Object.entries(PHASES)) console.log(`  ${t.padEnd(36)} ${issues.filter((i) => i.phase === Number(p) && i.type !== 'epic').length} issues`);
  console.log('\nBy type:    ', JSON.stringify(count((i) => i.type)));
  console.log('By priority:', JSON.stringify(count((i) => i.priority)));
  console.log('By size:    ', JSON.stringify(count((i) => i.size)));
  console.log('By area:    ', JSON.stringify(count((i) => i.area)));
}

async function main() {
  const issues = parseIssues();
  const { errors, warnings, byKey } = validate(issues);
  summarize(issues);
  if (warnings.length) console.log(`\nWarnings (${warnings.length}):\n  - ${warnings.join('\n  - ')}`);
  if (errors.length) {
    console.error(`\nErrors (${errors.length}):\n  - ${errors.join('\n  - ')}`);
    process.exit(1);
  }
  const printKey = opt('print');
  if (printKey) {
    const i = byKey.get(printKey);
    if (!i) throw new Error(`unknown key ${printKey}`);
    const epicByPhase = new Map(issues.filter((x) => x.type === 'epic').map((e) => [e.phase, e]));
    const ctx = {
      ref: (k) => `#${k}`,
      number: () => null,
      children: (phase) => issues.filter((x) => x.phase === phase && x.type !== 'epic'),
      epicFor: (x) => epicByPhase.get(x.phase),
    };
    console.log(`\n===== [${i.key}] ${i.title}  (labels: type: ${i.type}, area: ${i.area}, milestone: ${PHASES[i.phase]}) =====\n`);
    console.log(renderBody(i, ctx));
  }
  if (!APPLY) {
    console.log('\nDRY RUN: nothing was sent to GitHub. Re-run with --apply and GITHUB_TOKEN set to create everything.');
    return;
  }
  if (!TOKEN) throw new Error('Set GITHUB_TOKEN (classic PAT with repo + project scopes) before using --apply');
  console.log(`\nAPPLY mode: ${OWNER}/${REPO}, project "${PROJECT_TITLE}"`);
  await apply(issues, byKey);
}

main().catch((e) => {
  console.error(`\nFAILED: ${e.message}`);
  process.exit(1);
});
