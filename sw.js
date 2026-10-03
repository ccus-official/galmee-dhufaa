/* Service worker: app fi Firebase SDK interneet malee akka banamu gochuuf */
const CACHE = "galmee-v8";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const same = url.origin === self.location.origin;
  // Firestore / Auth (googleapis.com) hin tuqamu: Firebase ofumaan interneet malee ni hojjeta.
  if (!same && url.hostname !== "www.gstatic.com") return;

  if (same) {
    // App: duraan kuusaa irraa kenna, duubaan haaromsa (stale-while-revalidate)
    e.respondWith(
      caches.match(e.request).then((hit) => {
        const net = fetch(e.request).then((res) => {
          if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
          return res;
        }).catch(() => hit || caches.match("./index.html"));
        return hit || net;
      })
    );
  } else {
    // Firebase SDK (gstatic, version irratti qabame): kuusaa duraan
    e.respondWith(
      caches.match(e.request).then((hit) =>
        hit || fetch(e.request).then((res) => {
          if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
          return res;
        })
      )
    );
  }
});
