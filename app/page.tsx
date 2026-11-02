"use client";

// The home page reads session state through the same /api/auth-status the MCP
// server polls. One source of truth; module state is not trusted across
// dev-mode route boundaries (RSC page and route handlers hold separate module
// instances in the dev sandbox).

import Link from "next/link";
import { useEffect, useState } from "react";

interface Status {
  authenticated: boolean;
}

export default function Home() {
  const [status, setStatus] = useState<"unknown" | "active" | "none">("unknown");

  useEffect(() => {
    fetch("/api/auth-status")
      .then((r) => r.json() as Promise<Status>)
      .then((d) => setStatus(d.authenticated ? "active" : "none"))
      .catch(() => setStatus("none"));
  }, []);

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 480, padding: "2rem" }}>
      <h1>a0-mcp-demo</h1>
      <p>
        {status === "unknown" && "Checking session..."}
        {status === "active" && "Session: active. The MCP server's tools are unlocked."}
        {status === "none" && "Session: none. The MCP server's tools are locked."}
      </p>
      <p style={{ display: "flex", gap: "1rem" }}>
        <a href="/login">Log in</a>
        <a href="/logout">Log out</a>
      </p>
    </main>
  );
}