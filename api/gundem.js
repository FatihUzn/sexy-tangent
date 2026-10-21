/* Gündem — seçili kaynakların son başlıklarını tek listede döndürür.
   Kaynak eklemek/çıkarmak için aşağıdaki KAYNAKLAR listesini düzenle.
   - telegram: herkese açık kanalın web önizlemesi (t.me/s/<kanal>) okunur.
   - rss: sitenin kendi yayın akışı.
   Sonuç Vercel'in önbelleğinde 10 dakika tutulur; kaynaklara 10 dakikada bir gidilir. */
const KAYNAKLAR = [
  { tur: "telegram", ad: "İbrahim Haskoloğlu", kanal: "ibrahimhaskologlu" },
  { tur: "rss", ad: "BBC Türkçe", url: "https://feeds.bbci.co.uk/turkce/rss.xml" },
  { tur: "rss", ad: "DW Türkçe", url: "https://rss.dw.com/rdf/rss-tur-all" },
];
const EN_FAZLA = 25;       // kaynak başına
const METIN_SINIRI = 420;  // karakter

const VARLIK = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
function coz(s) {
  return String(s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, k) => (k.toLowerCase() in VARLIK ? VARLIK[k.toLowerCase()] : m))
    .replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
function kisalt(s) { return s.length > METIN_SINIRI ? s.slice(0, METIN_SINIRI).replace(/\s+\S*$/, "") + "…" : s; }

async function getir(url) {
  const kontrol = new AbortController();
  const zaman = setTimeout(() => kontrol.abort(), 8000);
  try {
    const r = await fetch(url, { signal: kontrol.signal, headers: { "user-agent": "Mozilla/5.0 (bozkurt-gundem)", accept: "text/html,application/xml,text/xml,*/*" } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.text();
  } finally { clearTimeout(zaman); }
}

function telegramAyikla(html, k) {
  const out = [];
  const parcalar = html.split('tgme_widget_message_wrap').slice(1);
  for (const p of parcalar) {
    const post = (p.match(/data-post="([^"]+)"/) || [])[1];
    const zaman = (p.match(/<time[^>]*datetime="([^"]+)"/) || [])[1];
    const metinHam = (p.match(/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/) || [])[1];
    if (!post || !zaman) continue;
    const metin = coz(metinHam || "");
    if (!metin) continue; // yalnızca görsel/video olan gönderiler atlanır
    out.push({ kaynak: k.ad, tur: "telegram", zaman: new Date(zaman).toISOString(), metin: kisalt(metin), link: "https://t.me/" + post });
  }
  return out;
}
function rssAyikla(xml, k) {
  const out = [];
  const ogeler = xml.match(/<(item|entry)[\s>][\s\S]*?<\/\1>/g) || [];
  for (const o of ogeler) {
    const al = (ad) => (o.match(new RegExp("<" + ad + "[^>]*>([\\s\\S]*?)</" + ad + ">")) || [])[1];
    const baslik = coz(al("title"));
    let link = coz(al("link") || "");
    if (!link) link = (o.match(/<link[^>]*href="([^"]+)"/) || [])[1] || "";
    const t = al("pubDate") || al("dc:date") || al("updated") || al("published");
    const d = t ? new Date(coz(t)) : null;
    if (!baslik || !/^https?:\/\//.test(link) || !d || isNaN(d)) continue;
    out.push({ kaynak: k.ad, tur: "rss", zaman: d.toISOString(), metin: kisalt(baslik), link });
  }
  return out;
}

async function topla() {
  const sonuc = await Promise.all(KAYNAKLAR.map(async (k) => {
    try {
      const ham = await getir(k.tur === "telegram" ? "https://t.me/s/" + k.kanal : k.url);
      const l = (k.tur === "telegram" ? telegramAyikla(ham, k) : rssAyikla(ham, k))
        .sort((a, b) => (a.zaman < b.zaman ? 1 : -1)).slice(0, EN_FAZLA);
      return { ad: k.ad, tamam: l.length > 0, adet: l.length, ogeler: l, hata: l.length ? null : "öğe bulunamadı" };
    } catch (e) {
      return { ad: k.ad, tamam: false, adet: 0, ogeler: [], hata: String((e && e.message) || e).slice(0, 80) };
    }
  }));
  const ogeler = sonuc.flatMap((s) => s.ogeler).sort((a, b) => (a.zaman < b.zaman ? 1 : -1));
  return { guncel: new Date().toISOString(), kaynaklar: sonuc.map(({ ogeler, ...k }) => k), ogeler };
}

module.exports = async (req, res) => {
  const veri = await topla();
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "public, max-age=0, s-maxage=600, stale-while-revalidate=1800");
  res.statusCode = 200;
  res.end(JSON.stringify(veri));
};
module.exports._test = { telegramAyikla, rssAyikla, coz };
