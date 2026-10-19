/* sexy tangent · testler: node araclar/test.js */
const assert = require("assert");
const fs = require("fs"), path = require("path");
const PR = require("../profiller.js");
const B = require("../api/bildir.js")._test;
let n = 0; const t = (ad, f) => { f(); n++; };

// Kilit ekranında görünebilecek her yerde yasak kelimeler
const YASAK = /\b(yks|tyt|ayt|sınav|sinav|ösym|osym|üniversite|itü|itu|bilecik|galata üni|ders|okul|fizik|kimya|biyoloji|matematik|türkçe|sosyal|deneme|net|iktisat|işletme|mühendis)/i;

t("dört profil var, hepsi tam", () => {
  assert.deepStrictEqual(PR.SIRA.slice().sort(), ["erhan", "salih", "samed", "taha"]);
  for (const s of PR.SIRA) { const p = PR.P[s];
    for (const k of ["ad", "tur", "renk", "renk2", "desen", "sabah", "aksam", "cumleler", "bSabah", "bAksam"]) assert.ok(p[k] != null, s + "." + k);
    assert.ok(fs.existsSync(path.join(__dirname, "..", "icons", "desen-" + p.desen + ".svg")), s + " deseni");
    assert.ok(p.cumleler.length >= 5 && p.bSabah.length >= 4 && p.bAksam.length >= 4, s + " cümleler"); }
});

const gunler = []; for (let i = 0; i < 245; i++) gunler.push(new Date((PR.gunNo(PR.BASLANGIC) + i) * 86400000).toISOString().slice(0, 10));

t("program: çakışma yok, bloklar sıralı, gece yarısını geçmiyor", () => {
  for (const s of PR.SIRA) for (const g of gunler) {
    const l = PR.gunluk(s, g); let son = -1;
    for (const b of l) { const a = PR.dk(b.s), e = PR.dk(b.b);
      assert.ok(e > a && e <= 24 * 60, s + " " + g + " " + b.ad);
      assert.ok(a >= son || !b.say || l.filter((x) => !x.say).some((x) => PR.dk(x.s) <= a && a < PR.dk(x.b)) === false, s + " " + g + " sıra");
      son = Math.max(son, a); }
    const say = l.filter((b) => b.say);
    for (let i = 0; i < say.length; i++) for (let j = i + 1; j < say.length; j++)
      assert.ok(PR.dk(say[i].b) <= PR.dk(say[j].s) || PR.dk(say[j].b) <= PR.dk(say[i].s), s + " " + g + " çakışma " + say[i].ad + "/" + say[j].ad);
    for (const b of say) for (const x of l.filter((y) => !y.say && y.tur !== "izin"))
      assert.ok(PR.dk(b.b) <= PR.dk(x.s) || PR.dk(x.b) <= PR.dk(b.s), s + " " + g + " " + b.ad + " sabit saatle çakışıyor: " + x.ad);
  }
});

t("Salih: matematik konusu yok (bakım hariç), Fizik en çok", () => {
  const say = {}; for (const g of gunler) for (const b of PR.gunluk("salih", g)) if (b.tur === "calis") say[b.ad] = (say[b.ad] || 0) + 1;
  assert.ok(!say["Matematik"]); assert.ok(say["Fizik"] >= Math.max(...Object.values(say).filter((v, i) => Object.keys(say)[i] !== "Fizik")));
});

t("Erhan: hafta içi bloklar 19:30'dan önce başlamıyor, pazar izin", () => {
  for (const g of gunler) { const w = PR.haftaGunu(g), l = PR.gunluk("erhan", g);
    if (w >= 1 && w <= 5) for (const b of l.filter((x) => x.say)) assert.ok(PR.dk(b.s) >= 19 * 60 + 30, g + " " + b.s);
    if (w === 0) assert.ok(l.every((b) => !b.say)); }
});

t("Taha: bloklar kısa (≤40 dk)", () => { for (const g of gunler) for (const b of PR.gunluk("taha", g)) if (b.tur === "calis") assert.ok(PR.dk(b.b) - PR.dk(b.s) <= 40); });

t("bildirim: her profile günde tam iki, yasak kelime yok", () => {
  for (const s of PR.SIRA) for (const g of gunler) {
    let toplam = 0;
    for (let d = 0; d < 1440; d += 5) for (const m of B.secim(s, { gun: g, dilim: d }, { gun: g, yapilan: 2, toplam: 3 })) {
      toplam++; assert.ok(!YASAK.test(m.title) && !YASAK.test(m.body), s + " " + g + ": " + m.title + " / " + m.body); }
    assert.strictEqual(toplam, 2, s + " " + g);
  }
});

t("kalan süre takvim günüyle", () => { assert.strictEqual(PR.kalan("2026-10-19"), "34 hafta 5 gün kaldı"); assert.strictEqual(PR.kalan("2027-06-12"), "1 hafta kaldı"); assert.strictEqual(PR.kalan("2027-06-19"), null); });

t("dış görünüm: başlık ve manifestte yasak kelime yok", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  assert.ok(!YASAK.test(html.match(/<title>([^<]*)/)[1]));
  const m = fs.readFileSync(path.join(__dirname, "..", "manifest.webmanifest"), "utf8"); assert.ok(!YASAK.test(m));
});

t("sürüm sw.js ile app.js'te aynı", () => {
  const a = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8").match(/SURUM = "([^"]+)"/)[1];
  const b = fs.readFileSync(path.join(__dirname, "..", "sw.js"), "utf8").match(/SURUM = "([^"]+)"/)[1];
  assert.strictEqual(a, b);
});

t("ders sayfalarında 275'e ait betik ya da raf kalmadı", () => {
  for (const f of fs.readdirSync(path.join(__dirname, "..", "oku"))) {
    const s = fs.readFileSync(path.join(__dirname, "..", "oku", f), "utf8");
    assert.ok(!/kasa\.js|esitle\.js|dosya-luks\.html|ders-ileri\.html/.test(s), f);
  }
});

console.log("tamam: " + n + " test");
