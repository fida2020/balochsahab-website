# Baloch Sahab Automation — TikTok backend (Cloudflare Worker)

Backend for the real TikTok Login (OAuth) + content publishing flow used by
`/app/login.html` and `/app/dashboard.html` on the main site. Deployed as a
Cloudflare Worker attached to the **existing** `balochsahab.com` zone via
path-based Workers Routes — no new DNS record, no subdomain. GitHub Pages
keeps serving every other path on the domain exactly as before.

## Architecture

```
Browser (balochsahab.com/app/*, static, GitHub Pages)
   │ same-origin fetch, credentials: include
   ▼
Cloudflare Worker (this directory)
   routes: /auth/*  /api/*  /media/*
   │
   ├─ D1 (balochsahab-app)      users, sessions, oauth_state, posts
   ├─ R2 (balochsahab-media)    uploaded video files, served at /media/:key
   ├─ TikTok Login Kit v2       OAuth 2.0 + PKCE
   ├─ TikTok Content Posting API v2   publish-init, creator info, status
   └─ Anthropic API             server-side caption/hashtag suggestions
```

## Why a Worker, not a framework

The rest of the site has no build step beyond static HTML/CSS/JS and a
one-off PowerShell templater; this backend follows the same minimalism —
one `fetch()` router (`src/index.ts`), no web framework, no ORM. `docs/CONTACT-FORM.md`
in the site root already named Cloudflare Workers as the intended backend
option for this domain, which is why it was chosen here too.

## Security model

- TikTok access/refresh tokens are AES-256-GCM encrypted at rest in D1
  (`src/lib/crypto.ts`), keyed by the `TOKEN_ENCRYPTION_KEY` secret. They are
  never returned to the browser.
- The session cookie (`sid`) is an opaque random ID resolved server-side on
  every request (`src/lib/session.ts`) — not a JWT, carries no token
  material. `HttpOnly; Secure; SameSite=Lax`.
- The OAuth flow uses PKCE (S256) and a single-use `state` value stored in
  `oauth_state` with a short TTL, guarding against CSRF and code interception.
- All `/api/*` routes require a valid session (checked in `src/index.ts`
  before dispatch).
- `/media/:key` is intentionally public/unauthenticated — TikTok's own
  servers must be able to fetch the video over HTTPS to publish it.
- Because the Worker is same-origin with the site (Workers Routes on the
  same zone, not a separate subdomain), no CORS configuration is needed and
  no cross-origin credentialed requests are possible.

## File map

See the file tree and route table in the implementation plan
(`C:\Users\Administrator\.claude\plans\golden-mixing-sunset.md`) for the
full design rationale. Summary:

- `src/index.ts` — router (`fetch`) + cron sweep (`scheduled`)
- `src/routes/auth.ts` — OAuth start/callback/session/logout
- `src/routes/posts.ts` — post CRUD + publish (also used by the cron sweep)
- `src/routes/media.ts` — video upload to R2 + public serving
- `src/routes/creator.ts` — proxies TikTok's `creator_info/query`
- `src/routes/ai.ts` — Anthropic-backed caption/hashtag suggestions
- `src/lib/tiktok.ts` — TikTok OAuth + Content Posting API client
- `src/lib/tokens.ts` — transparent access-token refresh
- `src/lib/crypto.ts`, `session.ts`, `db.ts`, `http.ts` — infrastructure helpers
- `migrations/0001_init.sql` — D1 schema

## Known limitations (V1)

- Single TikTok account per session — no multi-account support yet.
- Publishing uses `PULL_FROM_URL` against our own `/media/*` storage, not
  TikTok's native chunked `FILE_UPLOAD` protocol.
- Defaults to the "inbox" publish target (draft delivered to the creator's
  TikTok app for them to review and post) rather than direct public
  posting, because unaudited TikTok apps have direct-post visibility
  restricted to the authorizing user regardless of the chosen privacy
  level — this will be revisited once the app passes TikTok's audit.
- No billing, no multi-user team accounts, no analytics beyond post status.
- `privacy-policy.html` / `cookie-policy.html` on the main site have not yet
  been updated to reflect this new backend (named sub-processors, session
  cookie, token retention) — pending separate approval.

See `RUNBOOK.md` for deployment steps and the testing checklist.
