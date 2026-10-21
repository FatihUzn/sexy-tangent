/* Bozkurt Ordusu · anlık bildirim gönderici. Supabase'deki zamanlayıcı 5 dakikada bir çağırır (x-sifre başlığıyla).
   Her profile günde iki bildirim: sabah ve gün sonu (saatler profiller.js'te).
   Gizlilik: kilit ekranında okunur; sınav, ders, okul ya da bölüm adı hiçbir zaman yazmaz.
   Tek ortam değişkeni (Vercel → Settings → Environment Variables):
     BILDIRIM_SIFRE  zamanlayıcının kullandığı şifre (gizli, en az 24 karakter; Supabase kurulumundaki ile aynı)
   İmza anahtarları (VAPID) ilk çağrıda burada üretilir ve Supabase'e bir kez yazılır: elle taşınan anahtar yok. */
const webpush = require("web-push");
const PR = require("../profiller.js");

const SB_URL = "https://pqzjayxdrnpokyffyole.supabase.co";
const SB_ANAHTAR = "sb_publishable_ViJ3hRKsZVHcDpVVUA3BOw_ZOZbDMRD";
const SAAT_FARKI = 3;   // Türkiye, yaz-kış aynı

function simdiTR(ms) {
  const d = new Date((ms || Date.now()) + SAAT_FARKI * 3600000);
  const dk = d.getUTCHours() * 60 + d.getUTCMinutes();
  return { gun: d.toISOString().slice(0, 10), dilim: Math.floor(dk / 5) * 5 };
}

/* Bu 5 dakikalık dilimde bu profile ne gidecek? Saf işlev: test edilir. */
function secim(slug, z, ozet) {
  const p = PR.P[slug]; if (!p || p.sessiz) return [];   // sessiz profil günlük bildirim almaz (mesaj bildirimi ayrı)
  const n = PR.gunNo(z.gun), out = [];
  if (z.dilim === p.sabah) {
    const bl = PR.gunluk(slug, z.gun), say = bl.filter((b) => b.say).length;
    const izin = bl.some((b) => b.tur === "izin");
    const title = (p.tur === "yks" || p.tur === "karma") ? (PR.kalan(z.gun) || "Günaydın") : "Günaydın";
    const body = izin ? "Bugün izin günün. Dinlen, yarın devam." : p.bSabah[n % p.bSabah.length] + (say ? " Bugün " + say + " blok." : "");
    const m = { title, body, tag: "sabah" };
    if (p.tur === "yks" || p.tur === "karma") { const g = PR.gunNo(PR.SINAV) - n; m.rozet = g <= 0 ? 0 : g >= 7 ? Math.floor(g / 7) : g; }   // ikondaki sayı: kalan hafta
    out.push(m);
  }
  if (z.dilim === p.aksam) {
    const satir = p.bAksam[n % p.bAksam.length];
    let body = satir;
    if (ozet && ozet.gun === z.gun && typeof ozet.yapilan === "number" && ozet.toplam) {
      const y = ozet.yapilan, t = ozet.toplam;
      body = (y >= t ? y + "/" + t + ", tam gün. " : y + "/" + t + ". ") + satir;
    }
    out.push({ title: PR.haftaGunu(z.gun) === 0 ? "Hafta kapandı" : "Gün sonu", body: PR.haftaGunu(z.gun) === 0 ? body + " Haftanın özeti uygulamada." : body, tag: "aksam" });
  }
  return out;
}

async function rpc(ad, govde) {
  const r = await fetch(SB_URL + "/rest/v1/rpc/" + ad, { method: "POST",
    headers: { apikey: SB_ANAHTAR, Authorization: "Bearer " + SB_ANAHTAR, "content-type": "application/json" }, body: JSON.stringify(govde) });
  const t = await r.text();
  if (!r.ok) throw new Error(ad + " HTTP " + r.status + " " + t.slice(0, 120));
  return t ? JSON.parse(t) : null;
}

module.exports = async (req, res) => {
  const yaz = (kod, o) => { res.statusCode = kod; res.setHeader("content-type", "application/json; charset=utf-8"); res.setHeader("cache-control", "no-store"); res.end(JSON.stringify(o)); };
  const sifre = process.env.BILDIRIM_SIFRE;
  if (!sifre) return yaz(503, { hata: "BILDIRIM_SIFRE eksik" });
  if (req.headers["x-sifre"] !== sifre) return yaz(401, { hata: "yetkisiz" });
  try {
    let govde = req.body; if (typeof govde === "string") { try { govde = JSON.parse(govde); } catch (e) { govde = {}; } }
    let veri = await rpc("st_abone_liste", { p_sifre: sifre });
    if (!veri.vapid || !veri.vapid.ozel) {
      const k = webpush.generateVAPIDKeys();
      await rpc("st_vapid_kaydet", { p_sifre: sifre, p_acik: k.publicKey, p_ozel: k.privateKey });
      veri = await rpc("st_abone_liste", { p_sifre: sifre });   // aynı anda iki çağrı olduysa ilk yazılan geçerli
    }
    const z = simdiTR(), ozet = veri.ozet || {};
    webpush.setVapidDetails("https://" + (req.headers.host || "localhost"), veri.vapid.acik, veri.vapid.ozel);
    let ok = 0, dusen = 0, mesaj = 0;
    for (const a of veri.aboneler || []) {
      const liste = govde && govde.deneme ? [{ title: "Bozkurt Ordusu", body: "Bildirim hattı çalışıyor.", tag: "deneme" }] : secim(a.slug, z, ozet[a.slug]);
      for (const m of liste) {
        mesaj++;
        try { await webpush.sendNotification(a.abone, JSON.stringify(m), { TTL: 900, urgency: "high" }); ok++; }
        catch (e) { if (e && (e.statusCode === 404 || e.statusCode === 410)) { dusen++; try { await rpc("st_abone_dus", { p_sifre: sifre, p_uc: a.abone.endpoint }); } catch (_) {} } }
      }
    }
    return yaz(200, { dilim: z.dilim, mesaj, gonderilen: ok, dusen, abone: (veri.aboneler || []).length });
  } catch (e) { return yaz(500, { hata: String((e && e.message) || e).slice(0, 160) }); }
};
module.exports._test = { secim, simdiTR };
