// Exchanges the authorization code for tokens and holds them in server
// memory. Public client: only the verifier cookie proves this browser started
// the login; no client secret appears anywhere.

import { NextResponse, type NextRequest } from "next/server";
import { holdSession } from "../../lib/session";

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN ?? "";
const CLIENT_ID = process.env.AUTH0_CLIENT_ID ?? "";
const BASE_URL = process.env.WEB_URL ?? "http://localhost:3000";

export async function GET(req: NextRequest) {
  // Auth0 can send an error back instead of a code; surface it honestly.
  const idpError = req.nextUrl.searchParams.get("error");
  if (idpError) {
    const description = req.nextUrl.searchParams.get("error_description") ?? idpError;
    console.error(`[callback] IdP said no: ${idpError} - ${description}`);
    return NextResponse.json({ error: idpError, description }, { status: 400 });
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const cookieState = req.cookies.get("mcp_oauth_state")?.value;
  const verifier = req.cookies.get("mcp_oauth_verifier")?.value;

  if (!code || !verifier || !state || !cookieState || state !== cookieState) {
    return NextResponse.json(
      { error: "state mismatch. Login through the server's /login link, not directly." },
      { status: 400 }
    );
  }

  const res0 = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      code,
      code_verifier: verifier,
      redirect_uri: `${BASE_URL}/callback`,
    }),
  });

  const tokens = (await res0.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!tokens.access_token) {
    return NextResponse.json(
      { error: tokens.error_description ?? tokens.error ?? "token exchange failed" },
      { status: 502 }
    );
  }

  const accessToken: string = tokens.access_token;
  await holdSession({ access_token: accessToken });

  const res = NextResponse.redirect(`${BASE_URL}/`);
  res.cookies.delete("mcp_oauth_state");
  res.cookies.delete("mcp_oauth_verifier");
  return res;
}