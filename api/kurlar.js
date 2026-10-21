/* Kurlar — döviz, altın, gümüş. Vercel önbelleğinde 5 dakika tutulur.
   Birincil kaynak: finans.truncgil.com (serbest piyasa, altın dahil). O düşerse TCMB'nin günlük kurları (yalnız döviz).
   Bu bir yatırım aracı değil; rakamlar gecikmeli olabilir, alım-satım kararı için bankanın/kuyumcunun ekranına bak. */
const KALEMLER = [
  ["USD", "Dolar", "doviz"], ["EUR", "Euro", "doviz"], ["GBP", "Sterlin", "doviz"],
  ["gram-altin", "Gram altın", "altin"], ["ceyrek-altin", "Çeyrek", "altin"], ["yarim-altin", "Yarım", "altin"],
  ["tam-altin", "Tam", "altin"], ["cumhuriyet-altini", "Cumhuriyet", "altin"], ["22-ayar-bilezik", "22 ayar bilezik", "altin"],
  ["gram-has-altin", "Has altın", "altin"], ["ons", "Ons ($)", "altin"], ["gumus", "Gümüş (gr)", "altin"]
];

function sayi(s) {   // "6.590,99" / "$4.133,11" / "%0,28" / "%-0,12" → sayı
  if (s == null) return null;
  const t = String(s).replace(/[^\d,.\-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(t); return isNaN(n) ? null : n;
}

async function getir(url) {
  const k = new AbortController(), z = setTimeout(() => k.abort(), 7000);
  try {
    const r = await fetch(url, { signal: k.signal, headers: { "user-agent": "Mozilla/5.0 (bozkurt-kurlar)" } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.text();
  } finally { clearTimeout(z); }
}

function truncgilAyikla(j) {
  const o = typeof j === "string" ? JSON.parse(j) : j, out = [];
  for (const [kod, ad, tur] of KALEMLER) {
    const v = o[kod]; if (!v) continue;
    const al = sayi(v["Alış"]), sat = sayi(v["Satış"]);
    if (sat == null && al == null) continue;
    out.push({ kod, ad, tur, alis: al, satis: sat, degisim: sayi(v["Değişim"]) });
  }
  return { kaynak: "Truncgil", tarih: o.Update_Date || null, kalemler: out };
}

function tcmbAyikla(xml) {
  const out = [];
  for (const [kod, ad] of [["USD", "Dolar"], ["EUR", "Euro"], ["GBP", "Sterlin"]]) {
    const b = (xml.match(new RegExp('<Currency[^>]*CurrencyCode="' + kod + '"[\\s\\S]*?</Currency>')) || [])[0];
    if (!b) continue;
    const al = parseFloat((b.match(/<ForexBuying>([\d.]+)</) || [])[1]), sat = parseFloat((b.match(/<ForexSelling>([\d.]+)</) || [])[1]);
    if (isNaN(sat)) continue;
    out.push({ kod, ad, tur: "doviz", alis: isNaN(al) ? null : al, satis: sat, degisim: null });
  }
  const tarih = (xml.match(/Tarih="([^"]+)"/) || [])[1] || null;
  return { kaynak: "TCMB", tarih, kalemler: out };
}

async function topla() {
  try { const v = truncgilAyikla(await getir("https://finans.truncgil.com/today.json")); if (v.kalemler.length >= 3) return v; } catch (e) { /* yedeğe geç */ }
  try { const v = tcmbAyikla(await getir("https://www.tcmb.gov.tr/kurlar/today.xml")); if (v.kalemler.length) return v; } catch (e) { /* ikisi de düştü */ }
  return { kaynak: null, tarih: null, kalemler: [], hata: "kaynaklara ulaşılamadı" };
}

module.exports = async (req, res) => {
  const v = await topla();
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", v.kalemler.length ? "public, max-age=0, s-maxage=300, stale-while-revalidate=900" : "no-store");
  res.statusCode = 200;
  res.end(JSON.stringify({ guncel: new Date().toISOString(), ...v }));
};
module.exports._test = { sayi, truncgilAyikla, tcmbAyikla };
