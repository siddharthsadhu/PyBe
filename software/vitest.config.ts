import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: false,
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/architecture/fixtures/**"],
    reporters: ["verbose"],
  },
  resolve: {
    // Use source directly so tests run without building first.
    alias: [
      // Subpath imports: @cklis/contracts/public-api -> contracts/src/public-api/index.ts
      {
        find: /^@cklis\/contracts\/(.*)$/,
        replacement: resolve(__dirname, "contracts/src/$1/index.ts"),
      },
      // Bare import: @cklis/contracts -> contracts/src/index.ts
      {
        find: /^@cklis\/contracts$/,
        replacement: resolve(__dirname, "contracts/src/index.ts"),
      },
    ],
  },
});
