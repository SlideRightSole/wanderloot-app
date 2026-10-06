// WanderLoot service worker — installable + offline for the app shell.
// Only handles SAME-ORIGIN requests. Map tiles, fonts, Leaflet CDN and OSRM routing
// go straight to the network untouched, so the SW can never break the maps or navigation.
const CACHE = "wanderloot-v2";
const ASSETS = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-180.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // Let anything cross-origin (map tiles, fonts, CDNs, routing) bypass the SW entirely.
  if (new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)).catch(() => {}); return r; })
      .catch(() => caches.match(e.request).then(m => m || (e.request.mode === "navigate" ? caches.match("index.html") : undefined)))
  );
});
