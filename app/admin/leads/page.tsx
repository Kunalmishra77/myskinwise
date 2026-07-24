import Link from "next/link";
import { getLeadStore, STAGE_LABELS, SOURCE_LABELS, type LeadStage } from "@/lib/expert/leads";

export const dynamic = "force-dynamic";

/**
 * Every person who has given Skinwise their contact details, newest first.
 *
 * This page exists because the console previously started at Consultations,
 * which is several steps into the funnel. Live data at the time of the audit:
 * 12 leads, 12 assessments, 1 consultation — so eleven people had completed a
 * Skin Check, handed over a name and phone number, and were invisible to the
 * team. They were being stored correctly the whole time; nothing displayed
 * them.
 *
 * Sorted newest-first and headed by an "awaiting first contact" count,
 * because the useful question on opening this screen is not "how many leads
 * do we have" but "who has nobody spoken to yet".
 */

const STAGE_TONE: Record<LeadStage, string> = {
  new: "bg-champagne text-ink",
  skin_check_completed: "bg-blush text-rose-ink",
  skin_scan_completed: "bg-blush text-rose-ink",
  consultation_requested: "bg-sage/25 text-ink",
  expert_review: "bg-sage/30 text-ink",
  regimen_published: "bg-sage/50 text-ink",
  order_created: "bg-ink/10 text-ink",
  order_shipped: "bg-ink/10 text-ink",
};

function timeAgo(iso: string, now: number): string {
  const mins = Math.round((now - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

/**
 * Loads the screen's data.
 *
 * Kept outside the component because reading the clock is impure, and the
 * lint rule that enforces render purity is right to flag it there. The page
 * is force-dynamic, so this runs per request.
 */
async function load() {
  const store = getLeadStore();
  if (!store) return { store: null, leads: [], newToday: 0, now: 0 };
  const now = Date.now();
  const [leads, newToday] = await Promise.all([
    store.listLeads(),
    store.countNewSince(new Date(now - 24 * 60 * 60 * 1000)),
  ]);
  return { store, leads, newToday, now };
}

export default async function LeadsPage() {
  const { store, leads, newToday, now } = await load();
  const awaiting = leads.filter((l) => l.needsAction).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Leads</h1>
          <p className="mt-1 text-sm text-ink-soft">{leads.length} total, newest first.</p>
        </div>

        {/*
          The two numbers that decide whether anyone needs to do something
          right now. "Awaiting first contact" is the one that matters: a lead
          with no consultation is revenue nobody has touched.
        */}
        <div className="flex gap-3">
          <div className="rounded-2xl bg-champagne/50 px-4 py-2.5">
            <p className="font-display text-2xl font-semibold text-ink">{newToday}</p>
            <p className="text-xs text-ink-soft">new in 24h</p>
          </div>
          <div
            className={`rounded-2xl px-4 py-2.5 ${awaiting > 0 ? "bg-rose-ink text-white" : "bg-sage/30 text-ink"}`}
          >
            <p className="font-display text-2xl font-semibold">{awaiting}</p>
            <p className={`text-xs ${awaiting > 0 ? "text-white" : "text-ink-soft"}`}>
              awaiting first contact
            </p>
          </div>
        </div>
      </div>

      {!store && (
        <p className="mt-6 rounded-2xl bg-champagne/40 p-4 text-sm text-ink">
          Database not configured on this server.
        </p>
      )}

      {store && leads.length === 0 && (
        <p className="mt-6 rounded-2xl bg-surface p-6 text-sm text-ink-soft">
          No leads yet. A lead is created the moment someone completes a Skin Check or requests a
          consultation.
        </p>
      )}

      {leads.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left text-xs uppercase tracking-wide text-ink-soft">
                <th className="py-2 pr-4">Customer</th>
                <th className="py-2 pr-4">Contact</th>
                <th className="py-2 pr-4">Source</th>
                <th className="py-2 pr-4">Stage</th>
                <th className="py-2 pr-4">Concern</th>
                <th className="py-2 pr-4">Arrived</th>
                <th className="py-2 pr-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className={`border-b border-ink/5 ${lead.needsAction ? "bg-champagne/20" : ""}`}
                >
                  <td className="py-3 pr-4">
                    <span className="font-semibold text-ink">{lead.name}</span>
                    {lead.needsAction && (
                      <span className="ml-2 rounded-full bg-rose-ink px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                        New
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    {/* A real phone link: the next action is almost always to
                        call or message this person. */}
                    <a href={`tel:${lead.phone}`} className="text-ink hover:text-rose-ink">
                      {lead.phone}
                    </a>
                    {lead.email && <p className="text-xs text-ink-soft">{lead.email}</p>}
                  </td>
                  <td className="py-3 pr-4 text-ink-soft">{SOURCE_LABELS[lead.source]}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STAGE_TONE[lead.stage]}`}
                    >
                      {STAGE_LABELS[lead.stage]}
                    </span>
                    {lead.scanCount > 0 && (
                      <span className="ml-1.5 text-xs text-ink-soft">
                        {lead.scanCount} scan{lead.scanCount > 1 ? "s" : ""}
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 capitalize text-ink-soft">{lead.concern ?? "—"}</td>
                  <td className="py-3 pr-4 text-ink-soft">{timeAgo(lead.createdAt, now)}</td>
                  <td className="py-3 pr-4">
                    {lead.consultationId ? (
                      <Link
                        href={`/admin/consultations/${lead.consultationId}`}
                        className="font-semibold text-rose-ink hover:underline"
                      >
                        Open {lead.reference}
                      </Link>
                    ) : (
                      <span className="text-ink-soft">No consultation yet</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 text-xs text-ink-soft">
        Contact details are shown because acting on them is the purpose of this screen. Expert notes,
        verdicts and customer photographs are never listed here — open the consultation for those.
      </p>
    </div>
  );
}
