import type { ConcernSlug } from "@/content/concerns/types";

export type QuestionId = string;

export type ChoiceOption = {
  value: string;
  label: string;
  /** Optional short clarifier shown under the label. */
  hint?: string;
};

/**
 * One assessment question.
 *
 * `why` is the load-bearing field. Every question in the source WordPress
 * quizzes carried a "why is it important?" explainer, and it is the single
 * best UX idea in the existing funnel — people answer personal questions
 * when they understand what the answer is for. It is required, not
 * optional, so a new question cannot be added without justifying itself to
 * the user.
 */
export type Question = {
  id: QuestionId;
  /** The question as the user reads it. */
  prompt: string;
  /** Why we are asking. Shown to the user, never hidden behind a tooltip. */
  why: string;
  /**
   * `single` and `multi` render as tappable cards; `text` a textarea;
   * `contact` the final details step, which has its own bespoke screen.
   */
  kind: "single" | "multi" | "text";
  options?: ChoiceOption[];
  /** Optional free-text companion, e.g. "Please specify the product". */
  followUp?: { id: QuestionId; prompt: string; optional: boolean };
  optional?: boolean;
  /** Only ask when a previous answer matches. */
  showIf?: { questionId: QuestionId; valueIn: string[] };
  /**
   * Concerns this question applies to. Omitted means every concern —
   * `sun_exposure` for example is only asked of pigmentation users, which
   * is how the source quizzes behaved.
   */
  concerns?: ConcernSlug[];
};

export type AssessmentStep =
  | { kind: "question"; question: Question }
  | { kind: "photos" }
  | { kind: "contact" }
  | { kind: "review" };
