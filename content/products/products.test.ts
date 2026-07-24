import { describe, expect, it } from "vitest";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import {
  PRODUCTS,
  productBySlug,
  productImages,
  primaryProductImage,
  productsForConcern,
  matchFormulation,
} from "./index";

const PUBLIC_PRODUCTS = path.resolve(process.cwd(), "public", "products");

describe("product catalogue", () => {
  it("has a unique slug per product", () => {
    const slugs = PRODUCTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("resolves a product by slug and returns null for an unknown one", () => {
    expect(productBySlug("spf-30")?.name).toBe("Customised SPF-30");
    expect(productBySlug("not-a-product")).toBeNull();
  });
});

describe("product imagery", () => {
  /*
   * The whole point of the catalogue is that a product carries real
   * photographs. If `imageCount` and the files on disk ever disagree, the UI
   * renders a broken image and nobody notices until a customer does — so the
   * relationship is asserted against the filesystem rather than trusted.
   */
  it("every declared image exists on disk", () => {
    for (const product of PRODUCTS) {
      for (const image of productImages(product)) {
        const onDisk = path.join(PUBLIC_PRODUCTS, image.src.replace("/products/", ""));
        expect(existsSync(onDisk), `missing ${image.src}`).toBe(true);
      }
    }
  });

  it("declares every image that exists on disk, so none are orphaned", () => {
    for (const product of PRODUCTS) {
      const dir = path.join(PUBLIC_PRODUCTS, product.slug);
      const actual = readdirSync(dir).filter((f) => f.endsWith(".jpg")).length;
      expect(actual, `${product.slug} has ${actual} files but declares ${product.imageCount}`).toBe(
        product.imageCount,
      );
    }
  });

  it("gives every product multiple shots, not one image reused", () => {
    for (const product of PRODUCTS) {
      expect(product.imageCount, `${product.slug} has only ${product.imageCount} shot`).toBeGreaterThan(1);
      const sources = productImages(product).map((i) => i.src);
      expect(new Set(sources).size).toBe(sources.length);
    }
  });

  it("marks exactly one primary image and it is the first", () => {
    for (const product of PRODUCTS) {
      const images = productImages(product);
      expect(images.filter((i) => i.primary)).toHaveLength(1);
      expect(primaryProductImage(product).src).toBe(images[0]!.src);
    }
  });

  it("gives every image non-empty alt text", () => {
    for (const product of PRODUCTS) {
      for (const image of productImages(product)) {
        expect(image.alt.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

describe("no invented product data", () => {
  /*
   * Seven of nine labels do not show a legible price. The catalogue records
   * that as null. This test exists to stop a well-meaning future edit from
   * "filling in the gaps" with a plausible number — an invented MRP on a
   * regulated cosmetic is an invented legal declaration.
   */
  it("prices are either a real positive number or explicitly absent", () => {
    for (const product of PRODUCTS) {
      if (product.mrp === null) continue;
      expect(product.mrp).toBeGreaterThan(0);
      expect(Number.isInteger(product.mrp)).toBe(true);
    }
  });

  it("only the two products with a legible price carry one", () => {
    const priced = PRODUCTS.filter((p) => p.mrp !== null).map((p) => p.slug).sort();
    expect(priced).toEqual(["anti-acne-cleanser", "spf-30"]);
  });

  it("a product with a price also states its net quantity", () => {
    for (const product of PRODUCTS) {
      if (product.mrp !== null) expect(product.netQuantity).toBeTruthy();
    }
  });

  it("every product has a description and at least one ingredient", () => {
    for (const product of PRODUCTS) {
      expect(product.description.length).toBeGreaterThan(40);
      expect(product.ingredients.length).toBeGreaterThan(0);
    }
  });

  it("makes no curative or absolute claims", () => {
    // The claim-language rules from the platform spec §8.2, applied to the
    // transcribed label copy as much as to our own writing.
    const banned = /\bcures?\b|\bpermanent(ly)?\b|\bguarantee(d)?\b|\b100%\b|\bmiracle\b/i;
    for (const product of PRODUCTS) {
      const copy = [product.name, product.tagline, product.description, product.directions ?? ""].join(" ");
      expect(banned.test(copy), `${product.slug} contains a claim word`).toBe(false);
    }
  });
});

describe("concern mapping", () => {
  it("returns products for each concern in routine order", () => {
    const acne = productsForConcern("acne");
    expect(acne.length).toBeGreaterThan(0);
    expect(acne[0]!.step).toBe("cleanse");
  });

  it("returns nothing for an unknown concern rather than throwing", () => {
    expect(productsForConcern("not-a-concern")).toEqual([]);
  });
});

describe("matching an expert's free-text formulation reference", () => {
  it("matches the exact slug and the printed name", () => {
    expect(matchFormulation("spf-30")?.slug).toBe("spf-30");
    expect(matchFormulation("Customised SPF-30")?.slug).toBe("spf-30");
  });

  it("is tolerant of the spacing and casing an expert would actually type", () => {
    expect(matchFormulation("SPF 30")?.slug).toBe("spf-30");
    expect(matchFormulation("anti acne cleanser")?.slug).toBe("anti-acne-cleanser");
    expect(matchFormulation("D-Tan Pack")?.slug).toBe("d-tan-pack");
  });

  it("prefers the longer slug when one contains another", () => {
    // "depigmentation-cleanser" must not lose to a shorter partial match.
    expect(matchFormulation("Customised Depigmentation Cleanser")?.slug).toBe(
      "depigmentation-cleanser",
    );
    expect(matchFormulation("Customised Depigmentation Cream")?.slug).toBe(
      "depigmentation-cream",
    );
  });

  it("returns null rather than guessing when nothing matches", () => {
    // Regimen items predate the catalogue and hold arbitrary expert text. An
    // unmatched ref must fall back to plain text, never to a wrong product.
    expect(matchFormulation("bespoke compounded serum 4%")).toBeNull();
    expect(matchFormulation("")).toBeNull();
    expect(matchFormulation("   ")).toBeNull();
  });
});
