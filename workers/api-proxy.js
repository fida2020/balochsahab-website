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
// Deploy: Cloudflare dashboard -> Workers & Pages -> balochsahab-api-proxy
// -> Edit code -> paste this file's content -> Deploy. Routes are already
// configured: Domains tab -> balochsahab.com/pb/* (Route) and
// web.balochsahab.com (Custom Domain) -> this worker.

const BACKEND_ORIGIN = "https://baloch-sahab-backend.onrender.com/api/v1";

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

    const backendPath = url.pathname.replace(/^\/pb/, "");
    const backendUrl = BACKEND_ORIGIN + backendPath + url.search;

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
