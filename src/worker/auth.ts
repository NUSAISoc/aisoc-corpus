export const ADMIN_SESSION_COOKIE = "corpus_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

export interface AdminSession {
  sub: "admin";
  exp: number;
}

export interface PasswordConfig {
  passwordHash?: string;
  password?: string;
}

export interface SessionConfig {
  sessionSecret?: string;
  now?: number;
}

const encoder = new TextEncoder();

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function base64UrlEncode(value: string): string {
  return btoa(value)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );
  return atob(padded);
}

function timingSafeEqual(left: string, right: string): boolean {
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let mismatch = leftBytes.length === rightBytes.length ? 0 : 1;

  for (let index = 0; index < length; index += 1) {
    mismatch |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }

  return mismatch === 0;
}

async function sign(payload: string, secret: string): Promise<string> {
  return sha256Hex(`${payload}.${secret}`);
}

export async function verifyAdminPassword(
  candidate: string,
  config: PasswordConfig,
): Promise<boolean> {
  if (!candidate) {
    return false;
  }

  if (config.passwordHash) {
    const candidateHash = await sha256Hex(candidate);
    return timingSafeEqual(candidateHash, config.passwordHash.toLowerCase());
  }

  if (config.password) {
    return timingSafeEqual(candidate, config.password);
  }

  return false;
}

export function hasPasswordConfig(config: PasswordConfig): boolean {
  return Boolean(config.passwordHash || config.password);
}

export function hasSessionConfig(config: SessionConfig): boolean {
  return Boolean(config.sessionSecret);
}

export async function createAdminSession(
  config: SessionConfig,
): Promise<string> {
  if (!config.sessionSecret) {
    throw new Error("SESSION_SECRET is required for admin sessions.");
  }

  const now = config.now ?? Math.floor(Date.now() / 1000);
  const payload = base64UrlEncode(
    JSON.stringify({ sub: "admin", exp: now + SESSION_TTL_SECONDS }),
  );
  const signature = await sign(payload, config.sessionSecret);
  return `${payload}.${signature}`;
}

export async function readAdminSession(
  token: string | undefined,
  config: SessionConfig,
): Promise<AdminSession | null> {
  if (!token || !config.sessionSecret) {
    return null;
  }

  const [payload, signature] = token.split(".");
  if (!payload || !signature) {
    return null;
  }

  const expected = await sign(payload, config.sessionSecret);
  if (!timingSafeEqual(signature, expected)) {
    return null;
  }

  try {
    const session = JSON.parse(base64UrlDecode(payload)) as AdminSession;
    const now = config.now ?? Math.floor(Date.now() / 1000);
    if (session.sub !== "admin" || session.exp <= now) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function parseCookies(header: string | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) {
    return cookies;
  }

  for (const segment of header.split(";")) {
    const [name, ...valueParts] = segment.trim().split("=");
    if (name && valueParts.length > 0) {
      cookies[name] = decodeURIComponent(valueParts.join("="));
    }
  }

  return cookies;
}

export function sessionCookie(token: string): string {
  return `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function expiredSessionCookie(): string {
  return `${ADMIN_SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}
