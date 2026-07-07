// Service worker for Training Tracker (see docs/adr/0006-pwa-static-assets.md).
// Strategy: network-first for own code (index.html, frontend/*.mjs) so deploys
// are never stale; cache-first for immutable CDN assets and icons.
// Bump CACHE_VERSION when cached CDN assets change (see skills/deploy.md).

const CACHE_VERSION = "tracker-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./frontend/supabaseClient.mjs",
  "./frontend/rowConverters.mjs",
  "./frontend/businessLogic.mjs",
  "./frontend/analysis.mjs",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isOwnCode(url) {
  return url.origin === self.location.origin &&
    (url.pathname.endsWith("/") ||
     url.pathname.endsWith("index.html") ||
     url.pathname.endsWith(".mjs") ||
     url.pathname.endsWith("manifest.json"));
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET") return;
  // Never intercept Supabase API calls — auth and data must always hit network.
  if (url.hostname.endsWith(".supabase.co")) return;

  if (isOwnCode(url)) {
    // Network-first: fresh deploys win; cache is the offline fallback.
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
          return res;
        })
        .catch(() => caches.match(event.request, { ignoreSearch: true })
          .then((hit) => hit || caches.match("./index.html")))
    );
    return;
  }

  // Cache-first for everything else (CDN scripts, fonts, icons).
  event.respondWith(
    caches.match(event.request).then((hit) =>
      hit ||
      fetch(event.request).then((res) => {
        // Cache successful and opaque (cross-origin no-cors) responses.
        if (res.ok || res.type === "opaque") {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
        }
        return res;
      })
    )
  );
});
