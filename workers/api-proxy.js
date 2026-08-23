// Cloudflare Worker "balochsahab-api-proxy": proxies /pb/* on both
// balochsahab.com and web.balochsahab.com to the real backend, so
// third-party postback providers (AoyCo, TimeWall, and any future one with
// the same "postback domain must match app domain" rule) can be given a
// same-domain URL even though the backend itself runs on Render.
//
// NOTE: this uses /pb/* rather than /api/* because balochsahab.com/api/*
// is already routed to a separate, unrelated Worker ("balochsahab-app" —
// its own D1/R2-backed backend, not this website's) — /api/* is taken.
//
// web.balochsahab.com is a dedicated Custom Domain on this same worker,
// added when AoyCo.in refused a second app registration on the bare apex
// domain (already claimed by two unrelated pre-existing apps, Taskrush and
// Earnbox) — see the "Subdomain trick" note in cloudflare_infra memory.
// Since that whole subdomain is served by this worker (nothing falls
// through to GitHub Pages), each provider's one-time domain-verification
// file needs a hardcoded special-case here.
//
// /postback/aoyco on www.balochsahab.com: the EarnBox mobile app (a
// SEPARATE codebase/backend, see Desktop/Earn Box/earnbox) registered its
// own AoyCo.in app with App URL https://www.balochsahab.com/download —
// AoyCo's domain-matching rule forced its Postback URL onto that same
// www.balochsahab.com domain too, but nothing was ever routed there, so
// every real AoyCo offerwall completion in the EarnBox app 404'd silently
// and no reward was ever credited (found 2026-08-23). This forwards that
// exact already-registered URL to EarnBox's real backend
// (earnbox-idco-ruji.onrender.com) instead of the website's own backend —
// intentionally a different upstream than /pb/*, which stays wired to this
// website's backend only.
//
// Deploy: Cloudflare dashboard -> Workers & Pages -> balochsahab-api-proxy
// -> Edit code -> paste this file's content -> Deploy. Routes: Domains tab
// -> balochsahab.com/pb/* (Route), web.balochsahab.com (Custom Domain), and
// www.balochsahab.com/postback/aoyco (Route) -> this worker. All three
// live and verified 2026-08-23.

const BACKEND_ORIGIN = "https://baloch-sahab-backend.onrender.com/api/v1";
const EARNBOX_BACKEND_ORIGIN = "https://earnbox-idco-ruji.onrender.com/api/v1";

// AoyCo.in domain-verification file for web.balochsahab.com (one-time proof
// of ownership during app registration; safe to leave in place afterward).
const VERIFICATION_FILES = {
  "/offerwall-verification-J1hQW5camnar5Rqp2THnLbdwKzxZrsjg.txt": "J1hQW5camnar5Rqp2THnLbdwKzxZrsjg",
};

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (Object.prototype.hasOwnProperty.call(VERIFICATION_FILES, url.pathname)) {
      return new Response(VERIFICATION_FILES[url.pathname], { headers: { "content-type": "text/plain" } });
    }

    let backendUrl;
    if (url.pathname === "/postback/aoyco") {
      // Already the exact URL sitting in AoyCo's dashboard for the EarnBox
      // app (see comment above) — rewritten to EarnBox's real webhook path
      // (backend/src/routes/webhook.routes.ts: GET /webhooks/aoyco/postback)
      // rather than changed at the source, since AoyCo requires the
      // postback domain to keep matching that app's registered App URL.
      backendUrl = EARNBOX_BACKEND_ORIGIN + "/webhooks/aoyco/postback" + url.search;
    } else {
      const backendPath = url.pathname.replace(/^\/pb/, "");
      backendUrl = BACKEND_ORIGIN + backendPath + url.search;
    }

    const init = {
      method: request.method,
      headers: request.headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
    };

    const response = await fetch(backendUrl, init);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  },
};
