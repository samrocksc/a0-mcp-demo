# A read-only MCP server over SSE

This repository is a ladder: four commits, one concern each. The first rung
was pure scaffold: a `package.json`, a strict `tsconfig`, an `AGENTS.md` that
carries the ladder rules, and nothing to run. This rung, "MCP over SSE", is
the first code. By the end, your coding agent can consult a Star Wars
encyclopedia, and nobody has logged in.

## What an MCP server is, briefly

An MCP server speaks JSON-RPC 2.0 and exposes **tools**. The client, not the
server, decides when to call them. The model reads a tool's name,
description, and argument schema, then asks the client to invoke it. Tools
here are all reads: `getPerson`, `searchPeople`, `getFilm`, `getPlanet`. No
mutations, no writes.

## Choosing a transport

Two HTTP transports ship with the SDK. Streamable HTTP is the current spec
default. The legacy SSE transport is marked deprecated. I use it anyway. In
SSE, the client opens `GET /sse` and holds it open; every JSON-RPC message
the client sends is a plain `POST` to `/messages` with a session id in the
query string. You can watch the whole conversation in curl. When the point
of a demo is who is allowed to call what, seeing every hop is worth more
than chasing a spec bump. The streamable pattern will feel familiar once you
have traced this one.

## The tools

swapi.info serves the classic Star Wars JSON. No auth, no pagination on
lists, and no native search. swapi.dev grew a `?search=` parameter but it is
the staler instance, so I fetch the full roster once and filter in memory.
The fetch layer is deliberately small:

```typescript
const cache = new Map<string, { at: number; body: unknown }>();
const TTL_MS = 60_000;

async function fetchJson<T>(path: string): Promise<T> {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.body as T;
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`SWAPI ${path} returned ${res.status}`);
  const body = (await res.json()) as T;
  cache.set(path, { at: Date.now(), body });
  return body;
}

export async function searchPeople(term: string): Promise<PersonRef[]> {
  const all = await fetchJson<Person[]>("/people");
  const q = term.trim().toLowerCase();
  return all
    .filter((p) => p.name.toLowerCase().includes(q))
    .slice(0, 8)
    .map((p) => ({ id: idFromUrl(p.url), name: p.name }));
}
```

One tool registration, and the other three are copies with new names:

```typescript
mcp.registerTool(
  "getPerson",
  {
    description: "Look up a Star Wars person by swapi.info id. 1 is Luke Skywalker.",
    inputSchema: { id: z.number().int().min(1) },
  },
  async ({ id }) => text(JSON.stringify(await swapi.getPerson(id), null, 2))
);
```

`searchPeople` returns compact `{ id, name }` refs, and the full record is a
`getPerson` away.

## Wiring express

Express holds the HTTP endpoints; the SDK transports hold the conversation.

```typescript
app.get("/sse", async (_req, res) => {
  const transport = new SSEServerTransport("/messages", res);
  transports.set(transport.sessionId, transport);
  res.on("close", () => transports.delete(transport.sessionId));
  await mcp.connect(transport);
});

// No body parser here: handlePostMessage reads the raw stream itself.
app.post("/messages", async (req, res) => {
  const transport = transports.get(String(req.query.sessionId ?? ""));
  if (!transport) { res.status(400).send("Unknown SSE session"); return; }
  await transport.handlePostMessage(req, res);
});
```

That comment earns its line. I added `express.json()` once out of habit and
the transport hung reading a body that never came back. A body parser eats
the stream the SDK expects to read. Leave the route naked and it parses its
own JSON.

## Talking to it

Point opencode at the server:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "a0-mcp-demo": {
      "type": "remote",
      "url": "http://localhost:3001/sse",
      "enabled": true
    }
  }
}
```

There is also `client/smoke.mjs`, a scripted client that connects, lists the
tools, and calls all four. `npm run smoke` prints:

```
tools: getFilm, getPerson, getPlanet, searchPeople
== getPerson({"id":1}) == "name": "Luke Skywalker"
== searchPeople({"name":"skywalker"}) == [Luke, Anakin, Shmi]
== getFilm({"id":1}) == "title": "A New Hope"
== getPlanet({"id":1}) == "name": "Tatooine"
```

Every rung of this ladder gets verified the same way: typecheck, boot,
smoke, down. Commit.

## Next

Right now the server trusts anyone who can reach the port. The next commit
wires Auth0: a login link, a browser redirect, and tool calls that refuse to
answer until a real session exists.