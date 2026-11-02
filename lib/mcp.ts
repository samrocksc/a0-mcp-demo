// The MCP host, living inside the Next app. One process, one port, one truth:
// the gate reads the session this server's own routes wrote and verifies the
// token fresh on every tool call.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import * as swapi from "./swapi";
import { verifyToken } from "./authz";
import { clearSession, getHeldToken, waitForSession } from "./session";

export const WEB_URL = process.env.WEB_URL ?? "http://localhost:3000";
const loginUrl = `${WEB_URL}/login`;
const WAIT_MS = Number(process.env.MCP_WAIT_MS ?? 90_000);

export const mcp = new McpServer({ name: "a0-mcp-demo", version: "0.1.0" });

// sessionId -> transport, so POST /api/messages finds its stream. Lives on
// globalThis behind a registry symbol: hot reloads swap the module instance
// out from under an open SSE connection, and a fresh Map would orphan it.
const TRANSPORTS_KEY = Symbol.for("a0-mcp-demo.transports");
const globalTransports = globalThis as typeof globalThis & {
  [TRANSPORTS_KEY]?: Map<string, SSEServerTransport>;
};
export const transports: Map<string, SSEServerTransport> =
  (globalTransports[TRANSPORTS_KEY] ??= new Map());

const text = (body: string) => ({
  content: [{ type: "text" as const, text: body }],
});

const loginRequired = () => ({
  isError: true as const,
  content: [
    {
      type: "text" as const,
      text: `Login required. Open ${loginUrl} in a browser and log in, then ask again; the next call will wait up to ${Math.round(WAIT_MS / 1000)} s for your session.`,
    },
  ],
});

// The first unauthenticated call refuses instantly with the link; every call
// after that holds the line and polls until a login lands. A link that only
// shows up after a wait, or a window that re-arms itself into fast refusals,
// makes the user guess, and a demo must never guess.
let linkShown = false;

function gated<T>(fn: (args: T) => Promise<string>) {
  return async (args: T, _extra: unknown) => {
    let token = await getHeldToken();
    if (!token) {
      if (!linkShown) {
        linkShown = true;
        return loginRequired();
      }
      token = (await waitForSession(WAIT_MS)) ?? undefined;
      if (!token) return loginRequired();
    }
    try {
      const claims = await verifyToken(token);
      // Rung 4 adds the people:read permission check on `claims` right here.
      return text(await fn(args));
    } catch (err) {
      if ((err as Error).message.includes("Auth0 is not configured")) {
        throw err;
      }
      // Invalid or expired held token: drop it and re-lock.
      await clearSession();
      console.log(`held token rejected (${(err as Error).message}); tools locked`);
      return loginRequired();
    }
  };
}

export function registerTools(server: McpServer): void {
  server.registerTool(
    "getPerson",
    {
      description:
        "Look up a Star Wars person by swapi.info id. 1 is Luke Skywalker.",
      inputSchema: { id: z.number().int().min(1) },
    },
    gated<{ id: number }>(({ id }) =>
      swapi.getPerson(id).then((p) => JSON.stringify(p, null, 2))
    )
  );

  server.registerTool(
    "searchPeople",
    {
      description:
        "Find Star Wars people by fuzzy name. The API has no native search, so this filters the full roster locally and returns compact id and name refs.",
      inputSchema: { name: z.string().min(1) },
    },
    gated<{ name: string }>(({ name }) =>
      swapi.searchPeople(name).then((m) =>
        m.length ? JSON.stringify(m, null, 2) : "No matching people."
      )
    )
  );

  server.registerTool(
    "getFilm",
    {
      description: "Look up a Star Wars film by swapi.info id. 1 is A New Hope.",
      inputSchema: { id: z.number().int().min(1) },
    },
    gated<{ id: number }>(({ id }) =>
      swapi.getFilm(id).then((f) => JSON.stringify(f, null, 2))
    )
  );

  server.registerTool(
    "getPlanet",
    {
      description: "Look up a Star Wars planet by swapi.info id. 1 is Tatooine.",
      inputSchema: { id: z.number().int().min(1) },
    },
    gated<{ id: number }>(({ id }) =>
      swapi.getPlanet(id).then((p) => JSON.stringify(p, null, 2))
    )
  );
}

registerTools(mcp);