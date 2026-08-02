import { describe, expect, it } from "vitest";
import {
  clearAdminSessionCookie,
  createAdminSessionCookie,
  verifyAdminPassword,
  verifyAdminSession,
} from "./admin-auth";

describe("admin auth", () => {
  it("accepts only the configured admin password", async () => {
    await expect(
      verifyAdminPassword("correct horse", "correct horse"),
    ).resolves.toBe(true);
    await expect(
      verifyAdminPassword("wrong horse", "correct horse"),
    ).resolves.toBe(false);
  });

  it("signs and verifies an admin session cookie", async () => {
    const cookie = await createAdminSessionCookie(
      "session secret",
      Date.UTC(2026, 6, 1),
    );
    const request = new Request("https://example.com/admin/", {
      headers: { Cookie: cookie },
    });
    await expect(
      verifyAdminSession(request, "session secret", Date.UTC(2026, 6, 1)),
    ).resolves.toBe(true);
  });

  it("expires old sessions", async () => {
    const cookie = await createAdminSessionCookie(
      "session secret",
      Date.UTC(2026, 6, 1),
    );
    const request = new Request("https://example.com/admin/", {
      headers: { Cookie: cookie },
    });
    await expect(
      verifyAdminSession(request, "session secret", Date.UTC(2026, 6, 2)),
    ).resolves.toBe(false);
  });

  it("clears the admin cookie", () => {
    expect(clearAdminSessionCookie()).toContain("Max-Age=0");
  });
});
