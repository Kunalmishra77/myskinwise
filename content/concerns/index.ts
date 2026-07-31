import type { ConcernContent } from "@/content/concerns/types";
import { pigmentation } from "@/content/concerns/pigmentation";
import { acne } from "@/content/concerns/acne";
import { otherIssues } from "@/content/concerns/other-issues";
import { darkCircles } from "@/content/concerns/dark-circles";
import { acneScars } from "@/content/concerns/acne-scars";
import { oilySkin } from "@/content/concerns/oily-skin";
import { drySkin } from "@/content/concerns/dry-skin";

export type { ConcernContent } from "@/content/concerns/types";

export const CONCERNS: Record<ConcernContent["slug"], ConcernContent> = {
  pigmentation,
  acne,
  "other-issues": otherIssues,
  "dark-circles": darkCircles,
  "acne-scars": acneScars,
  "oily-skin": oilySkin,
  "dry-skin": drySkin,
};
