/**
 * Optimize images + minify CSS/JS for production static site.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const imgDir = path.join(root, "assets", "img");
const cssDir = path.join(root, "assets", "css");
const jsDir = path.join(root, "assets", "js");

function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>~+])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

function minifyJs(js) {
  return js
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\n\s*\/\/.*$/gm, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n+/g, "\n")
    .trim();
}

async function toWebp(srcName, outName, width) {
  const src = path.join(imgDir, srcName);
  const out = path.join(imgDir, outName);
  let pipeline = sharp(src);
  if (width) pipeline = pipeline.resize(width, width, { fit: "cover" });
  await pipeline.webp({ quality: 82, effort: 6 }).toFile(out);
  console.log("webp", outName, fs.statSync(out).size);
}

// The master (assets/img/logo.png) is the full lockup: ring monogram + chart +
// moneybag + three lines of "BALOCH SAHAB EARNING WEBSITE" text. That text is
// only legible at large sizes (used as-is for the OG social preview), so every
// small icon size — header/footer/hero logo, favicons, maskable PWA icons — is
// instead cut from MARK_CROP, a square region of the master that isolates just
// the ring+monogram+chart+bag art with the caption text cropped out.
const MARK_CROP = { left: 202, top: 0, width: 850, height: 850 };

function markBuffer(size) {
  return sharp(path.join(imgDir, "logo.png")).extract(MARK_CROP).resize(size, size).png().toBuffer();
}

async function buildFaviconIco() {
  const sizes = [16, 32, 48];
  const pngs = await Promise.all(sizes.map((s) => markBuffer(s)));
  const headerSize = 6;
  const dirEntrySize = 16;
  let offset = headerSize + dirEntrySize * sizes.length;
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  const dirEntries = [];
  sizes.forEach((size, i) => {
    const png = pngs[i];
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(size === 256 ? 0 : size, 0);
    entry.writeUInt8(size === 256 ? 0 : size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    dirEntries.push(entry);
  });
  const ico = Buffer.concat([header, ...dirEntries, ...pngs]);
  const out = path.join(imgDir, "favicon.ico");
  fs.writeFileSync(out, ico);
  console.log("ico favicon.ico", ico.length);
}

async function main() {
  // logo-*.{png,webp} / apple-touch-icon: the cropped ring+monogram mark (no
  // caption text — see MARK_CROP), used at every size the header/footer/hero
  // actually render (44px–512px).
  for (const size of [512, 256, 128]) {
    await sharp(await markBuffer(size)).webp({ quality: 82, effort: 6 }).toFile(path.join(imgDir, `logo-${size}.webp`));
    console.log("webp", `logo-${size}.webp`);
    await sharp(await markBuffer(size)).png({ compressionLevel: 9, quality: 85 }).toFile(path.join(imgDir, `logo-${size}.png`));
    console.log("png", `logo-${size}.png`);
  }
  await sharp(await markBuffer(1024)).webp({ quality: 82, effort: 6 }).toFile(path.join(imgDir, "logo.webp"));
  console.log("webp logo.webp");
  await sharp(await markBuffer(64)).png({ compressionLevel: 9, quality: 85 }).toFile(path.join(imgDir, "logo-64.png"));
  console.log("png logo-64.png");
  await sharp(await markBuffer(180)).png({ compressionLevel: 9, quality: 85 }).toFile(path.join(imgDir, "apple-touch-icon.png"));
  console.log("png apple-touch-icon.png");

  // OG social-preview: the full lockup (mark + brand name + tagline reads fine
  // at 1200x630) centered on a black canvas matching the master's own background.
  const ogMark = await sharp(path.join(imgDir, "logo.png")).resize(590, 590).png().toBuffer();
  await sharp({ create: { width: 1200, height: 630, channels: 4, background: "#000000" } })
    .composite([{ input: ogMark, gravity: "center" }])
    .png()
    .toFile(path.join(imgDir, "og-cover.png"));
  console.log("png og-cover.png (regenerated from new logo)");
  await toWebp("og-cover.png", "og-cover.webp");

  await sharp(await markBuffer(16)).toFile(path.join(imgDir, "favicon-16x16.png"));
  await sharp(await markBuffer(32)).toFile(path.join(imgDir, "favicon-32x32.png"));
  console.log("png favicon-16x16.png (from mark crop)");
  console.log("png favicon-32x32.png (from mark crop)");

  await buildFaviconIco();

  // Maskable PWA icons: mark crop with a generous safe-zone margin so OS
  // circular/rounded-square masking never clips the art.
  const maskableBg = "#000000";
  for (const size of [192, 512]) {
    const inner = Math.round(size * 0.82);
    const mk = await markBuffer(inner);
    await sharp({ create: { width: size, height: size, channels: 4, background: maskableBg } })
      .composite([{ input: mk, gravity: "center" }])
      .png()
      .toFile(path.join(imgDir, "icon-maskable-" + size + ".png"));
    console.log("png icon-maskable-" + size + ".png");
  }

  const mainCss = fs.readFileSync(path.join(cssDir, "main.css"), "utf8");
  const critCss = fs.readFileSync(path.join(cssDir, "critical.css"), "utf8");
  fs.writeFileSync(path.join(cssDir, "main.min.css"), minifyCss(mainCss));
  fs.writeFileSync(path.join(cssDir, "critical.min.css"), minifyCss(critCss));
  console.log("css minified", fs.statSync(path.join(cssDir, "main.min.css")).size);

  const mainJs = fs.readFileSync(path.join(jsDir, "main.js"), "utf8");
  fs.writeFileSync(path.join(jsDir, "main.min.js"), minifyJs(mainJs));
  console.log("js minified", fs.statSync(path.join(jsDir, "main.min.js")).size);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
