// Entry point: express plus the SDK's legacy SSE transport.
// GET /sse opens the event stream; POST /messages carries JSON-RPC upstream.
// No body parser on /messages: handlePostMessage reads the raw stream itself.

import "dotenv/config";
import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { registerTools } from "./tools.js";

const mcp = new McpServer({ name: "a0-mcp-demo", version: "0.1.0" });
registerTools(mcp);

const app = express();
const transports = new Map<string, SSEServerTransport>();

app.get("/sse", async (_req, res) => {
  const transport = new SSEServerTransport("/messages", res);
  transports.set(transport.sessionId, transport);
  console.log(`SSE session ${transport.sessionId} opened`);
  res.on("close", () => {
    transports.delete(transport.sessionId);
    console.log(`SSE session ${transport.sessionId} closed`);
  });
  await mcp.connect(transport);
});

app.post("/messages", async (req, res) => {
  const id = String(req.query.sessionId ?? "");
  const transport = transports.get(id);
  if (!transport) {
    res.status(400).send("Unknown SSE session");
    return;
  }
  await transport.handlePostMessage(req, res);
});

const port = Number(process.env.MCP_PORT ?? 3001);
app.listen(port, () => {
  console.log(`a0-mcp-demo listening; SSE at http://localhost:${port}/sse`);
});