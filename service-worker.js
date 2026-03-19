const CACHE_NAME = "oec-rebuilt-scouting-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./match-scouting.html",
  "./pit-scouting.html",
  "./view-data.html",
  "./styles.css",
  "./script.js",
  "./view-data.js",
  "./app-sync.js",
  "./assets/LOGO(1).png",
  "./assets/frc-4122-logo.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        return response;
      })
      .catch(() => caches.match(event.request).then((response) => response || caches.match("./index.html")))
  );
});
