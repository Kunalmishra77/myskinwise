import { Section } from "@/components/ui/section";

export interface ProcessStep {
  title: string;
  body: string;
}

export interface ProcessStepsProps {
  steps: ProcessStep[];
  heading?: string;
}

/**
 * Numbered "how it works" steps (1..N), rendered in the given order, in
 * accent-filled circles connected by a thin line — horizontal on desktop
 * (sm+), vertical on mobile. Uses this component's own `<Section>` (plain
 * canvas background), which the connecting-circle "ring" is matched to so
 * it visually breaks the line behind each number.
 */
export function ProcessSteps({ steps, heading }: ProcessStepsProps) {
  return (
    <Section>
      {heading && (
        <h2 className="mb-14 text-center text-h2 font-semibold text-ink">{heading}</h2>
      )}
      <div className="relative">
        {/* Horizontal connecting line, desktop only — sits behind the
            number circles, which mask it via a canvas-colored ring. Kept
            as a sibling of <ol>, not a child, since <ol> only permits
            <li> children. */}
        <div
          aria-hidden="true"
          className="absolute left-0 right-0 top-5 hidden h-px bg-accent/20 sm:block"
        />
        <ol className="grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-14 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title} className="relative flex gap-4 sm:flex-col sm:items-center sm:gap-3 sm:text-center">
              <div className="flex flex-col items-center self-stretch">
                <span
                  aria-hidden="true"
                  // `bg-accent` + white text is only ~2.5:1 (fails AA); the
                  // digit is still visually perceived even though aria-hidden
                  // removes it from the a11y tree, so it needs real contrast.
                  // `accent-ink` (~6.5:1 against white) matches the Button primary fix.
                  className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-ink text-lg font-semibold text-white ring-8 ring-canvas"
                >
                  {index + 1}
                </span>
                {index < steps.length - 1 && (
                  <span aria-hidden="true" className="mt-1 w-px flex-1 bg-accent/25 sm:hidden" />
                )}
              </div>
              <div className="flex flex-col gap-2 pb-2 sm:items-center">
                <h3 className="text-lg font-semibold text-ink">{step.title}</h3>
                <p className="text-sm text-ink/70">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
