// POST /api/messages?sessionId=...: carries JSON-RPC upstream to its stream.
// No body parser here: handlePostMessage reads the raw request stream itself;
// a parser would consume the body and the transport would hang forever.

import type { NextApiRequest, NextApiResponse } from "next";
import { transports } from "../../lib/mcp";

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).end("messages is a POST route");
    return;
  }

  const id = String(req.query.sessionId ?? "");
  const transport = transports.get(id);
  if (!transport) {
    res.status(400).send("Unknown SSE session");
    return;
  }
  await transport.handlePostMessage(req, res);
}