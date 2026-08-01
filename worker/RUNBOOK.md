# Deployment Runbook — TikTok Login + Publishing Backend

## Status (updated after live deployment)

Done, verified against production `https://balochsahab.com`:

- ✅ Wrangler installed and authenticated (Cloudflare account: shamsfida92@gmail.com)
- ✅ D1 database `balochsahab-app` created and migrated (4 tables live)
- ✅ `TOKEN_ENCRYPTION_KEY` secret generated and set
- ✅ Worker deployed and live at `balochsahab.com/auth/*`, `balochsahab.com/api/*`,
  `balochsahab.com/media/*`
  (confirmed: `GET /auth/session` → `{"connected":false}`, `GET /api/posts` → `401`,
  `GET /media/nonexistent.mp4` → our own `{"error":"not_found"}`,
  `GET /index.html` still served by GitHub Pages, untouched)
- ✅ R2 enabled, bucket `baloch-sahab-media` created and bound (`env.MEDIA`) —
  video upload/serving is live
- ✅ `workers.dev` subdomain activated, Cron Trigger attached and live
  (`schedule: */5 * * * *` confirmed in the deploy output) — scheduled
  publishing will run automatically once there are due posts
- ✅ Local repo committed (`git commit` done); not yet pushed anywhere

**Cloudflare side is fully deployed. No further dashboard clicks needed
there.** What's left needs values or a push, not clicks:

- ⛔ **`TIKTOK_CLIENT_KEY` / `TIKTOK_CLIENT_SECRET` not set** — these only
  exist once you've created/opened the app in the TikTok Developer Portal.
  See step 1.
- ⛔ **`ANTHROPIC_API_KEY` not set** — needs your Anthropic Console key. See
  step 2.
- ⛔ **Not pushed to GitHub** — this local folder has no remote configured;
  I don't have your repo URL or push access. See step 3.

## 1. TikTok Developer Portal

Full field-by-field values are in `TIKTOK_PORTAL_SUBMISSION.md` — keep it
open while you do this. Summary of what only you can do:

1. Open developers.tiktok.com, open the existing app for `balochsahab.com`
   (domain already verified — don't remove the two
   `tiktok...-site-verification` files at the site root).
2. Add **Login Kit** + **Content Posting API** products if not already added.
3. Set Redirect URI to exactly `https://balochsahab.com/auth/tiktok/callback`.
4. Request scopes `user.info.basic`, `video.publish` (+`video.upload` if
   the portal asks for it separately).
5. Copy the **Client Key** and **Client Secret**, and send them to me (or
   run `npx wrangler secret put TIKTOK_CLIENT_KEY` /
   `TIKTOK_CLIENT_SECRET` yourself from `worker/`) — I'll set them and
   redeploy the moment I have them.
6. Do not click Submit for review yet — see the testing checklist below.

## 2. Anthropic

console.anthropic.com → Settings → API Keys → create one, send it to me
(or `wrangler secret put ANTHROPIC_API_KEY` yourself). Powers the
dashboard's "AI-suggest" button only; nothing else depends on it.

## 3. Push to GitHub

The repo is already committed locally. To publish the new
`/app/login.html`, `/app/dashboard.html`, and the one-line addition to
`/app/index.html` (GitHub Pages needs this — the Worker deploy doesn't
touch static files):

```
git remote add origin <your-repo-url>
git push -u origin master
```

If you'd rather I do this part too, give me the repo URL and confirm you
want me to push — I have no push access otherwise.

---

## Testing checklist — run this yourself once everything above is done

1. Visit `https://balochsahab.com/app/index.html` — confirm the "Continue
   with TikTok" button and click through to `/app/login.html` (will 404
   until step 3/push is done).
2. Click through TikTok's consent screen, approve, confirm you land on
   `/app/dashboard.html` with a `sid` cookie set (HttpOnly/Secure/SameSite=Lax).
3. Upload a test video, use AI-suggest, check the mandatory AI-disclosure
   box, "Publish now" — confirm it reaches your TikTok inbox/drafts.
4. Schedule a second post 5-10 minutes out, confirm the cron auto-publishes it.
5. Disconnect, confirm the cookie clears and dashboard redirects to login.

Report back pass/fail and any TikTok API error codes — especially anything
about audit status, since that's the most likely early friction point.
