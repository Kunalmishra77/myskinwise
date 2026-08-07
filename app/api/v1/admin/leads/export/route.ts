import { getLeadStore, STAGE_LABELS, SOURCE_LABELS } from "@/lib/expert/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Downloads every lead as a CSV, for the sales team to work outside the console
 * (import into a spreadsheet or CRM). Lives under /api/v1/admin, so middleware
 * has already checked the admin session before this runs — no extra auth here.
 *
 * It reuses the SAME read model as the Leads screen, so the export can never
 * disagree with what the team sees on-screen.
 */

const COLUMNS = [
  "Name",
  "Phone",
  "Email",
  "Source",
  "Stage",
  "Concern",
  "Scans",
  "Consultation",
  "Awaiting first contact",
  "Created at",
] as const;

/** RFC-4180 field: quote it and double any internal quotes. */
function csvField(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET() {
  const store = getLeadStore();
  if (!store) {
    return new Response("Database not configured.", { status: 503 });
  }

  const leads = await store.listLeads(5000);
  const rows = leads.map((l) =>
    [
      l.name,
      l.phone,
      l.email ?? "",
      SOURCE_LABELS[l.source],
      STAGE_LABELS[l.stage],
      l.concern ?? "",
      l.scanCount,
      l.reference ?? "",
      l.needsAction ? "yes" : "no",
      l.createdAt,
    ]
      .map(csvField)
      .join(","),
  );

  // A BOM so Excel opens UTF-8 correctly (names may carry non-ASCII).
  const csv = "﻿" + [COLUMNS.map(csvField).join(","), ...rows].join("\r\n");
  const stamp = leads[0]?.createdAt?.slice(0, 10) ?? "export";

  return new Response(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="skinwise-leads-${stamp}.csv"`,
      "cache-control": "no-store",
    },
  });
}
