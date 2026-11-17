/* Tiene una copia della pagina sul telefono, così l'app si apre anche senza rete.
   Con la rete prende sempre la versione più recente; i dati non passano da qui. */
const CACHE = "inv-v1";
const PAGE = new URL("./", self.location).href;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.add(PAGE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== self.location.origin) return;
  const key = r.mode === "navigate" ? PAGE : r;
  e.respondWith((async () => {
    const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), 6000);   // segnale debole: dopo 6 s usa la copia
    try {
      const res = await fetch(r, { signal: ctrl.signal }); clearTimeout(t);
      if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(key, cp)); }
      return res;
    } catch (err) {
      clearTimeout(t);
      const hit = await caches.match(key, { ignoreSearch: true });
      if (hit) return hit;
      throw err;
    }
  })());
});
