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

test.describe("navbar", () => {
  test('desktop "Skin Problem" dropdown reveals the 3 concern links', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "desktop-only dropdown; the mobile project renders the hamburger drawer instead",
    );

    await gotoOk(page, "/");

    const trigger = page.getByRole("button", { name: "Skin Problem" });
    await trigger.hover();
    await trigger.click();

    const menu = page.getByRole("list", { name: "Skin Problem" });
    await expect(menu).toBeVisible();

    const links = menu.getByRole("link");
    await expect(links).toHaveCount(3);
    await expect(links.nth(0)).toHaveAttribute("href", "/pigmentation");
    await expect(links.nth(1)).toHaveAttribute("href", "/acne");
    await expect(links.nth(2)).toHaveAttribute("href", "/other-issues");
  });

  test("mobile hamburger opens a dialog drawer", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "mobile-chrome",
      "hamburger is hidden (md:hidden) at desktop viewport widths",
    );

    await gotoOk(page, "/");

    await page.getByRole("button", { name: "Open menu" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Home" })).toBeVisible();
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
