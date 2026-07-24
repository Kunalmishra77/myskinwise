import Link from "next/link";
import { getExpertStore } from "@/lib/expert/storage";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, string> = {
  requested: "bg-champagne text-ink",
  scheduled: "bg-blush text-rose-ink",
  in_review: "bg-blush text-rose-ink",
  reviewed: "bg-sage/25 text-ink",
  regimen_created: "bg-sage/40 text-ink",
  completed: "bg-ink/10 text-ink",
  cancelled: "bg-ink/5 text-ink-soft",
};

export default async function ConsultationsPage() {
  const store = getExpertStore();
  const consultations = store ? await store.listConsultations() : [];

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Consultations</h1>
      <p className="mt-1 text-sm text-ink-soft">{consultations.length} total, newest first.</p>

      {!store && (
        <p className="mt-6 rounded-2xl bg-champagne/40 p-4 text-sm text-ink">
          Database not configured on this server.
        </p>
      )}

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-left text-xs uppercase tracking-wide text-ink-soft">
              <th className="py-2 pr-4">Reference</th>
              <th className="py-2 pr-4">Customer</th>
              <th className="py-2 pr-4">Concern</th>
              <th className="py-2 pr-4">Prefers</th>
              <th className="py-2 pr-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {consultations.map((c) => (
              <tr key={c.id} className="border-b border-ink/5">
                <td className="py-3 pr-4">
                  <Link href={`/admin/consultations/${c.id}`} className="font-semibold text-rose-ink hover:underline">
                    {c.reference}
                  </Link>
                </td>
                <td className="py-3 pr-4 text-ink">{c.lead_name}</td>
                <td className="py-3 pr-4 text-ink-soft">{c.concern}</td>
                <td className="py-3 pr-4 text-ink-soft">{c.preferred_time ?? "—"}</td>
                <td className="py-3 pr-4">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_TONE[c.status] ?? "bg-ink/10"}`}>
                    {c.status.replace("_", " ")}
                  </span>
                </td>
              </tr>
            ))}
            {consultations.length === 0 && store && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-ink-soft">
                  No consultations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
