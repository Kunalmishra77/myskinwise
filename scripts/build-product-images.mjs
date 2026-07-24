/**
 * Derive the web product imagery from the supplied product PDFs.
 *
 *   node scripts/build-product-images.mjs
 *
 * Source of truth is `Assets/Product-Assets/*.pdf` — one PDF per product,
 * each containing 3–4 photographs of the physical bottle or jar (front, and
 * the label panels carrying description, ingredients and statutory details).
 * Output is `public/products/<slug>/<n>.jpg`.
 *
 * This is committed rather than run once and forgotten so the imagery can be
 * regenerated when the client sends updated packaging, and so the mapping
 * from PDF to slug is reviewable instead of living in someone's shell history.
 *
 * Two things are worth knowing before changing it:
 *
 * 1. The PDFs store each photo as a DCTDecode stream, which is simply an
 *    embedded JPEG. Walking the JPEG marker segments lets us lift the
 *    original bytes out losslessly — no page rendering, no poppler
 *    dependency, and no generational re-encode.
 *
 * 2. The photographs frame the product small inside a large white sweep. Left
 *    alone, every product would sit at a different scale in a grid. Each shot
 *    is therefore trimmed to its real content and re-centred on a fixed
 *    square canvas, which is what makes the catalogue look deliberate.
 */
import sharp from "sharp";
import { readFileSync, readdirSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "Assets", "Product-Assets");
const OUT = path.join(ROOT, "public", "products");

const SIZE = 1200;
const MARGIN = 72;

/**
 * PDF basename → catalogue slug.
 *
 * The filenames are the client's, so they are inconsistent about spelling
 * ("Customised" vs "Customized", "d-pigmentation" vs "de pigmentation") and
 * sometimes describe the product rather than name it — the under-eye file is
 * actually "Customised Eye Lyte Cream" on the label. Slugs follow the printed
 * label, not the filename.
 *
 * `Customised Day care cream (1).pdf` is a byte-identical duplicate (verified
 * by md5) and is deliberately absent.
 */
const PRODUCTS = [
  ["Customised Anti-Acne cleanser", "anti-acne-cleanser"],
  ["Customised d-pigmentation cream", "depigmentation-cream"],
  ["Customised d-tan pack", "d-tan-pack"],
  ["Customised Day care cream", "day-care-cream"],
  ["Customised de pigmentation Cleanser", "depigmentation-cleanser"],
  ["Customised glowing cleanser", "glowing-cleanser"],
  ["Customised glowing Gel", "glowing-gel"],
  ["Customized SPF30", "spf-30"],
  ["Under eye brightening cream & de-puffing formula", "eye-lyte-cream"],
];

/** Lift every embedded JPEG out of a PDF, in page order. */
function extractJpegs(buf) {
  const out = [];
  let i = 0;
  while (i < buf.length - 3) {
    if (buf[i] === 0xff && buf[i + 1] === 0xd8 && buf[i + 2] === 0xff) {
      let j = i + 2;
      let complete = false;
      while (j < buf.length - 1) {
        if (buf[j] !== 0xff) { j++; continue; }
        const marker = buf[j + 1];
        if (marker === 0xd9) { j += 2; complete = true; break; }
        // Padding, stuffed bytes and restart markers carry no length field.
        if (marker === 0x00 || marker === 0xff || (marker >= 0xd0 && marker <= 0xd7)) { j += 2; continue; }
        const len = (buf[j + 2] << 8) | buf[j + 3];
        if (marker === 0xda) {
          // Start of scan. The entropy-coded data that follows can contain
          // 0xFF bytes, so skip the header then scan for the next real marker
          // rather than trusting a naive search for the end-of-image bytes.
          j += 2 + len;
          while (j < buf.length - 1) {
            if (buf[j] === 0xff && buf[j + 1] !== 0x00 && !(buf[j + 1] >= 0xd0 && buf[j + 1] <= 0xd7)) break;
            j++;
          }
          continue;
        }
        j += 2 + len;
      }
      if (complete) { out.push(buf.subarray(i, j)); i = j; continue; }
    }
    i++;
  }
  return out;
}

const pdfs = readdirSync(SRC).filter((f) => f.toLowerCase().endsWith(".pdf"));
rmSync(OUT, { recursive: true, force: true });

const manifest = {};
for (const [base, slug] of PRODUCTS) {
  // Trailing spaces are present in several of the supplied filenames.
  const file = pdfs.find((f) => f.replace(/\.pdf$/i, "").trim() === base);
  if (!file) throw new Error(`No PDF found for "${base}" — check Assets/Product-Assets`);

  const shots = extractJpegs(readFileSync(path.join(SRC, file)));
  if (!shots.length) throw new Error(`No images extracted from ${file}`);

  mkdirSync(path.join(OUT, slug), { recursive: true });
  manifest[slug] = [];

  for (let i = 0; i < shots.length; i++) {
    // A high trim threshold: the backdrop is a lit white sweep rather than
    // pure white, so a low one leaves a ragged grey edge.
    const trimmed = await sharp(shots[i]).trim({ threshold: 32 }).toBuffer();
    const fitted = await sharp(trimmed)
      .resize(SIZE - MARGIN * 2, SIZE - MARGIN * 2, { fit: "inside", withoutEnlargement: true })
      .toBuffer();

    await sharp({
      create: { width: SIZE, height: SIZE, channels: 3, background: { r: 255, g: 255, b: 255 } },
    })
      .composite([{ input: fitted, gravity: "centre" }])
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(path.join(OUT, slug, `${i + 1}.jpg`));

    manifest[slug].push(`${i + 1}.jpg`);
  }
}

console.log(JSON.stringify(manifest, null, 2));
