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
              className="flex size-10 items-center justify-center rounded-full bg-accent text-lg font-semibold text-white"
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
