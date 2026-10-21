/* Bozkurt Ordusu · mesaj bildirimi. Mesajı yazan uygulama, kaydettikten hemen sonra burayı çağırır.
   Kilit ekranında yalnız "Yeni mesaj" yazar: kimden geldiği ve içerik görünmez (birebir mesajlar zaten şifreli, sunucu okuyamaz).
   Kötüye kullanıma karşı: çağıranın oturumu Supabase'de doğrulanır, mesajın gerçekten onun olduğu ve son 2 dakikada yazıldığı kontrol edilir. */
const webpush = require("web-push");
const PR = require("../profiller.js");
const SB_URL = "https://pqzjayxdrnpokyffyole.supabase.co";
const SB_ANAHTAR = "sb_publishable_ViJ3hRKsZVHcDpVVUA3BOw_ZOZbDMRD";

async function sb(yol, token, govde) {
  const r = await fetch(SB_URL + yol, { method: govde ? "POST" : "GET",
    headers: { apikey: SB_ANAHTAR, Authorization: "Bearer " + (token || SB_ANAHTAR), "content-type": "application/json" }, body: govde ? JSON.stringify(govde) : undefined });
  const t = await r.text();
  if (!r.ok) throw new Error(yol.split("?")[0] + " HTTP " + r.status);
  return t ? JSON.parse(t) : null;
}

/* Bu mesaj kime bildirilecek? Saf işlev: test edilir. */
function alicilar(m) {
  if (!m) return [];
  return m.kime === "herkes" ? PR.SIRA.filter((s) => s !== m.kimden) : PR.P[m.kime] ? [m.kime] : [];
}

module.exports = async (req, res) => {
  const yaz = (kod, o) => { res.statusCode = kod; res.setHeader("content-type", "application/json; charset=utf-8"); res.setHeader("cache-control", "no-store"); res.end(JSON.stringify(o)); };
  if (req.method !== "POST") return yaz(405, { hata: "POST" });
  const sifre = process.env.BILDIRIM_SIFRE; if (!sifre) return yaz(503, { hata: "BILDIRIM_SIFRE eksik" });
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  let govde = req.body; if (typeof govde === "string") { try { govde = JSON.parse(govde); } catch (e) { govde = {}; } }
  const id = parseInt(govde && govde.id, 10);
  if (!token || !id) return yaz(400, { hata: "eksik" });
  try {
    const kul = await sb("/auth/v1/user", token);
    const ben = String((kul && kul.email) || "").split("@")[0];
    const satir = (await sb("/rest/v1/st_mesaj?id=eq." + id + "&select=kimden,kime,zaman", token) || [])[0];
    if (!satir || satir.kimden !== ben) return yaz(403, { hata: "mesaj senin değil" });
    if (Date.now() - new Date(satir.zaman).getTime() > 120000) return yaz(409, { hata: "eski mesaj" });
    const kime = new Set(alicilar(satir));
    const veri = await sb("/rest/v1/rpc/st_abone_liste", null, { p_sifre: sifre });
    if (!veri.vapid || !veri.vapid.ozel) return yaz(503, { hata: "vapid yok" });
    webpush.setVapidDetails("https://" + (req.headers.host || "localhost"), veri.vapid.acik, veri.vapid.ozel);
    let ok = 0;
    for (const a of veri.aboneler || []) {
      if (!kime.has(a.slug)) continue;
      try { await webpush.sendNotification(a.abone, JSON.stringify({ title: "Bozkurt Ordusu", body: "Yeni mesaj", tag: "mesaj", ac: "mesaj" }), { TTL: 3600, urgency: "normal" }); ok++; }
      catch (e) { if (e && (e.statusCode === 404 || e.statusCode === 410)) { try { await sb("/rest/v1/rpc/st_abone_dus", null, { p_sifre: sifre, p_uc: a.abone.endpoint }); } catch (_) {} } }
    }
    return yaz(200, { gonderilen: ok });
  } catch (e) { return yaz(500, { hata: String((e && e.message) || e).slice(0, 120) }); }
};
module.exports._test = { alicilar };
