import { buildMetadata } from "@/config/seo";
import { CartView } from "@/app/(app)/cart/cart-view";

export const metadata = buildMetadata({
  title: "Your cart",
  description: "Review the formulations in your cart and continue to checkout.",
  path: "/cart",
});

export default function CartPage() {
  return <CartView />;
}
