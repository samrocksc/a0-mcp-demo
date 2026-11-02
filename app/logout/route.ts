// Drops the server-held session, then walks the browser through Auth0's
// global logout so the IdP session dies with it.

import { NextResponse } from "next/server";
import { clearSession } from "../../lib/session";

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN ?? "";
const CLIENT_ID = process.env.AUTH0_CLIENT_ID ?? "";
const BASE_URL = process.env.WEB_URL ?? "http://localhost:3000";

export async function GET() {
  clearSession();
  const params = new URLSearchParams({
    returnTo: `${BASE_URL}/logged-out`,
    client_id: CLIENT_ID,
  });
  return NextResponse.redirect(`https://${AUTH0_DOMAIN}/v2/logout?${params}`);
}