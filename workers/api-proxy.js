// Cloudflare Worker "balochsahab-api-proxy": proxies balochsahab.com/pb/*
// to the real backend, so third-party postback providers (AoyCo, and any
// future one with the same "postback domain must match app domain" rule)
// can be given a balochsahab.com URL even though the backend itself runs
// on Render.
//
// NOTE: this uses /pb/* rather than /api/* because balochsahab.com/api/*
// is already routed to a separate, unrelated Worker ("balochsahab-app" —
// its own D1/R2-backed backend, not this website's) — /api/* is taken.
//
// Deploy: Cloudflare dashboard -> Workers & Pages -> balochsahab-api-proxy
// -> Edit code -> paste this file's content -> Deploy. Route is already
// configured: Domains tab -> balochsahab.com/pb/* -> this worker.

const BACKEND_ORIGIN = "https://baloch-sahab-backend.onrender.com/api/v1";

export default {
  async fetch(request) {
    const url = new URL(request.url);
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
