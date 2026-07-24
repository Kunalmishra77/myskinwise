import { buildMetadata } from "@/config/seo";
import { ConsultationLookup } from "@/app/(app)/consultation/lookup";

export const metadata = buildMetadata({
  title: "Your consultation",
  description: "Check the status of your Skinwise consultation and view your personalised routine.",
  path: "/consultation",
});

/**
 * Customer-facing consultation status + regimen view.
 *
 * No account is needed — the customer looks their consultation up with the
 * reference we sent them and the phone number they used. The regimen only
 * appears once an expert has published it; a draft is never visible here.
 */
export default function ConsultationPage() {
  return (
    <div className="mx-auto w-full max-w-xl px-5 py-10">
      <h1 className="font-display text-display font-semibold text-ink">Your consultation</h1>
      <p className="mt-3 text-ink-soft">
        Enter the reference we sent you and the mobile number from your Skin Check.
      </p>
      <ConsultationLookup />
    </div>
  );
}
