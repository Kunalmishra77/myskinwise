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
 * Numbered "how it works" steps (1..N), rendered in the given order.
 */
export function ProcessSteps({ steps, heading }: ProcessStepsProps) {
  return (
    <Section>
      {heading && (
        <h2 className="mb-10 text-center text-2xl font-semibold text-ink md:text-3xl">
          {heading}
        </h2>
      )}
      <ol className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => (
          <li key={step.title} className="flex flex-col items-start gap-3">
            <span
              aria-hidden="true"
              // `bg-accent` + white text is only ~2.5:1 (fails AA); the
              // digit is still visually perceived even though aria-hidden
              // removes it from the a11y tree, so it needs real contrast.
              // `accent-ink` (~6.5:1 against white) matches the Button primary fix.
              className="flex size-10 items-center justify-center rounded-full bg-accent-ink text-lg font-semibold text-white"
            >
              {index + 1}
            </span>
            <h3 className="text-lg font-semibold text-ink">{step.title}</h3>
            <p className="text-sm text-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
