/**
 * One-time site-wide polish pass: applies identical boilerplate edits
 * (favicon links, nav/footer accessibility, back-to-top) across every HTML
 * page, since header/footer/head markup is byte-identical across pages.
 */
import fs from "fs";
import path from "path";

const root = path.join(process.cwd());

function listHtmlFiles(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".git")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) listHtmlFiles(full, out);
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

const files = listHtmlFiles(root, []);

const replacements = [
  {
    label: "favicon links",
    from: `<link rel="icon" href="/assets/img/favicon.webp" type="image/webp">
<link rel="icon" href="/assets/img/favicon.png" type="image/png" sizes="64x64">
<link rel="icon" href="/assets/img/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/assets/img/favicon-180.png">
<link rel="manifest" href="/site.webmanifest">`,
    to: `<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/assets/img/favicon.ico" sizes="any">
<link rel="icon" href="/assets/img/favicon.webp" type="image/webp">
<link rel="icon" href="/assets/img/favicon.png" type="image/png" sizes="64x64">
<link rel="icon" href="/assets/img/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/assets/img/favicon-180.png">
<link rel="mask-icon" href="/assets/img/mask-icon.svg" color="#D4AF37">
<link rel="manifest" href="/site.webmanifest">`,
  },
  {
    label: "skip-link id=top",
    from: `<a class="skip-link" href="#main">Skip to content</a>`,
    to: `<a class="skip-link" href="#main">Skip to content</a>\n<span id="top"></span>`,
  },
  {
    label: "nav-links aria-label",
    from: `<ul class="nav-links">`,
    to: `<ul class="nav-links" aria-label="Primary">`,
  },
  {
    label: "footer landmark aria-label",
    from: `<footer class="site-footer">`,
    to: `<footer class="site-footer" aria-label="Site footer">`,
  },
  {
    label: "footer-bottom back to top",
    from: `<nav aria-label="Legal"><a href="/privacy-policy.html">Privacy</a><a href="/terms-of-service.html">Terms</a><a href="/security-policy.html">Security</a><a href="mailto:support@balochsahab.com">Support</a></nav>`,
    to: `<nav aria-label="Legal"><a href="/privacy-policy.html">Privacy</a><a href="/terms-of-service.html">Terms</a><a href="/security-policy.html">Security</a><a href="mailto:support@balochsahab.com">Support</a><a class="back-to-top" href="#top">&uarr; Back to top</a></nav>`,
  },
];

let totalChanges = 0;
for (const file of files) {
  let html = fs.readFileSync(file, "utf8");
  let changed = false;
  for (const r of replacements) {
    if (html.includes(r.from)) {
      html = html.split(r.from).join(r.to);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(file, html);
    totalChanges++;
    console.log("patched", path.relative(root, file));
  }
}
console.log("total files patched:", totalChanges, "/", files.length);
