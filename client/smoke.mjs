// Scripted smoke client: connects over SSE, lists tools, calls all four, prints.
// Run with the server up: npm run smoke

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const transport = new SSEClientTransport(new URL("http://localhost:3001/sse"));
const mcp = new Client({ name: "a0-smoke", version: "0.1.0" });
await mcp.connect(transport);

const { tools } = await mcp.listTools();
console.log("tools:", tools.map((t) => t.name).sort().join(", "));

for (const [name, args] of [
  ["getPerson", { id: 1 }],
  ["searchPeople", { name: "skywalker" }],
  ["getFilm", { id: 1 }],
  ["getPlanet", { id: 1 }],
]) {
  const res = await mcp.callTool({ name, arguments: args });
  const text = res.content?.[0]?.text ?? "";
  console.log(`\n== ${name}(${JSON.stringify(args)}) ==`);
  console.log(res.isError ? `ERROR: ${text}` : text.slice(0, 220));
}

await mcp.close();