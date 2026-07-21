import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["tests/e2e/**", "node_modules/**"],
    /*
     * Why this block exists: a default-configured run reported
     * `Test Files 13 passed (13)` while simultaneously emitting 12
     * `[vitest-pool]: Failed to start worker` /
     * `Timeout waiting for worker to respond` errors. Roughly half the
     * suite never executed a single assertion, yet the summary line still
     * read like a pass — so CI was reporting green on a half-dark suite.
     *
     * Root cause, measured rather than guessed: constructing the jsdom
     * environment costs ~4s per test file on this machine even with zero
     * contention (`npx vitest run components/ui/button.test.tsx` ->
     * `environment 4.07s`). Vitest's worker-startup timeout is a hardcoded
     * 60s constant, not a configurable option. With the default worker
     * count, ~25 workers each paying that cost while contending for the
     * same disk pushed startup past 60s for about half of them. Switching
     * pool type alone did not help — `forks` and `threads` both failed the
     * same way, which is what ruled the pool out as the cause.
     *
     * The fix is `maxWorkers: 4` — capping how many workers fight over the
     * disk while booting. On this suite the environment cost dominates, so
     * more workers made startup slower and less reliable, not faster.
     *
     * `isolate: false` was tried first and rejected: it does make all 25
     * files run, but @testing-library/react's automatic per-test DOM
     * cleanup does not survive a shared module registry, so renders leak
     * across files and 23 tests fail with `getMultipleElementsFound`.
     * Isolation stays on. Do not turn it off to make the suite faster.
     */
    pool: "threads",
    maxWorkers: 4,
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
