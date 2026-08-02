const SESSION_COOKIE = "aisoc_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;
const encoder = new TextEncoder();

function base64UrlEncode(value: string): string {
  let binary = "";
  for (const byte of encoder.encode(value)) binary += String.fromCharCode(byte);
  return btoa(binary)
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

async function digestHex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacHex(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(value),
  );
  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1)
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function readCookie(request: Request, name: string): string {
  const header = request.headers.get("Cookie") || "";
  for (const cookie of header.split(";")) {
    const [key, ...rest] = cookie.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return "";
}

export async function verifyAdminPassword(
  password: unknown,
  configuredPassword: string | undefined,
): Promise<boolean> {
  if (typeof password !== "string" || !configuredPassword) return false;
  const [candidateHash, configuredHash] = await Promise.all([
    digestHex(password),
    digestHex(configuredPassword),
  ]);
  return safeEqual(candidateHash, configuredHash);
}

export async function createAdminSessionCookie(
  sessionSecret: string,
  now = Date.now(),
): Promise<string> {
  const payload = {
    iat: Math.floor(now / 1000),
    exp: Math.floor(now / 1000) + SESSION_TTL_SECONDS,
  };
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = await hmacHex(sessionSecret, body);
  return `${SESSION_COOKIE}=${body}.${signature}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; Secure; SameSite=Strict`;
}

export async function verifyAdminSession(
  request: Request,
  sessionSecret: string | undefined,
  now = Date.now(),
): Promise<boolean> {
  if (!sessionSecret) return false;
  const token = readCookie(request, SESSION_COOKIE);
  const [body, signature] = token.split(".");
  if (!body || !signature) return false;
  if (!safeEqual(signature, await hmacHex(sessionSecret, body))) return false;

  try {
    const payload = JSON.parse(base64UrlDecode(body)) as { exp?: number };
    return Number(payload.exp) > Math.floor(now / 1000);
  } catch {
    return false;
  }
}

export function clearAdminSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}
