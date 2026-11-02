# AGENTS.md

The ladder contract for this repository. Anyone (human or agent) committing
here follows it.

## What this repo is

A four-commit teaching ladder that ends at: a TypeScript MCP server over the
legacy HTTP+SSE transport, reading Star Wars data from swapi.info, gated by
Auth0 authentication, with per-tool RBAC enforced on the `urn:mcp` audience.
The blog series tells the same story commit by commit; it lives outside this
repo, and drafts are not committed here.

Since rung 3 the architecture is ONE Next.js process on port 3000: the
pages-API routes host the SDK's SSE transport (`bodyParser: false`), the
app-router routes run the OAuth dance, and a module-level session holds the
token that the gate verifies fresh on every tool call.

## Standing rules

- One concern per commit on `main`, linear history, no merges. Commit order
  is the narrative: Bootstrapping, MCP over SSE, Auth gating, RBAC on
  urn:mcp. No drive-by refactors or later-feature code smuggled into earlier
  commits.
- Tenant identifiers (Auth0 domain, client id) live ONLY in the untracked
  root `.env`. Tracked files carry placeholders. Agents: never read or print
  env values; change exactly one key per targeted edit, then grep only that
  key back to verify.
- Repo lifecycle (create remote, push, force-push, delete, archive) is Sam's
  hand, on his explicit word. The ladder commits locally and stops there.
  Archive (git bundle) before any history destruction.
- Before any commit: `git rev-parse --abbrev-ref HEAD`; detached HEAD has
  burned a ladder before. Kill patterns use character classes (for example
  `pkill -f "next[-]server"`), or the calling shell matches itself and dies.
- Blog drafts do not live here: the series runs in Sam's personal wiki, and
  nothing blog-shaped gets committed to this repo.

## Gates, verified before each commit

- Rung 1 (done): fresh scaffold, typecheck green.
- Rung 2 (done): server boots; smoke client lists and calls all four
  read-only tools against real swapi.info data.
- Rung 3 (in flight): `npm run build` green; with no session, every tool call
  refuses with the login link (curl + smoke); after Sam's browser login the
  same calls answer with real data; `/logout` re-locks, proven with the same
  negative checks.
- Rung 4 (next): with a valid session whose token carries NO `people:read`,
  `getFilm`/`getPlanet` pass while `getPerson`/`searchPeople` refuse and name
  the missing permission; after the permission is assigned in the dashboard
  and a fresh token lands (re-login), those two pass too. Permissions ride
  the token at issue time; a new assignment demands a new login.

## Runtime notes

- One command to run: `npm run dev`, or `npm run build && npm start`.
  Port 3000 is pinned by the Auth0 application URLs.
- SSE lives at `/api/sse` (GET) and `/api/messages?sessionId=...` (POST);
  both are pages-API routes with `bodyParser: false` because the transport
  reads its own raw stream and a body parser would consume it silently.
- The Auth0 issuer carries a trailing slash; verification compares against
  the issuer the discovery document publishes, never against the env string.
- The audience must ride the `/authorize` request or Auth0 mints
  `aud=client_id` and every post-login call fails.
- On the `urn:mcp` API, User-Delegated Access is All apps allowed
  (`subject_type_authorization.user.policy = allow_all`); per-app
  authorization is the least-privilege alternative and requires client
  grants plus explicit scope requests.
- Next dev holds RSC pages and route handlers in separate module sandboxes:
  the home page therefore reads session truth through `/api/auth-status`,
  never through direct module import.

## Opencode worker contract (when Hermes delegates here)

- Verify commands that must pass with exit 0 before finishing:
  `npm run build` (turbopack), and with the dev server up,
  `node client/smoke.mjs` printing four "Login required" refusals when no
  session exists. Kill a dev server by the PID from `ss -ltnp`, not by
  a bare `pkill -f` pattern (the invoking command line matches itself).
- Boundaries: minimal diff; never push; never edit `.env` (reads are
  escalated, edits forbidden); flag any change to README.md or
  AGENTS.md instead of making it silently; no new dependencies without a
  stated reason; keep `npm run build` green above all.
- Output protocol (exactly three lines, last message):

```
FILES CHANGED: <paths>
WHAT CHANGED: <one sentence>
VERIFY: <command> <exit code>
```

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
