import { buildMetadata } from "@/config/seo";
import { AssistantChat } from "@/app/(app)/assistant/chat";

export const metadata = buildMetadata({
  title: "Ask Skinwise",
  description:
    "Ask the Skinwise assistant about ingredients, skin concerns and routines — and find the right next step with a real expert.",
  path: "/assistant",
});

/**
 * Customer-facing AI assistant. Grounded on Skinwise's own content, with the
 * safety boundary and CTAs handled server-side (see lib/ai). The page is a
 * thin shell around the client chat.
 */
export default function AssistantPage() {
  return <AssistantChat />;
}
