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

async function recompressPng(srcName, outName, width) {
  const src = path.join(imgDir, srcName);
  const out = path.join(imgDir, outName);
  let pipeline = sharp(src);
  if (width) pipeline = pipeline.resize(width, width, { fit: "cover" });
  await pipeline.png({ compressionLevel: 9, quality: 85 }).toFile(out);
  console.log("png", outName, fs.statSync(out).size);
}

// Tiny favicon sizes use the simplified flat "BS" glyph (assets/img/favicon.svg),
// not the photorealistic master: the master's fine detail (circuit lines, bevels,
// three lines of text) becomes an illegible blob below ~48px regardless of source
// quality. The full master is used everywhere it can actually be seen (64px+).
async function buildFaviconIco() {
  const svgSrc = path.join(imgDir, "favicon.svg");
  const sizes = [16, 32, 48];
  const pngs = await Promise.all(sizes.map((s) => sharp(svgSrc).resize(s, s).png().toBuffer()));
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
  const master = "logo.png";
  await toWebp(master, "logo-512.webp", 512);
  await toWebp(master, "logo-256.webp", 256);
  await toWebp(master, "logo-128.webp", 128);
  await toWebp(master, "logo.webp", null);

  await toWebp("og-cover.png", "og-cover.webp");

  await recompressPng(master, "logo-512.png", 512);
  await recompressPng(master, "logo-256.png", 256);
  await recompressPng(master, "logo-128.png", 128);
  await recompressPng(master, "logo-64.png", 64);
  await recompressPng(master, "apple-touch-icon.png", 180);

  await sharp(path.join(imgDir, "favicon.svg")).resize(16, 16).png().toFile(path.join(imgDir, "favicon-16x16.png"));
  await sharp(path.join(imgDir, "favicon.svg")).resize(32, 32).png().toFile(path.join(imgDir, "favicon-32x32.png"));
  console.log("png favicon-16x16.png (from simplified glyph)");
  console.log("png favicon-32x32.png (from simplified glyph)");

  await buildFaviconIco();

  // Maskable PWA icons: master logo with a generous safe-zone margin so OS
  // circular/rounded-square masking never clips the ring or text.
  for (const size of [192, 512]) {
    const inner = Math.round(size * 0.72);
    const markBuf = await sharp(path.join(imgDir, master)).resize(inner, inner, { fit: "contain", background: "#090909" }).png().toBuffer();
    await sharp({ create: { width: size, height: size, channels: 4, background: "#090909" } })
      .composite([{ input: markBuf, gravity: "center" }])
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
