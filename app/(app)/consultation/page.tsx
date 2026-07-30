import { buildMetadata } from "@/config/seo";
import { ConsultationLookup } from "@/app/(app)/consultation/lookup";
import { CONSULTATION } from "@/content/i18n/assistant-ui";
import { T } from "@/components/i18n/t";

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
      <h1 className="font-display text-display font-semibold text-ink"><T>{CONSULTATION.pageTitle}</T></h1>
      <p className="mt-3 text-ink-soft">
        <T>{CONSULTATION.pageIntro}</T>
      </p>
      <ConsultationLookup />
    </div>
  );
}
