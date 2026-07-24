import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Guards two defects found by running the real expert workflow against
 * production during the audit, both of which reported success while doing
 * something wrong.
 *
 * These are asserted against the source rather than a mocked Supabase client
 * because what went wrong was not logic the storage layer branches on — it
 * was a literal (`new Date(0)`) and a missing `.select()`. A mock deep enough
 * to catch either would mostly be asserting that supabase-js works. Reading
 * the source catches the exact regressions cheaply and states plainly what
 * must not come back.
 */
const EXPERT_STORAGE = readFileSync(
  path.resolve(process.cwd(), "lib/expert/storage.ts"),
  "utf-8",
);
const ANALYSIS_STORAGE = readFileSync(
  path.resolve(process.cwd(), "lib/analysis/storage.ts"),
  "utf-8",
);

describe("timestamps are the real time, never the epoch", () => {
  /*
   * Every one of these columns had been written as `new Date(0)`, so
   * published_at, assigned_at and consented_at all recorded 1 January 1970.
   * consented_at is the serious one: under the DPDP Act it is the record
   * that proves when a person agreed to face-photo analysis.
   */
  it("no storage module stamps a row with new Date(0)", () => {
    for (const [name, source] of [
      ["lib/expert/storage.ts", EXPERT_STORAGE],
      ["lib/analysis/storage.ts", ANALYSIS_STORAGE],
    ] as const) {
      const offenders = source
        .split("\n")
        .map((line, i) => [i + 1, line] as const)
        // Comment lines are excluded on purpose: the fixes explain the bug by
        // naming it, so the string legitimately survives in prose.
        .filter(([, line]) => {
          const trimmed = line.trimStart();
          const isComment = trimmed.startsWith("*") || trimmed.startsWith("//") || trimmed.startsWith("/*");
          return /new Date\(0\)/.test(line) && !isComment;
        });
      expect(offenders.map(([n]) => `${name}:${n}`), `${name} writes an epoch timestamp`).toEqual([]);
    }
  });

  it("writes published_at, assigned_at and consented_at from the current time", () => {
    expect(EXPERT_STORAGE).toMatch(/published_at:\s*new Date\(\)\.toISOString\(\)/);
    expect(EXPERT_STORAGE).toMatch(/assigned_at:\s*new Date\(\)\.toISOString\(\)/);
    expect(ANALYSIS_STORAGE).toMatch(/consented_at:\s*new Date\(\)\.toISOString\(\)/);
  });
});

describe("a guarded update never reports success for zero rows", () => {
  /*
   * Both mutations narrow by status so they are idempotent — publish only
   * applies to a draft, assign only to a requested or scheduled
   * consultation. Supabase does not treat "matched nothing" as an error, so
   * checking only `error` meant publishing an already-published regimen
   * returned true to the expert having changed nothing at all. That is the
   * precise false-success this codebase forbids everywhere else.
   */
  function body(fn: string): string {
    const start = EXPERT_STORAGE.indexOf(`async ${fn}(`);
    expect(start, `${fn} not found`).toBeGreaterThan(-1);
    return EXPERT_STORAGE.slice(start, start + 1400);
  }

  for (const fn of ["publishRegimen", "assignExpert"]) {
    it(`${fn} asks the update which rows it touched`, () => {
      const source = body(fn);
      // Must destructure data, not error alone, and must ask for rows back.
      expect(source).toMatch(/const \{ data, error \}/);
      expect(source).toMatch(/\.select\(/);
      expect(source).toMatch(/data\.length === 0/);
    });

    it(`${fn} does not return false only on a transport error`, () => {
      expect(body(fn)).not.toMatch(/if \(error\) return false;/);
    });
  }
});
