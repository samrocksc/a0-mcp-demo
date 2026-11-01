# AGENTS.md

The ladder contract for this repository. Anyone (human or agent) committing
here follows it.

## What this repo is

A four-commit teaching ladder that ends at: a TypeScript MCP server over the
legacy HTTP+SSE transport, reading Star Wars data from swapi.info, gated by
Auth0 authentication, with per-tool RBAC enforced on the `urn:mcp` audience.
The blogs (BLOG_1.md through BLOG_3.md) tell the same story commit by commit.

## Standing rules

- One concern per commit, each verified before the next rung starts. Commit
  order is the narrative: Bootstrapping, MCP over SSE, Auth gating,
  RBAC on urn:mcp. No drive-by refactors or later-feature code smuggled into
  earlier commits.
- The branch is `main`, linear history, no merges.
- Tenant identifiers (Auth0 domain, client id) live ONLY in untracked `.env`
  and `web/.env.local`. Tracked files carry placeholders. Never commit real
  values, never read `.env`/`.env.local` wholesale as an agent, never dump
  their contents.
- Agents changing env files change exactly one key, then grep that key back
  to verify. Never print the file.
- Repo lifecycle (create remote, push, force-push, delete) is Sam's hand,
  on his explicit word. The ladder commits locally and stops there.
- Never delete content: archive instead (git bundle or tarball) before any
  history destruction.
- Before any commit: `git rev-parse --abbrev-ref HEAD` (detached HEAD has
  burned the ladder before), and the gates must pass:
  - Bootstrapping onward: `npm run typecheck` clean.
  - MCP over SSE onward: scripted SSE client answers the four read-only tools.
  - Auth gating onward: pre-login negative suite refuses tool calls with the
    login link; after browser login the same calls answer; logout re-arms.
  - RBAC onward: `getFilm` works with a plain session, `getPerson` fails with
    a permissions error until `people:read` is granted, passes once granted.

## Runtime notes

- Server runs from source with tsx (`npm start` once the SSE commit lands);
  Node 26.
- The Auth0 issuer carries a trailing slash; verification compares against
  the issuer the discovery document publishes, never against the env string
  pasted from the dashboard.
- The audience must ride the `/authorize` request or Auth0 mints
  `aud=client_id` and every post-login call fails.