# a0-mcp-demo

A demo series built as a ladder of commits, one concern per commit. Each rung
lands with a blog post that explains what the commit changed and why. The blog
series lives outside this repo; drafts are not committed here.

What it becomes by the last rung: a TypeScript MCP server speaking legacy
HTTP+SSE, serving read-only Star Wars data from swapi.info, where no tool call
is answered until the user has logged in through Auth0, and where the person
tools additionally demand the `people:read` permission minted into the
`urn:mcp` access token.

The whole thing is ONE Next.js process on ONE port. The pages-API routes host
the SDK's SSE transport; the app-router routes run the OAuth dance; a
module-level session holds the token, and the gate verifies it fresh on every
tool call. Nothing talks to localhost over a second port.

## The ladder

| Commit concern | Blog | Ends when |
| --- | --- | --- |
| Bootstrapping | none | scaffold typechecks clean |
| MCP over SSE | part one | opencode + scripted client read data, no auth |
| Auth gating | part one | tool calls refuse until the Auth0 login lands |
| RBAC on urn:mcp | part two | person tools demand `people:read` |

## Quickstart

```sh
npm install
cp .env.example .env         # then edit: AUTH0_DOMAIN, AUTH0_CLIENT_ID
npm run dev
```

Open `http://localhost:3000`, log in, and the tools unlock. Auth0 application
settings: callback `http://localhost:3000/callback`, logout
`http://localhost:3000/logged-out`, web origin `http://localhost:3000`,
Authorization Code with PKCE, no refresh token. On the `urn:mcp` API,
User-Delegated Access is All apps allowed.

Point opencode at the server (already in `opencode.json`), or verify alone:

```sh
npm run smoke
```

## Status

Auth gating verified: the first tool call refuses instantly with the login
link, later calls hold and poll for the session (90 s window), and the build
is green. Rung 3 committed; rung 4 (RBAC on urn:mcp) follows.

## Secrets policy

Tenant identifiers (issuer domain, client id) live only in the untracked
`.env` / `web/.env.local`. Tracked files carry placeholders. Never commit
either. Nothing in this repo knows about any other IdP.