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

async function main() {
  const master = "logo.png";
  await toWebp(master, "logo-512.webp", 512);
  await toWebp(master, "logo-256.webp", 256);
  await toWebp(master, "logo-128.webp", 128);
  await toWebp(master, "favicon.webp", 64);
  await toWebp("og-cover.png", "og-cover.webp");

  await recompressPng(master, "logo-512.png", 512);
  await recompressPng(master, "logo-256.png", 256);
  await recompressPng(master, "logo-128.png", 128);
  await recompressPng(master, "favicon.png", 64);
  await recompressPng(master, "favicon-32.png", 32);
  await recompressPng(master, "favicon-180.png", 180);
  fs.copyFileSync(path.join(imgDir, "logo-512.png"), path.join(imgDir, "logo.png"));

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
