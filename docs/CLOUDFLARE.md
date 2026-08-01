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
- Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; script-src 'self' 'unsafe-inline'; connect-src 'self' https:; form-action 'self' mailto: https:; upgrade-insecure-requests

Note: Meta CSP is also embedded in HTML for defense-in-depth. Prefer Cloudflare headers for frame-ancestors and HSTS (meta cannot set HSTS or frame-ancestors reliably).

## Caching

Cache Rules for `/assets/*`:
- Eligible for cache
- Edge TTL: 1 month
- Browser TTL: 1 week
- Cache key: ignore query string except version params if used

HTML pages: shorter TTL or bypass cache for fresher deploys, or purge on deploy.
