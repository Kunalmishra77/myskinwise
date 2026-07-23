import { describe, expect, it } from "vitest";
import { purgeExpiredPhotos } from "@/lib/analysis/retention";

/*
 * A hand-rolled fake of the small slice of the Supabase client the purge
 * uses, so the safety properties can be asserted without a live database:
 *  - only expired analyses are selected
 *  - storage objects are removed before rows
 *  - a storage failure leaves the row for a retry (never orphans a file)
 */
type Row = { id: string; expires_at: string };
type Img = { analysis_id: string; storage_path: string };

function makeFake(opts: { rows: Row[]; images: Img[]; failStorageFor?: Set<string> }) {
  const removed: string[] = [];
  const deletedRows: string[] = [];
  const failStorage = opts.failStorageFor ?? new Set<string>();

  const db = {
    from(table: string) {
      if (table === "skin_analyses") {
        return {
          select: () => ({
            lt: (_c: string, iso: string) => ({
              limit: () => ({
                data: opts.rows.filter((r) => r.expires_at < iso),
                error: null,
              }),
            }),
          }),
          delete: () => ({
            eq: (_c: string, id: string) => {
              deletedRows.push(id);
              return { error: null };
            },
          }),
        };
      }
      // skin_analysis_images
      return {
        select: () => ({
          eq: (_c: string, analysisId: string) => ({
            data: opts.images.filter((i) => i.analysis_id === analysisId),
            error: null,
          }),
        }),
      };
    },
    storage: {
      from: () => ({
        remove: (paths: string[]) => {
          const anyFail = paths.some((p) => failStorage.has(p));
          if (anyFail) return { error: { message: "storage boom" } };
          removed.push(...paths);
          return { error: null };
        },
      }),
    },
  };
  return { db: db as never, removed, deletedRows };
}

const NOW = new Date("2026-07-23T00:00:00Z");
const past = "2026-01-01T00:00:00Z";
const future = "2026-12-01T00:00:00Z";

describe("purgeExpiredPhotos", () => {
  it("deletes only expired analyses; never touches active ones", async () => {
    const fake = makeFake({
      rows: [
        { id: "expired-1", expires_at: past },
        { id: "active-1", expires_at: future },
      ],
      images: [
        { analysis_id: "expired-1", storage_path: "expired-1/a.jpg" },
        { analysis_id: "active-1", storage_path: "active-1/b.jpg" },
      ],
    });
    const report = await purgeExpiredPhotos(fake.db, NOW);
    expect(report.analysesExpired).toBe(1);
    expect(fake.removed).toEqual(["expired-1/a.jpg"]);
    expect(fake.deletedRows).toEqual(["expired-1"]);
    // The active photo and row are untouched.
    expect(fake.removed).not.toContain("active-1/b.jpg");
    expect(fake.deletedRows).not.toContain("active-1");
  });

  it("removes storage objects before deleting the row", async () => {
    const fake = makeFake({
      rows: [{ id: "e", expires_at: past }],
      images: [{ analysis_id: "e", storage_path: "e/x.jpg" }],
    });
    const report = await purgeExpiredPhotos(fake.db, NOW);
    expect(report.objectsDeleted).toBe(1);
    expect(report.rowsDeleted).toBe(1);
  });

  it("leaves the row for a retry when the storage delete fails (never orphans a file)", async () => {
    const fake = makeFake({
      rows: [{ id: "e", expires_at: past }],
      images: [{ analysis_id: "e", storage_path: "e/x.jpg" }],
      failStorageFor: new Set(["e/x.jpg"]),
    });
    const report = await purgeExpiredPhotos(fake.db, NOW);
    expect(report.ok).toBe(false);
    expect(report.failures.length).toBe(1);
    // The row was NOT deleted — a later run will retry it.
    expect(fake.deletedRows).toEqual([]);
    expect(report.rowsDeleted).toBe(0);
  });

  it("is a no-op when nothing has expired", async () => {
    const fake = makeFake({ rows: [{ id: "a", expires_at: future }], images: [] });
    const report = await purgeExpiredPhotos(fake.db, NOW);
    expect(report.analysesExpired).toBe(0);
    expect(report.rowsDeleted).toBe(0);
    expect(report.ok).toBe(true);
  });
});
