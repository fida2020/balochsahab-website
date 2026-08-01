/**
 * Build a multi-resolution favicon.ico (16/32/48) from favicon.svg using
 * PNG-compressed ICO entries (supported by all modern browsers/OSes since Vista).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const svg = path.join(root, "assets", "img", "favicon.svg");
const out = path.join(root, "assets", "img", "favicon.ico");

const sizes = [16, 32, 48];

async function main() {
  const pngs = await Promise.all(sizes.map((s) => sharp(svg).resize(s, s).png().toBuffer()));

  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = dirEntrySize * sizes.length;
  let offset = headerSize + dirSize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(sizes.length, 4); // image count

  const dirEntries = [];
  const imageBuffers = [];
  sizes.forEach((size, i) => {
    const png = pngs[i];
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(size === 256 ? 0 : size, 0); // width
    entry.writeUInt8(size === 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // color palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8); // image size
    entry.writeUInt32LE(offset, 12); // image offset
    offset += png.length;
    dirEntries.push(entry);
    imageBuffers.push(png);
  });

  const ico = Buffer.concat([header, ...dirEntries, ...imageBuffers]);
  fs.writeFileSync(out, ico);
  console.log("favicon.ico written", ico.length, "bytes");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
