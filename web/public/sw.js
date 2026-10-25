/* Qualité+ — service worker minimal : coquille hors-ligne. */
const CACHE = "qualite-v1";
const COQUILLE = ["/", "/etablissements", "/favoris", "/reservations", "/profil", "/connexion", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(COQUILLE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((cles) => Promise.all(cles.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET" || new URL(request.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(request).then((enCache) => {
      const reseau = fetch(request)
        .then((res) => {
          if (res.ok && (request.destination === "document" || request.url.includes("/_next/static/"))) {
            const copie = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copie));
          }
          return res;
        })
        .catch(() => enCache);
      return enCache || reseau;
    }),
  );
});
