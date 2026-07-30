import { buildMetadata } from "@/config/seo";
import { CheckoutFlow } from "@/app/(app)/checkout/checkout-flow";

export const metadata = buildMetadata({
  title: "Checkout",
  description: "Review your order and send it to the Skinwise team on WhatsApp.",
  path: "/checkout",
});

export default function CheckoutPage() {
  return <CheckoutFlow />;
}
