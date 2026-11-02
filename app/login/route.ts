// 302s the browser to Auth0's /authorize with PKCE. The verifier and the
// state ride httpOnly cookies back to /callback; no client secret, ever.

import { NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN ?? "";
const CLIENT_ID = process.env.AUTH0_CLIENT_ID ?? "";
const AUDIENCE = process.env.AUTH0_AUDIENCE ?? "";
const BASE_URL = process.env.WEB_URL ?? "http://localhost:3000";

export async function GET() {
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const state = randomBytes(16).toString("base64url");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    audience: AUDIENCE,
    scope: "openid profile email",
    redirect_uri: `${BASE_URL}/callback`,
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
  });

  const res = NextResponse.redirect(`https://${AUTH0_DOMAIN}/authorize?${params}`);
  const cookie = { httpOnly: true, sameSite: "lax" as const, maxAge: 600, path: "/" };
  res.cookies.set("mcp_oauth_state", state, cookie);
  res.cookies.set("mcp_oauth_verifier", verifier, cookie);
  return res;
}