import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.{ts,mjs}", "tests/**/*.test.{ts,mjs}"],
  },
});
