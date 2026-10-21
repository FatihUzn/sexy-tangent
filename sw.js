/* Bozkurt Ordusu · servis çalışanı: kabuk önbellekte, ders sayfaları açıldıkça önbelleğe girer; bildirim gösterir. */
const SURUM = "st-v20";
const KABUK = ["./", "index.html", "styles.css", "app.js", "profiller.js", "konular.js", "sifre.js", "lib/supabase.js", "fonts/fonts.css",
  "fonts/inter-latin-wght-normal.woff2", "fonts/fraunces-latin-opsz-italic.woff2", "manifest.webmanifest",
  "icons/ikon-192.png", "icons/desen-bogaz.svg", "icons/desen-kat.svg", "icons/desen-galata.svg", "icons/desen-zirve.svg", "icons/desen-carsi.svg", "icons/desen-kurt.svg",
  "icons/zemin-al.svg", "icons/zemin-kurt.svg", "icons/zemin-gok.svg"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(SURUM).then((c) => c.addAll(KABUK)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== SURUM).map((x) => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin || u.pathname.startsWith("/api/")) return;
  // önce ağ, olmazsa önbellek: güncelleme hemen gelir, çevrimdışı da açılır
  e.respondWith(fetch(e.request).then((r) => { if (r.ok) { const k = r.clone(); caches.open(SURUM).then((c) => c.put(e.request, k)); } return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("index.html"))));
});
self.addEventListener("push", (e) => {
  let m = {}; try { m = e.data.json(); } catch (_) { m = { title: "Bozkurt Ordusu", body: e.data ? e.data.text() : "" }; }
  const rozet = typeof m.rozet === "number" && "setAppBadge" in self.navigator ? (m.rozet > 0 ? self.navigator.setAppBadge(m.rozet) : self.navigator.clearAppBadge()).catch(() => {}) : Promise.resolve();
  e.waitUntil(Promise.all([self.registration.showNotification(m.title || "Bozkurt Ordusu", { body: m.body || "", tag: m.tag || "st", icon: "icons/ikon-192.png", badge: "icons/ikon-192.png", data: { ac: m.ac || null } }), rozet]));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const ac = e.notification.data && e.notification.data.ac;   // "mesaj": uygulama mesajlar ekranında açılır
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((l) => {
    for (const c of l) if ("focus" in c) { if (ac) c.postMessage({ ac }); return c.focus(); }
    return self.clients.openWindow(ac ? "./#" + ac : "./");
  }));
});
