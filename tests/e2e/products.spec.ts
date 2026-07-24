import { test, expect, type Page } from "@playwright/test";

/**
 * The product catalogue, end to end.
 *
 * The unit suite already asserts that every declared image exists on disk.
 * This file asserts the half that a filesystem check cannot: that the images
 * actually decode and paint in a browser. A product page whose photography
 * silently fails to load is worse than one with no photography, because the
 * layout still reserves the space and the page looks broken rather than plain.
 */

/**
 * Names every image on the page that failed to decode.
 *
 * The scroll pass matters and is not padding. next/image lazy-loads anything
 * below the fold, and a lazy <img> that has never entered the viewport stays
 * `complete === false` forever — so naively awaiting every image's onload
 * hangs indefinitely at mobile widths, where a one-column grid puts almost
 * everything off-screen. Scrolling the page first is what actually asks the
 * browser to fetch them.
 *
 * The per-image wait is then bounded rather than open-ended: a genuinely
 * broken image should fail this check with a useful list, not by timing the
 * whole test out with no diagnostic.
 */
async function brokenImages(page: Page) {
  await page.evaluate(async () => {
    const step = window.innerHeight;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 100));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState("networkidle");

  return page.evaluate(async () => {
    const imgs = Array.from(document.querySelectorAll("img"));
    await Promise.all(
      imgs.map((i) =>
        i.complete
          ? null
          : Promise.race([
              new Promise((r) => { i.onload = r; i.onerror = r; }),
              new Promise((r) => setTimeout(r, 5000)),
            ]),
      ),
    );
    return imgs.filter((i) => i.naturalWidth === 0).map((i) => i.currentSrc || i.src);
  });
}

test.describe("product catalogue", () => {
  test("the index lists every formulation with a loaded image", async ({ page }) => {
    const response = await page.goto("/products");
    expect(response?.ok()).toBe(true);

    const cards = page.getByRole("link", { name: /View product/ });
    await expect(cards).toHaveCount(9);

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await brokenImages(page)).toEqual([]);
  });

  test("a product page shows its real label data", async ({ page }) => {
    await page.goto("/products/anti-acne-cleanser");

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Customised Anti-Acne Cleanser",
    );

    const body = page.locator("body");
    // Transcribed from the physical label — not marketing copy we wrote.
    await expect(body).toContainText("Oil Control & Acne Defense Formula");
    await expect(body).toContainText("Tea Tree Oil");
    await expect(body).toContainText("₹1,299");
    await expect(body).toContainText("50ml");

    expect(await brokenImages(page)).toEqual([]);
  });

  test("a product without a legible printed price never shows an invented one", async ({ page }) => {
    // Seven of nine jars wrap the statutory panel around a curve. Those must
    // say the price is confirmed at consultation, and must not display any
    // rupee figure at all.
    await page.goto("/products/d-tan-pack");

    const body = page.locator("body");
    await expect(body).toContainText("Confirmed at consultation");
    await expect(body).not.toContainText("₹");
  });

  test("the gallery switches shots and keeps them keyboard-reachable", async ({ page }) => {
    await page.goto("/products/spf-30");

    const thumbs = page.getByRole("button", { name: /^Show / });
    await expect(thumbs).toHaveCount(4);

    // The first shot is current on load; clicking the third moves it.
    await expect(thumbs.nth(0)).toHaveAttribute("aria-current", "true");
    await thumbs.nth(2).click();
    await expect(thumbs.nth(2)).toHaveAttribute("aria-current", "true");
    await expect(thumbs.nth(0)).toHaveAttribute("aria-current", "false");

    expect(await brokenImages(page)).toEqual([]);
  });

  test("an unknown formulation 404s rather than rendering an empty page", async ({ page }) => {
    const response = await page.goto("/products/not-a-real-product");
    expect(response?.status()).toBe(404);
  });

  test("makes no curative claims anywhere in the catalogue", async ({ page }) => {
    for (const slug of ["anti-acne-cleanser", "depigmentation-cream", "spf-30"]) {
      await page.goto(`/products/${slug}`);
      const body = page.locator("body");
      await expect(body).not.toContainText(/\bcures?\b|\bpermanently\b|\bguaranteed\b/i);
      // Every product page must carry the not-a-medicine line.
      await expect(body).toContainText(/not a medicine/i);
    }
  });

  /*
   * Checked at each project's own emulated viewport rather than by resizing
   * inside the test. Resizing a device-emulated context mid-page re-evaluates
   * every responsive `sizes` attribute, and Chromium can leave the superseded
   * image request stalled — the page never fires `load` and the test times out
   * against a page that is actually fine. Running once per project covers
   * mobile (Pixel 5) and desktop widths without provoking that.
   */
  test("has no horizontal overflow at this device's width", async ({ page }, testInfo) => {
    await page.goto("/products/eye-lyte-cream");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `horizontal overflow in ${testInfo.project.name}`).toBeLessThanOrEqual(1);
  });
});
