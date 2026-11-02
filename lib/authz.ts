// Verifies Auth0 access tokens with jose, once per tool call.
//
// Two traps the clan already bled on:
// 1) Auth0 stamps the token's iss with a trailing slash. Compare against the
//    issuer the discovery document publishes, never against the raw env string.
// 2) The audience must ride the /authorize request, or Auth0 mints
//    aud=client_id and verification fails here forever.

import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

const domain = process.env.AUTH0_DOMAIN ?? "";
const audience = process.env.AUTH0_AUDIENCE ?? "";

export const auth0Configured = Boolean(domain && audience);
const issuerUrl = domain ? `https://${domain}/` : null;

interface Discovery {
  issuer: string;
}

let issuerPromise: Promise<string> | undefined;

function loadIssuer(): Promise<string> {
  const base = issuerUrl;
  if (!base) {
    return Promise.reject(new Error("AUTH0_DOMAIN not set in .env"));
  }
  issuerPromise ??= fetch(`${base}.well-known/openid-configuration`).then(async (r) => {
    if (!r.ok) throw new Error(`discovery fetch failed: ${r.status}`);
    const d = (await r.json()) as Discovery;
    if (!d.issuer) throw new Error("discovery document has no issuer");
    return d.issuer;
  });
  return issuerPromise;
}

export interface Claims extends JWTPayload {
  sub: string;
  permissions?: string[];
}

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

export async function verifyToken(token: string): Promise<Claims> {
  const base = issuerUrl;
  if (!base || !audience) {
    throw new Error("Auth0 is not configured: set AUTH0_DOMAIN and AUTH0_AUDIENCE in .env");
  }
  jwks ??= createRemoteJWKSet(new URL(`${base}.well-known/jwks.json`));
  const issuer = await loadIssuer();
  const { payload } = await jwtVerify(token, jwks, { issuer, audience });
  return payload as Claims;
}