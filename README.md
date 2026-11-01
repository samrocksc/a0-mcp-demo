# a0-mcp-demo

A demo series built as a ladder of commits, one concern per commit. Each rung
lands with a blog post (BLOG_1.md, BLOG_2.md, BLOG_3.md) that explains what the
commit changed and why.

What it becomes by the last rung: a TypeScript MCP server speaking legacy
HTTP+SSE, serving read-only Star Wars data from swapi.info, where no tool call
is answered until the user has logged in through Auth0, and where the person
tools additionally demand the `people:read` permission minted into the
`urn:mcp` access token.

## The ladder

| Commit concern | Blog | Ends when |
| --- | --- | --- |
| Bootstrapping | none | scaffold typechecks clean |
| MCP over SSE | BLOG_1.md | opencode + scripted client read data, no auth |
| Auth gating | BLOG_2.md | tool calls refuse until the Auth0 login lands |
| RBAC on urn:mcp | BLOG_3.md | person tools demand `people:read` |

## Status

MCP over SSE works. Four read-only tools answer through opencode and the
smoke client. No auth yet: the next rung wires Auth0 gating.

## Secrets policy

Tenant identifiers (issuer domain, client id) live only in the untracked
`.env` / `web/.env.local`. Tracked files carry placeholders. Never commit
either. Nothing in this repo knows about any other IdP.