// The browser-facing window on the session truth: one boolean, nothing more.

import { NextResponse } from "next/server";
import { getHeldToken } from "../../../lib/session";

export async function GET() {
  return NextResponse.json({ authenticated: Boolean(await getHeldToken()) });
}