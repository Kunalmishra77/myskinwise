import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/** Every marketing route audited for accessibility violations. */
const ROUTES = [
  "/",
  "/about-us",
  "/pigmentation",
  "/acne",
  "/other-issues",
  "/contact-us",
  "/privacy-policy",
  "/terms-and-conditions",
  "/refund-and-cancellation",
  "/skin-check",
  "/me",
  "/concerns",
  "/learn",
  "/ingredients",
  "/ingredients/niacinamide",
  "/ingredients/retinol",
  "/skin-types",
  "/skin-types/oily",
  "/skin-types/sensitive",
] as const;

for (const route of ROUTES) {
  test(`${route} has no serious/critical accessibility violations`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response?.ok()).toBe(true);

    const results = await new AxeBuilder({ page }).analyze();

    const seriousOrCritical = results.violations.filter(
      (violation) => violation.impact === "serious" || violation.impact === "critical",
    );

    if (seriousOrCritical.length > 0) {
      const details = seriousOrCritical
        .map(
          (violation) =>
            `\n[${violation.impact}] ${violation.id}: ${violation.help}\n` +
            violation.nodes.map((node) => `  - ${node.target.join(" ")}: ${node.failureSummary}`).join("\n"),
        )
        .join("\n");
      throw new Error(`${route} has serious/critical a11y violations:${details}`);
    }

    expect(seriousOrCritical).toHaveLength(0);
  });
}
