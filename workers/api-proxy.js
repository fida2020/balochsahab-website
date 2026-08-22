// Cloudflare Worker: proxies balochsahab.com/api/* to the real backend, so
// third-party postback providers (AoyCo, and any future one with the same
// "postback domain must match app domain" rule) can be given a
// balochsahab.com URL even though the backend itself runs on Render.
//
// Deploy: Cloudflare dashboard -> Workers & Pages -> Create Worker -> paste
// this file's content -> Deploy. Then Workers Routes -> add route
// "balochsahab.com/api/*" -> this worker. GitHub Pages keeps serving every
// other path unchanged.

const BACKEND_ORIGIN = "https://baloch-sahab-backend.onrender.com/api/v1";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const backendPath = url.pathname.replace(/^\/api/, "");
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
