import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: false,
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/architecture/fixtures/**"],
    reporter: ["verbose"],
  },
  resolve: {
    alias: {
      // Use source directly so tests run without building first
      "@cklis/contracts": resolve(__dirname, "contracts/src/index.ts"),
    },
  },
});
