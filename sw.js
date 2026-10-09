// Field Report service worker: keeps the app working offline.
const V = "field-report-v7";
const FONTS = "field-report-fonts";
const SHELL = ["./", "./index.html", "./manifest.webmanifest",
  "./lib/jspdf.umd.min.js", "./lib/xlsx.full.min.js", "./lib/jszip.min.js", "./lib/qrcode.min.js",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== V && k !== FONTS).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  // App page: network first so updates arrive, cached copy when offline.
  if (r.mode === "navigate") {
    e.respondWith(fetch(r).then(res => {
      const copy = res.clone(); caches.open(V).then(c => c.put("./index.html", copy)); return res;
    }).catch(() => caches.match("./index.html")));
    return;
  }
  // App files: cache first.
  if (u.origin === location.origin) {
    e.respondWith(caches.match(r, { ignoreSearch: true }).then(hit => hit || fetch(r)));
    return;
  }
  // Google Fonts: serve cached, refresh in the background.
  if (/^fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {
    e.respondWith(caches.open(FONTS).then(async c => {
      const hit = await c.match(r);
      const net = fetch(r).then(res => { c.put(r, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    }));
  }
});
