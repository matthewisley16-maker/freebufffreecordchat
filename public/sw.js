/**
 * Freecord service worker.
 *
 * Exists so the browser offers "Install app" in the address bar (a PWA needs a
 * service worker with a fetch handler), and so the app opens instantly from the
 * home screen. It is deliberately conservative:
 *
 *   - navigations are network-first: a deploy is always picked up, never a stale
 *     HTML shell;
 *   - only same-origin, hashed build files are cached, cache-first;
 *   - API calls, Convex traffic, auth and everything cross-origin are never
 *     intercepted or cached.
 */

const ASSET_CACHE = "freecord-assets-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== ASSET_CACHE).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Convex, CDNs, analytics
  if (url.pathname.startsWith("/api/")) return;

  // Pages: always try the network first, fall back to the last good copy only
  // when the network is actually unavailable.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(
            "<!doctype html><meta charset=utf-8><title>Offline</title><body style=\"font-family:system-ui;background:#0b0b10;color:#e5e7eb;padding:32px\">Freecord needs a connection to open. Please try again in a moment.</body>",
            { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } },
          );
        }
      })(),
    );
    return;
  }

  // Hashed build files and static assets: cache-first, refreshed in background.
  const isAsset =
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(css|js|png|svg|webp|woff2?|ico|webmanifest)$/.test(url.pathname);
  if (!isAsset) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(ASSET_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok && response.type === "basic") await cache.put(request, response.clone());
      return response;
    })(),
  );
});
