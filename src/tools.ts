// Four read-only tools, zod schemas, thin wiring over the swapi layer.

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as swapi from "./swapi.js";

const text = (body: string) => ({ content: [{ type: "text" as const, text: body }] });

export function registerTools(mcp: McpServer): void {
  mcp.registerTool(
    "getPerson",
    {
      description:
        "Look up a Star Wars person by swapi.info id. 1 is Luke Skywalker.",
      inputSchema: { id: z.number().int().min(1) },
    },
    async ({ id }) => text(JSON.stringify(await swapi.getPerson(id), null, 2))
  );

  mcp.registerTool(
    "searchPeople",
    {
      description:
        "Find Star Wars people by fuzzy name. The API has no native search, so this filters the full roster locally and returns compact id and name refs.",
      inputSchema: { name: z.string().min(1) },
    },
    async ({ name }) => {
      const matches = await swapi.searchPeople(name);
      return text(
        matches.length
          ? JSON.stringify(matches, null, 2)
          : "No matching people."
      );
    }
  );

  mcp.registerTool(
    "getFilm",
    {
      description: "Look up a Star Wars film by swapi.info id. 1 is A New Hope.",
      inputSchema: { id: z.number().int().min(1) },
    },
    async ({ id }) => text(JSON.stringify(await swapi.getFilm(id), null, 2))
  );

  mcp.registerTool(
    "getPlanet",
    {
      description:
        "Look up a Star Wars planet by swapi.info id. 1 is Tatooine.",
      inputSchema: { id: z.number().int().min(1) },
    },
    async ({ id }) => text(JSON.stringify(await swapi.getPlanet(id), null, 2))
  );
}