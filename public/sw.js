const CACHE_VERSION = "arbeitflow-v1";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const ASSET_CACHE = `${CACHE_VERSION}-assets`;
const scopeUrl = self.registration.scope;
const offlineUrl = new URL("index.html", scopeUrl).href;
const apiPath = new URL("api/", scopeUrl).pathname;
const assetsPath = new URL("assets/", scopeUrl).pathname;
const iconsPath = new URL("icons/", scopeUrl).pathname;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const shellResponse = await fetch(offlineUrl, { cache: "reload" });
      if (!shellResponse.ok) {
        throw new Error("Unable to precache the application shell.");
      }

      const shellHtml = await shellResponse.clone().text();
      const shellAssets = Array.from(
        shellHtml.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g),
        (match) => new URL(match[1], scopeUrl).href,
      );
      const cache = await caches.open(SHELL_CACHE);

      await cache.put(offlineUrl, shellResponse);
      await cache.addAll([
        ...shellAssets,
        new URL("manifest.webmanifest", scopeUrl).href,
        new URL("icons/icon.svg", scopeUrl).href,
      ]);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith("arbeitflow-") &&
                key !== SHELL_CACHE &&
                key !== ASSET_CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const requestUrl = new URL(request.url);

  if (
    request.method !== "GET" ||
    requestUrl.origin !== self.location.origin ||
    requestUrl.pathname.startsWith(apiPath)
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            return caches.open(SHELL_CACHE).then((cache) => {
              cache.put(offlineUrl, response.clone());
              return response;
            });
          }

          return response;
        })
        .catch(() => caches.match(offlineUrl).then((cached) => cached || Response.error())),
    );
    return;
  }

  if (
    requestUrl.pathname.startsWith(assetsPath) ||
    requestUrl.pathname.startsWith(iconsPath) ||
    requestUrl.pathname.endsWith(".webmanifest")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }

        return fetch(request).then((response) => {
          if (response.ok) {
            const responseCopy = response.clone();
            return caches.open(ASSET_CACHE).then((cache) => {
              cache.put(request, responseCopy);
              return response;
            });
          }

          return response;
        });
      }),
    );
  }
});
