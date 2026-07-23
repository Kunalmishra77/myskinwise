import { getExpertStore } from "@/lib/expert/storage";
import { OrderRow } from "@/app/admin/orders/order-row";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const store = getExpertStore();
  const orders = store ? await store.listOrders() : [];

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Orders</h1>
      <p className="mt-1 text-sm text-ink-soft">{orders.length} total.</p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-left text-xs uppercase tracking-wide text-ink-soft">
              <th className="py-2 pr-4">Consultation</th>
              <th className="py-2 pr-4">Customer</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Update</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <OrderRow key={o.id} order={o} />
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-ink-soft">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
