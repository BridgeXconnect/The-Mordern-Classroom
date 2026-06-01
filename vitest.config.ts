import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

/**
 * Unit-test config. Tests target pure logic in `lib/` (scoring, validation,
 * parsing helpers) — no DB, network, or React rendering — so the default Node
 * environment is sufficient and fast. The `@/` alias mirrors tsconfig.json.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globals: true,
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts"],
      exclude: ["lib/db.ts", "lib/**/*.tsx", "lib/prompts/**"],
    },
  },
});
