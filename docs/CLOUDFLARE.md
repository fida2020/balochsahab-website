# Cloudflare configuration for balochsahab.com (GitHub Pages origin)

## Recommended dashboard settings

1. DNS: Proxied (orange cloud) A/CNAME to GitHub Pages
2. SSL/TLS: Full (strict) once GitHub Pages HTTPS is active
3. Always Use HTTPS: On
4. Automatic HTTPS Rewrites: On
5. TLS 1.3: On
6. Minimum TLS Version: 1.2
7. Early Hints: On
8. Brotli: On
9. Browser Cache TTL: Respect Existing Headers (or 4 hours for static assets)
10. Rocket Loader: Off recommended for Lighthouse accuracy (site already defers JS). If enabled, verify no console errors.
11. Auto Minify: CSS/JS/HTML optional (site ships minified assets)

## Transform Rules — Response Headers

Add these headers on `balochsahab.com/*`:

- Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()
- Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; script-src 'self' 'unsafe-inline' https://accounts.google.com; frame-src https://accounts.google.com; connect-src 'self' https:; form-action 'self' mailto: https:; upgrade-insecure-requests

Note: Meta CSP is also embedded in HTML for defense-in-depth. Prefer Cloudflare headers for frame-ancestors and HSTS (meta cannot set HSTS or frame-ancestors reliably).

**Important (added when the site became an earning platform):** the `script-src`/`frame-src` additions for `https://accounts.google.com` are required for the real Sign-In-with-Google button on `/login.html` and `/signup.html` (see `scripts/chrome.ps1`'s embedded CSP, which already includes them). If a Cloudflare Transform Rule is actively overriding the CSP response header with an older version of this policy, Google Sign-In will be silently blocked even though the HTML meta tag is correct — browsers enforce the intersection of the header CSP and the meta CSP. Update the live Transform Rule to match if one exists.

## API proxy Worker (for same-domain postback requirements)

Some ad/offerwall providers (AoyCo.in confirmed 2026-08-23) reject a Postback URL whose domain doesn't match the App/Website URL exactly — the real backend (`baloch-sahab-backend.onrender.com`) can't be used directly as a postback target for those. `workers/api-proxy.js` in this repo is a Cloudflare Worker (`balochsahab-api-proxy`) that proxies `balochsahab.com/pb/*` straight through to the backend's `/api/v1/*`, so a same-domain URL like `https://balochsahab.com/pb/webhooks/aoyco` can be handed to any such provider. Live and verified 2026-08-23 (`https://balochsahab.com/pb/health` returns the backend's health check).

**Path is `/pb/*`, not `/api/*`** — `balochsahab.com/api/*` is already routed to a separate, unrelated Worker called `balochsahab-app` (its own D1 database + R2 bucket, ~289 req/day, likely the EarnBox mobile app's backend, not this website's). Don't touch that worker or its routes; it's live production traffic for something else. `balochsahab-app` also owns `balochsahab.com/auth/*` and `balochsahab.com/media/*`, so avoid those prefixes for anything new too.

Deployed via the dashboard's built-in code editor (Workers & Pages → `balochsahab-api-proxy` → Edit code — NOT the GitHub-integrated build, which fails here since this repo has no `npm run build`/wrangler config). Route: Domains tab → `balochsahab.com/pb/*` → this worker. Production `*.workers.dev` URL is also enabled for direct testing. Every other path keeps going to GitHub Pages unchanged.

**`www.balochsahab.com/postback/aoyco` (added + deployed 2026-08-23):** this one path forwards to a *different* upstream — EarnBox mobile app's own real backend (`earnbox-idco-ruji.onrender.com`, a separate Render service/codebase from this website's `baloch-sahab-backend`), not this site's backend. EarnBox registered its own AoyCo.in app with App URL `https://www.balochsahab.com/download`, and AoyCo's domain-matching rule forced the Postback URL onto that same domain — but nothing was ever routed there, so every real AoyCo offerwall completion in the EarnBox app 404'd and no user was ever credited. See the comment in `workers/api-proxy.js` for the exact rewrite. Route added (Domains tab → `www.balochsahab.com/postback/aoyco` → `balochsahab-api-proxy`) and verified live: `curl https://www.balochsahab.com/postback/aoyco?test=1` returns `200 ok` (was a GitHub Pages 404 before).

## Caching

Cache Rules for `/assets/*`:
- Eligible for cache
- Edge TTL: 1 month
- Browser TTL: 1 week
- Cache key: ignore query string except version params if used

HTML pages: shorter TTL or bypass cache for fresher deploys, or purge on deploy.
