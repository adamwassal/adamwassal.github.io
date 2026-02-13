const CACHE_NAME = "riyad-aljannah-v2";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./assets/css/style.css",
  "./assets/js/global.js",
  "./assets/js/toast_notification.js",
  "./components/header.js",
  "./components/header.html",
  "./pages/quran.html",
  "./pages/surah.html",
  "./pages/alathker.html",
  "./pages/time_prays.html",
  "./pages/radio.html",
  "./pages/ai.html",
  "./assets/images/logo.png",
  "./assets/fonts/fontawesome-free-6.6.0-web/css/all.min.css"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(async () => {
          const cachedPage = await caches.match(req);
          if (cachedPage) return cachedPage;
          const cachedHome = await caches.match("./index.html");
          if (cachedHome) return cachedHome;
          return new Response("Offline", { status: 503, statusText: "Offline" });
        })
    );
    return;
  }

  if (!isSameOrigin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
