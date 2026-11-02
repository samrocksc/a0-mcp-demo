// GET /api/sse: opens the SSE stream. The SDK transport needs raw Node
// req/res; pages API routes hand exactly those over. bodyParser: false so the
// transport's POST route (below) can read its own raw stream.

import type { NextApiRequest, NextApiResponse } from "next";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { mcp, transports } from "../../lib/mcp";

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.status(405).end("SSE is a GET route");
    return;
  }

  const transport = new SSEServerTransport("/api/messages", res);
  transports.set(transport.sessionId, transport);
  console.log(`SSE session ${transport.sessionId} opened`);
  res.on("close", () => {
    transports.delete(transport.sessionId);
    console.log(`SSE session ${transport.sessionId} closed`);
  });
  await mcp.connect(transport);
}