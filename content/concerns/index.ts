import type { ConcernContent } from "@/content/concerns/types";
import { pigmentation } from "@/content/concerns/pigmentation";
import { acne } from "@/content/concerns/acne";
import { otherIssues } from "@/content/concerns/other-issues";

export type { ConcernContent } from "@/content/concerns/types";

export const CONCERNS: Record<ConcernContent["slug"], ConcernContent> = {
  pigmentation,
  acne,
  "other-issues": otherIssues,
};
