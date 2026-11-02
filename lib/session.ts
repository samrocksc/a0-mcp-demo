// The session lives in a gitignored file at the repo root. Next dev churns
// module registries and worker processes, so nothing held in memory (module
// scope or globalThis) survives long enough to hold a session; the file does.
// A production deployment swaps this store for something real and shared.

import path from "node:path";
import { readFile, unlink, writeFile } from "node:fs/promises";

export interface Tokens {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  expires_in?: number;
}

interface Held {
  accessToken?: string;
}

const FILE = path.join(process.cwd(), ".session.json");

export async function getHeldToken(): Promise<string | undefined> {
  try {
    const raw = JSON.parse(await readFile(FILE, "utf8")) as Held;
    return raw.accessToken;
  } catch {
    return undefined;
  }
}

export async function holdSession(tokens: Tokens): Promise<void> {
  await writeFile(FILE, JSON.stringify({ accessToken: tokens.access_token } satisfies Held));
}

export async function clearSession(): Promise<void> {
  await unlink(FILE).catch(() => undefined);
}

// Polls the holder every second until a token appears or the window closes.
export async function waitForSession(maxMs: number): Promise<string | undefined> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const token = await getHeldToken();
    if (token) return token;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return undefined;
}