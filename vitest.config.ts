import { defineConfig } from "vitest/config";
import type { Plugin } from "vite";

function stripShebang(): Plugin {
  return {
    name: "strip-shebang",
    transform(code) {
      if (code.startsWith("#!")) {
        return { code: code.replace(/^#!.*\r?\n/, ""), map: null };
      }
    },
  };
}

export default defineConfig({
  plugins: [stripShebang()],
  test: {
    include: ["src/**/*.test.{ts,mjs}", "tests/**/*.test.{ts,mjs}"],
  },
});
