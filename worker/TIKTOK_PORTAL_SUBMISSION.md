# TikTok Developer Portal — exact fields to enter

Everything below is copy-paste ready, generated directly from the deployed
code (verified against a live local run of the Worker, not guessed). Have
this open next to the TikTok Developer Portal and paste as you go.

---

## App basics

| Field | Value |
|---|---|
| App name | Baloch Sahab Automation |
| Category | Business / Content creation tools *(pick whichever your portal instance offers closest to this — TikTok's exact category list varies by account type)* |
| Website URL | `https://balochsahab.com` |
| App icon | `https://balochsahab.com/assets/img/logo-512.png` |
| Terms of Service URL | `https://balochsahab.com/terms-of-service.html` |
| Privacy Policy URL | `https://balochsahab.com/privacy-policy.html` |
| Short description | AI-assisted content creation, scheduling and publishing platform for creators and businesses. Users connect only their own TikTok account and remain fully in control of what gets reviewed and posted. |

## Products to add

- **Login Kit**
- **Content Posting API**

## Login Kit configuration

| Field | Value |
|---|---|
| Redirect URI | `https://balochsahab.com/auth/tiktok/callback` |
| Platform | Web |

This exact value was confirmed by running the deployed OAuth-start route
locally and inspecting the real redirect it produces:

```
https://www.tiktok.com/v2/auth/authorize/?client_key=...&response_type=code
&scope=user.info.basic%2Cvideo.publish
&redirect_uri=https%3A%2F%2Fbalochsahab.com%2Fauth%2Ftiktok%2Fcallback
&state=...&code_challenge=...&code_challenge_method=S256
```

If the value you enter in the portal doesn't byte-for-byte match
`https://balochsahab.com/auth/tiktok/callback`, the OAuth callback will fail
with a `redirect_uri_mismatch` error — this is the single most common TikTok
app-review rejection cause, so double check for trailing slashes.

## Scopes to request

| Scope | Why (paste into the portal's justification field if asked) |
|---|---|
| `user.info.basic` | Identifies which of the user's own TikTok accounts is connected (display name + avatar) so they can confirm the right account before publishing anything. |
| `video.publish` | Lets the authenticated creator publish, or schedule for later publishing, their own reviewed video content to their own TikTok account — or deliver it to their TikTok inbox for final review, depending on the app's audit status. No content is ever posted without the account owner having authenticated and reviewed it first. |

If your portal's Content Posting API product additionally requires
`video.upload` as a separate scope for the inbox/review delivery target,
request that too — the code already sends whichever scopes you configure in
`buildAuthorizeUrl` (`worker/src/lib/tiktok.ts`); no code change needed if
you add a scope, only an update to `TIKTOK_REDIRECT_URI`'s neighboring scope
string in that file if the default `user.info.basic,video.publish` isn't
sufficient.

## Content Posting API disclosures already implemented in code

These are asked about during TikTok's review — the answer for all of them
is "yes, implemented," verifiable in `worker/src/lib/tiktok.ts` and
`app/dashboard.html`:

- ✅ AI-generated content disclosure (`is_aigc`) — a mandatory checkbox in
  the dashboard's create-post form; the backend rejects post creation if
  it isn't checked (`worker/src/routes/posts.ts`).
- ✅ Branded content toggle (`brand_content_toggle`).
- ✅ Privacy level is read from TikTok's own `creator_info/query` response
  for the connected account, not hardcoded — the dashboard shows only the
  options TikTok itself says are valid for that creator.
- ✅ Duet / Comment / Stitch disable controls, passed through per-post.
- ✅ Unaudited-app visibility restriction handled: the app defaults every
  post to the "inbox" delivery target (`MEDIA_UPLOAD` post_mode) rather
  than assuming direct public posting works pre-audit.

## Reviewer test instructions (paste into the "how to test" field)

```
1. Visit https://balochsahab.com/app/login.html
2. Click "Continue with TikTok" and log in with a TikTok test/sandbox account.
3. Approve the requested permissions.
4. On the dashboard, upload a short test video, optionally use "AI-suggest"
   to generate a caption/hashtags, check the "This content is AI-generated"
   box (required), choose "Publish now".
5. The video is delivered via the Content Posting API to the connected
   account's TikTok inbox for the creator's own final review and posting
   (expected behavior for an unaudited app) — check the TikTok app's
   notifications/inbox on the test account used in step 2.
```

## What's NOT ready to submit yet

Do not click Submit for Review until the RUNBOOK.md testing checklist has
actually been run once, live, end to end, and passed — TikTok reviewers
routinely reject apps whose redirect URI 404s or whose OAuth flow errors on
first contact, which is exactly what will happen if this submission goes in
before the Worker is deployed.
