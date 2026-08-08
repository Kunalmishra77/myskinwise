import { listScansToReview, reviewSummary } from "@/lib/expert/reviews";
import { ReviewCard } from "@/app/admin/review/review-card";

export const dynamic = "force-dynamic";

/**
 * Dermatologist face-validity review (Phase 9, blueprint §11.3). A reviewer
 * rates each concern's read as accurate / partial / wrong across scans. Target:
 * >=70% accurate, <=10% wrong. This is a sanity check, NOT a clinical study.
 */
export default async function ReviewPage() {
  const [scans, summary] = await Promise.all([listScansToReview(), reviewSummary()]);
  const total = summary.accurate + summary.partial + summary.wrong;
  const pct = (n: number) => (total ? Math.round((100 * n) / total) : 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Face-validity review</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Rate each concern against the photo. Target: ≥70% accurate, ≤10% wrong (Beta calibration).
          </p>
        </div>
        {total > 0 && (
          <div className="flex gap-3 text-center">
            <div className="rounded-2xl bg-sage/30 px-4 py-2.5">
              <p className="font-display text-2xl font-semibold text-ink">{pct(summary.accurate)}%</p>
              <p className="text-xs text-ink-soft">accurate</p>
            </div>
            <div className="rounded-2xl bg-rose-ink px-4 py-2.5 text-white">
              <p className="font-display text-2xl font-semibold">{pct(summary.wrong)}%</p>
              <p className="text-xs">wrong</p>
            </div>
            <div className="rounded-2xl bg-champagne/50 px-4 py-2.5">
              <p className="font-display text-2xl font-semibold text-ink">{summary.reviewed}</p>
              <p className="text-xs text-ink-soft">scans reviewed</p>
            </div>
          </div>
        )}
      </div>

      {scans.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-surface p-6 text-sm text-ink-soft">
          No scans with a stored photo yet. New engine scans appear here as people use the scanner.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {scans.map((s) => (
            <ReviewCard key={s.id} scan={s} />
          ))}
        </div>
      )}
    </div>
  );
}
