"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

const STATUSES = ["pending", "confirmed", "fulfilled", "shipped", "cancelled"];

export function OrderRow({
  order,
}: {
  order: { id: string; status: string; reference: string; leadName: string };
}) {
  const router = useRouter();
  const [status, setStatus] = React.useState(order.status);
  const [busy, setBusy] = React.useState(false);

  // The expert id travels with the request only to attribute the audit
  // entry; the middleware has already authorised the caller. A single
  // seeded expert exists today, so the workspace supplies the id — this
  // row inherits whatever the API accepts.
  async function update(next: string) {
    setBusy(true);
    const res = await fetch("/api/v1/admin/actions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "orderStatus", orderId: order.id, status: next, expertId: "00000000-0000-0000-0000-000000000000" }),
    });
    setBusy(false);
    if (res.ok) {
      setStatus(next);
      router.refresh();
    }
  }

  return (
    <tr className="border-b border-ink/5">
      <td className="py-3 pr-4 font-semibold text-rose-ink">{order.reference}</td>
      <td className="py-3 pr-4 text-ink">{order.leadName}</td>
      <td className="py-3 pr-4 text-ink-soft">{status}</td>
      <td className="py-3 pr-4">
        <select
          value={status}
          disabled={busy}
          onChange={(e) => update(e.target.value)}
          className="rounded-lg border border-ink/15 px-2 py-1.5 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </td>
    </tr>
  );
}
