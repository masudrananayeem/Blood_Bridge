// Cloudflare Pages Function — server-side proxy for /api/*.
//
// The browser only ever talks to the Pages origin; this function forwards
// the request to the real backend, so the backend URL never appears in the
// client bundle or the browser's Network tab. The origin is read from the
// `API_ORIGIN` environment variable set in the Pages dashboard (server-side
// only, never shipped to the browser).
export async function onRequest({ request, env }) {
  const origin = env.API_ORIGIN;
  if (!origin) {
    return new Response("API_ORIGIN environment variable is not set", { status: 500 });
  }
  const url = new URL(request.url);
  const target = new URL(url.pathname + url.search, origin);
  return fetch(new Request(target, request));
}
