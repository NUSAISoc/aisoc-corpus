import { describe, expect, test } from "vitest";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSession,
  parseCookies,
  readAdminSession,
  sessionCookie,
  sha256Hex,
  verifyAdminPassword,
} from "./auth";

describe("admin auth", () => {
  test("verifies configured password hashes without storing plaintext", async () => {
    const passwordHash = await sha256Hex("signal-deck-test");

    await expect(
      verifyAdminPassword("signal-deck-test", { passwordHash }),
    ).resolves.toBe(true);
    await expect(verifyAdminPassword("wrong", { passwordHash })).resolves.toBe(
      false,
    );
  });

  test("rejects tampered and expired sessions", async () => {
    const token = await createAdminSession({
      sessionSecret: "test-secret",
      now: 100,
    });

    await expect(
      readAdminSession(token, { sessionSecret: "test-secret", now: 101 }),
    ).resolves.toMatchObject({ sub: "admin" });
    await expect(
      readAdminSession(`${token}x`, { sessionSecret: "test-secret", now: 101 }),
    ).resolves.toBeNull();
    await expect(
      readAdminSession(token, {
        sessionSecret: "test-secret",
        now: 60 * 60 * 9,
      }),
    ).resolves.toBeNull();
  });

  test("parses the signed session cookie", async () => {
    const token = await createAdminSession({ sessionSecret: "cookie-secret" });
    const cookies = parseCookies(sessionCookie(token));

    expect(cookies[ADMIN_SESSION_COOKIE]).toBe(token);
  });
});
