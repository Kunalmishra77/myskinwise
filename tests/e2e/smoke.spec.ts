import { test, expect, type Page } from "@playwright/test";

/** Every marketing route that must be reachable, titled, and headed. */
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
] as const;

const TEL_HREF_RE = /^tel:\+\d+$/;
const WA_HREF_RE = /^https:\/\/wa\.me\/\d+$/;

async function gotoOk(page: Page, route: string) {
  const response = await page.goto(route);
  expect(response, `no response for ${route}`).not.toBeNull();
  expect(response!.ok(), `${route} responded ${response!.status()}`).toBe(true);
  return response!;
}

test.describe("marketing routes: 200 + title + visible h1", () => {
  for (const route of ROUTES) {
    test(`${route} responds 200, has a title, and a visible h1`, async ({ page }) => {
      await gotoOk(page, route);

      const title = await page.title();
      expect(title.trim().length, `${route} has an empty <title>`).toBeGreaterThan(0);

      const h1 = page.locator("h1").first();
      await expect(h1, `${route} has no visible h1`).toBeVisible();
    });
  }
});

test("every route's <title> is unique", async ({ page }) => {
  const titles: string[] = [];
  for (const route of ROUTES) {
    const response = await page.goto(route);
    expect(response!.ok()).toBe(true);
    titles.push(await page.title());
  }
  const unique = new Set(titles);
  expect(unique.size, `duplicate <title> values found: ${titles.join(", ")}`).toBe(titles.length);
});

test.describe("app shell", () => {
  test("menu button opens a focus-trapped drawer and Escape restores focus", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "mobile-chrome",
      "the menu trigger is hidden (lg:hidden) at desktop widths",
    );

    await gotoOk(page, "/");

    const trigger = page.getByRole("button", { name: "Open menu" });
    await trigger.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Home" })).toBeVisible();

    // Focus must land inside the dialog, not stay on the page behind it.
    await expect(dialog.getByRole("button", { name: "Close menu" })).toBeFocused();

    // Escape closes it and hands focus back to the trigger, so a keyboard
    // user is not dumped at the top of the document.
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("bottom nav is mobile-only and marks the current page", async ({ page }, testInfo) => {
    await gotoOk(page, "/");

    const bottomNav = page.getByRole("navigation", { name: "Primary" });

    if (testInfo.project.name === "chromium") {
      await expect(bottomNav).toBeHidden();
      return;
    }

    await expect(bottomNav).toBeVisible();
    await expect(bottomNav.getByRole("link", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    // Every tab must clear the 44px minimum touch target. `exact` matters:
    // an inexact "Me" also matches "Home".
    //
    // Five tabs, not four. "Concerns" left the bar and "Scan" and "Ask"
    // joined it, because an audit found the Skin Analyzer had no inbound
    // links anywhere on the site and the voice agent had one — two of the
    // four primary features were unreachable on a phone. See nav-items.ts.
    for (const name of ["Home", "Scan", "Skin Check", "Ask", "Me"]) {
      const box = await bottomNav.getByRole("link", { name, exact: true }).boundingBox();
      expect(box, `${name} tab has no box`).not.toBeNull();
      expect(box!.height, `${name} tab is under 44px tall`).toBeGreaterThanOrEqual(44);
    }
  });

  test("the Skin Check flow renders without the shell around it", async ({ page }) => {
    await gotoOk(page, "/skin-check");

    // The assessment is full-screen by routing, not by a conditional — it
    // lives outside the (app) route group, so no shell chrome exists here.
    await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Open menu" })).toHaveCount(0);
  });

  test("bottom nav does not cover the end of page content", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chrome", "bottom nav is mobile-only");

    await gotoOk(page, "/me");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const nav = page.getByRole("navigation", { name: "Primary" });
    const navBox = await nav.boundingBox();
    const main = page.locator("main#main");
    const mainBox = await main.boundingBox();

    expect(navBox).not.toBeNull();
    expect(mainBox).not.toBeNull();
    // <main> reserves bottom padding for the bar, so its content bottom
    // must not extend underneath the bar's top edge.
    expect(mainBox!.y + mainBox!.height).toBeLessThanOrEqual(navBox!.y + 1);
  });
});

test.describe("contact links", () => {
  test("every tel: href is well-formed and a WhatsApp link exists on the home page", async ({ page }) => {
    await gotoOk(page, "/");

    const telLinks = page.locator('a[href^="tel:"]');
    const telCount = await telLinks.count();
    expect(telCount, "expected at least one tel: link on the home page").toBeGreaterThan(0);
    for (let i = 0; i < telCount; i++) {
      const href = await telLinks.nth(i).getAttribute("href");
      expect(href, `tel: href #${i} malformed: ${href}`).toMatch(TEL_HREF_RE);
    }

    const waLinks = page.locator('a[href^="https://wa.me/"]');
    const waCount = await waLinks.count();
    expect(waCount, "expected at least one wa.me link on the home page").toBeGreaterThan(0);
    for (let i = 0; i < waCount; i++) {
      const href = await waLinks.nth(i).getAttribute("href");
      expect(href, `wa.me href #${i} malformed: ${href}`).toMatch(WA_HREF_RE);
    }
  });
});

test.describe("contact form", () => {
  test("filling and submitting shows the success message", async ({ page }) => {
    await gotoOk(page, "/contact-us");

    // Scoped to the form containing the "Name" field: the footer's
    // newsletter <form> also has an "Email"-labelled input, so an
    // unscoped `getByLabel("Email")` would be ambiguous (strict-mode
    // violation) on this page.
    const form = page.locator("form", { has: page.getByLabel("Name") });

    await form.getByLabel("Name").fill("Ada Lovelace");
    await form.getByLabel("Email").fill("ada@example.com");
    await form
      .getByLabel("Message")
      .fill("Hello, I'd like to learn more about your pigmentation routine.");

    await form.getByRole("button", { name: /send message/i }).click();

    await expect(page.getByRole("status")).toContainText("Thanks");
  });
});
