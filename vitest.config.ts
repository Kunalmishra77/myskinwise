import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

/*
 * Why this file is more configured than a default Vitest setup.
 *
 * The problem it fixes: a default-configured run reported
 * `Test Files 13 passed (13)` while simultaneously emitting 12
 * `[vitest-pool]: Failed to start worker` / `Timeout waiting for worker to
 * respond` errors. Roughly half the suite never executed a single
 * assertion, yet the summary line still read like a pass. A test suite
 * that reports green while silently skipping half of itself is worse than
 * no suite, because it is trusted.
 *
 * Root cause, measured rather than guessed: constructing the jsdom
 * environment costs ~4s per test file on this machine with zero contention
 * (`npx vitest run components/ui/button.test.tsx` reported
 * `environment 4.07s`). Vitest's worker-startup timeout is a hardcoded 60s
 * constant, not a configurable option, so once enough workers contend for
 * the same disk while booting, startup blows past it and those files are
 * dropped.
 *
 * Things tried and rejected, recorded so they are not retried:
 *  - Switching pool type. `forks` and `threads` failed identically, which
 *    is what ruled the pool out as the cause.
 *  - `pool: "vmThreads"`. Dramatically faster — 27s total, with jsdom
 *    construction dropping from ~105s to ~3s — and every file ran. But it
 *    shares a VM context between files, so DOM state leaks exactly as
 *    below and 30 tests fail. Speed is not worth a gate that lies.
 *  - `isolate: false`. It does make all 25 files run, but
 *    @testing-library/react's automatic per-test DOM cleanup does not
 *    survive a shared module registry: renders leak between files and 23
 *    tests fail with `getMultipleElementsFound`. Isolation stays on.
 *  - `maxWorkers: 4`. Passed once, then failed again harder (0 files run,
 *    362s) on a busier machine. It reduced the contention without removing
 *    the fragility, which made the suite flaky rather than fixed — the
 *    worst of both outcomes.
 *
 * The actual fix is the two settings below:
 *  - `fileParallelism: false` + `maxWorkers: 1` run every file through a
 *    single reused worker, so worker startup happens once per project
 *    instead of once per file. The 60s handshake stops being a race
 *    against disk contention. Note these must be repeated inside each
 *    project: project configs do NOT inherit pool or parallelism settings
 *    from the root `test` block, and silently fall back to a parallel
 *    `forks` pool if omitted.
 *  - `environment: "node"` by default, with jsdom opted into per project.
 *    Only component tests need a DOM; the content/config/lib tests are
 *    pure assertions over plain objects, and were each paying ~4s to build
 *    a browser environment they never touched.
 *
 * The result is slower per file than a healthy parallel run would be, and
 * that is the right trade: this is a correctness gate, and a gate that is
 * sometimes wrong is not a gate.
 *
 * HONEST RESIDUAL STATE — read before assuming this is fully solved.
 * On the Windows dev machine this was fixed on, roughly one run in three
 * still drops a single file to the 60s worker-start timeout under heavy
 * background I/O (three consecutive runs measured 22/22, 22/22, 21/22).
 * That is a large improvement on the 13/25-with-12-errors baseline but it
 * is not zero.
 *
 * What makes it acceptable rather than merely tolerated: the run FAILS
 * CLOSED. A dropped worker is an unhandled error, so the process exits 1
 * and CI goes red — verified directly. The suite can no longer report
 * success while silently skipping files, which was the actual defect. A
 * dropped file is now a visible flake to re-run, not invisible rot.
 *
 * If this becomes annoying rather than rare, the next lever is swapping
 * jsdom for happy-dom in the `dom` project (measured ~3s vs ~45s of
 * environment construction across the suite via the vmThreads experiment,
 * so the timeout stops being reachable at all). That is a dependency
 * change and a small behavioural risk, so it was not taken pre-emptively.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    exclude: ["tests/e2e/**", "node_modules/**"],
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 20_000,
    projects: [
      {
        plugins: [react()],
        resolve: { alias: { "@": path.resolve(__dirname, ".") } },
        test: {
          name: "node",
          globals: true,
          environment: "node",
          // Project configs do NOT inherit pool/parallelism from the root
          // `test` block — they must be repeated here, or the project
          // silently falls back to a parallel `forks` pool.
          pool: "threads",
          maxWorkers: 1,
          fileParallelism: false,
          include: ["content/**/*.test.ts", "config/**/*.test.ts", "lib/**/*.test.ts"],
        },
      },
      {
        plugins: [react()],
        resolve: { alias: { "@": path.resolve(__dirname, ".") } },
        test: {
          name: "dom",
          globals: true,
          environment: "jsdom",
          pool: "threads",
          maxWorkers: 1,
          fileParallelism: false,
          setupFiles: ["./vitest.setup.ts"],
          include: ["components/**/*.test.{ts,tsx}", "app/**/*.test.{ts,tsx}"],
        },
      },
    ],
  },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
