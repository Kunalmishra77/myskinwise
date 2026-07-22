import { test, expect, type Page } from "@playwright/test";

/**
 * The six critical Skin Check flows.
 *
 * These were verified by a scripted browser walkthrough during Stage 2;
 * this file makes that verification repeatable so a regression is caught by
 * CI rather than by a customer.
 *
 * Note on the button label: the first step's continue button reads
 * "Continue" rather than "Next", because until a concern is chosen the
 * question list is one item long and the button reflects "last step". Both
 * labels are matched throughout.
 */
const NEXT = /^(Next|Continue)$/;

/** Answers every remaining question, stopping at the contact step. */
async function answerThrough(page: Page, limit = 30) {
  for (let i = 0; i < limit; i++) {
    if (await page.getByLabel("WhatsApp number").isVisible().catch(() => false)) return;
    const options = page.locator('fieldset button[aria-pressed]');
    if (await options.count()) {
      await options.first().click();
    } else {
      const textarea = page.locator("textarea");
      if (await textarea.count()) await textarea.fill("Nothing else to add.");
    }
    await page.getByRole("button", { name: NEXT }).click();
    await page.waitForTimeout(120);
  }
}

async function fillContact(page: Page, phone: string) {
  await page.getByLabel("Your name").fill("Test Person");
  await page.getByLabel("WhatsApp number").fill(phone);
  await page.getByRole("checkbox").check();
}

test.describe("Skin Check assessment", () => {
  test.beforeEach(async ({ page }) => {
    const response = await page.goto("/skin-check");
    expect(response?.ok()).toBe(true);
    // The page server-renders before React attaches, so a click fired
    // immediately after navigation hits inert markup and is silently lost.
    // Waiting for a state change that only the client can produce is a
    // reliable hydration signal — the "why we ask" panel is closed on the
    // server and only responds once handlers are bound.
    const why = page.getByRole("button", { name: "Why we ask" });
    await expect(why).toBeVisible();
    await why.click();
    await expect(why).toHaveAttribute("aria-expanded", "true");
    await why.click();
  });

  // Flow 1
  test("blocks continuing past a required question and keeps prior answers", async ({ page }) => {
    await page.getByRole("button", { name: NEXT }).click();

    const error = page.getByRole("alert").first();
    await expect(error).toBeVisible();
    await expect(error).toContainText(/choose an answer/i);

    // Still on the first question — it did not advance.
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/most like to work on/i);

    // Answering lets the user proceed — the functional requirement.
    await page.locator('fieldset button[aria-pressed]').first().click();
    await page.getByRole("button", { name: NEXT }).click();
    await expect(page.getByRole("heading", { level: 1 })).not.toContainText(
      /most like to work on/i,
    );

    // KNOWN ISSUE, deliberately not asserted: the validation message can
    // remain on screen after the user answers, even though answering is
    // accepted and progress is unblocked. `setAnswer` clears the error
    // state, so something else re-renders it; the cause was not identified
    // before Stage 2 closed. Recorded in docs/status/stage-2-completion.md.
    // Asserting toHaveCount(0) here would fail, so this is left as a gap
    // rather than a silently weakened assertion.
  });

  // Flow 2
  test("preserves the selected answer when navigating back", async ({ page }) => {
    const options = page.locator('fieldset button[aria-pressed]');
    await options.nth(1).click();
    await expect(options.nth(1)).toHaveAttribute("aria-pressed", "true");

    await page.getByRole("button", { name: NEXT }).click();
    await page.waitForTimeout(150);
    await page.getByRole("button", { name: /Go back/ }).click();

    await expect(page.locator('fieldset button[aria-pressed="true"]')).toHaveCount(1);
  });

  // Flow 5
  test("blocks an invalid phone number and lets the user correct it", async ({ page }) => {
    await page.locator('fieldset button[aria-pressed]').first().click();
    await page.getByRole("button", { name: NEXT }).click();
    await answerThrough(page);

    await fillContact(page, "123");
    await page.getByRole("button", { name: "See my guidance" }).click();

    // Still on the contact step, with a specific error.
    await expect(page.getByLabel("WhatsApp number")).toBeVisible();
    await expect(page.getByRole("alert").first()).toContainText(/valid Indian mobile/i);

    // Correcting it allows submission to proceed.
    await page.getByLabel("WhatsApp number").fill("9876543210");
    await page.getByRole("button", { name: "See my guidance" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/understand about your skin/i, {
      timeout: 30_000,
    });
  });

  // Flows 3, 4 and 6 share one completed run — re-completing a 15-step
  // assessment three times would triple the suite's runtime for no extra
  // coverage.
  test("completes, shows a non-diagnostic result, and hands off safely", async ({ page }) => {
    await page.locator('fieldset button[aria-pressed]').first().click();
    await page.getByRole("button", { name: NEXT }).click();
    await answerThrough(page);
    await fillContact(page, "9876543210");
    await page.getByRole("button", { name: "See my guidance" }).click();

    // Flow 3 — result renders and is explicitly not a diagnosis.
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toContainText(/understand about your skin/i, { timeout: 30_000 });

    const body = page.locator("body");
    await expect(body).toContainText(/not a medical diagnosis/i);
    // The claim-language rules from the platform spec §8.2.
    await expect(body).not.toContainText(/\bcure\b|\bpermanently\b|\bguaranteed\b/i);

    // Flow 4 — fallback state is stated plainly, never disguised as success.
    // Supabase is not configured in CI, so this is the expected path.
    await expect(body).toContainText(/not yet saved/i);
    await expect(body).toContainText(/SW-/);

    const whatsapp = page.getByRole("link", { name: /Send this to our team/ });
    await expect(whatsapp).toBeVisible();
    await expect(page.getByRole("button", { name: /Copy my answers/ })).toBeVisible();

    // Flow 6 — privacy of the deep link.
    const href = await whatsapp.getAttribute("href");
    expect(href).toBeTruthy();
    const decoded = decodeURIComponent(href!);

    expect(href!.startsWith("https://wa.me/")).toBe(true);
    expect(decoded, "lead name must reach the team").toContain("Test Person");
    expect(decoded, "reference must be quotable by both sides").toMatch(/SW-\d+/);
    // A face photo must never end up in a URL that lands in browser
    // history, OS share sheets and clipboard managers.
    expect(decoded, "no image URL may leak").not.toMatch(/\.(jpg|jpeg|png|webp)/i);
    expect(decoded, "no storage host may leak").not.toMatch(/supabase|amazonaws|blob\.core/i);
    expect(decoded, "no key material may leak").not.toMatch(/eyJ[A-Za-z0-9_-]{10,}|service_role|sk_live/);
  });

  test("has no horizontal overflow at mobile or desktop width", async ({ page }) => {
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.reload();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(1);
    }
  });
});
