/* Bozkurt Ordusu · testler: node araclar/test.js */
const assert = require("assert");
const fs = require("fs"), path = require("path");
const PR = require("../profiller.js");
const B = require("../api/bildir.js")._test;
let n = 0; const t = (ad, f) => { f(); n++; };

// Kilit ekranında görünebilecek her yerde yasak kelimeler
const YASAK = /\b(yks|tyt|ayt|sınav|sinav|ösym|osym|üniversite|itü|itu|bilecik|galata üni|ders|okul|fizik|kimya|biyoloji|matematik|türkçe|sosyal|deneme|net|iktisat|işletme|mühendis)/i;

t("altı profil var, hepsi tam", () => {
  assert.deepStrictEqual(PR.SIRA.slice().sort(), ["erhan", "fati", "fikret", "salih", "samed", "taha"]);
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

t("Erhan: hafta içi bloklar mesaiden sonra; pazar hafif (en çok 3 blok)", () => {
  for (const g of gunler) { const w = PR.haftaGunu(g), l = PR.gunluk("erhan", g);
    if (w >= 1 && w <= 5) for (const b of l.filter((x) => x.say)) assert.ok(PR.dk(b.s) >= 19 * 60 + 30, g + " " + b.s);
    if (w === 0) assert.ok(l.filter((b) => b.say).length <= 3); }
});

t("Taha: bloklar kısa (≤40 dk)", () => { for (const g of gunler) for (const b of PR.gunluk("taha", g)) if (b.tur === "calis") assert.ok(PR.dk(b.b) - PR.dk(b.s) <= 40); });

t("bildirim: her profile günde tam iki, yasak kelime yok", () => {
  for (const s of PR.SIRA) for (const g of gunler) {
    let toplam = 0;
    for (let d = 0; d < 1440; d += 5) for (const m of B.secim(s, { gun: g, dilim: d }, { gun: g, yapilan: 2, toplam: 3 })) {
      toplam++; assert.ok(!YASAK.test(m.title) && !YASAK.test(m.body), s + " " + g + ": " + m.title + " / " + m.body); }
    assert.strictEqual(toplam, PR.P[s].sessiz ? 0 : 2, s + " " + g);
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

t("oku rafları: her profilin rafı hem dosya hem RAF listesinde var", () => {
  const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  for (const s of PR.SIRA) for (const r of PR.P[s].oku) {
    assert.ok(fs.existsSync(path.join(__dirname, "..", "oku", r + ".html")), s + " " + r);
    assert.ok(new RegExp("\\b" + r + ': \\["').test(app), "RAF " + r);
  }
});

t("iş okumalarında kilit, sınav şeridi ve dış bağlantı kalıntısı yok", () => {
  for (const r of PR.P.fikret.oku) {
    const s = fs.readFileSync(path.join(__dirname, "..", "oku", r + ".html"), "utf8");
    assert.ok(s.includes("var DERS_SAYFASI=true;"), r);
    assert.ok(!/claude\.ai\/artifact|dosya-[a-z]+\.html|Dünya Nasıl İşler/.test(s), r);
  }
});

t("açık depo: yeni profillerde kişisel ayrıntı yok", () => {
  const metin = JSON.stringify(PR.P.fikret) + JSON.stringify(PR.P.fati);
  assert.ok(!/kira|dolar|\$|zengin|servet|miras|babas|yks|275|hedef/i.test(metin), "fikret/fati profil metni");
  assert.ok(!PR.P.fati.hedef && PR.P.fati.tur === "sade");
});

t("kurlar: Truncgil ve TCMB biçimleri okunur", () => {
  const K = require("../api/kurlar.js")._test;
  assert.strictEqual(K.sayi("6.590,99"), 6590.99); assert.strictEqual(K.sayi("$4.133,11"), 4133.11); assert.strictEqual(K.sayi("%-0,12"), -0.12);
  const a = K.truncgilAyikla({ Update_Date: "2026-10-21 23:00:04", USD: { "Alış": "49,5914", "Satış": "49,6075", "Değişim": "%0,08" }, "gram-altin": { "Alış": "6.593,34", "Satış": "6.594,19", "Değişim": "%0,32" } });
  assert.strictEqual(a.kalemler.length, 2); assert.strictEqual(a.kalemler[0].satis, 49.6075); assert.strictEqual(a.kalemler[1].alis, 6593.34);
  const b = K.tcmbAyikla('<Tarih_Date Tarih="21.10.2026"><Currency CrossOrder="0" Kod="USD" CurrencyCode="USD"><ForexBuying>49.5123</ForexBuying><ForexSelling>49.6015</ForexSelling></Currency></Tarih_Date>');
  assert.strictEqual(b.kalemler[0].satis, 49.6015); assert.strictEqual(b.tarih, "21.10.2026");
});

t("mesaj bildirimi: duvar herkese (yazan hariç), birebir yalnız alıcıya", () => {
  const M = require("../api/mesaj.js")._test;
  assert.deepStrictEqual(M.alicilar({ kimden: "fati", kime: "herkes" }).sort(), PR.SIRA.filter((s) => s !== "fati").sort());
  assert.deepStrictEqual(M.alicilar({ kimden: "fati", kime: "fikret" }), ["fikret"]);
  assert.deepStrictEqual(M.alicilar({ kimden: "fati", kime: "yabanci" }), []);
});

t("kendi düzeni: profil programı yerine geçer, sabit/spor işaretlenmez", () => {
  const P0 = PR.P.fikret; P0.duzen = { 4: [{ s: "09:00", b: "20:00", ad: "Dükkân", tur: "sabit" }, { s: "07:30", b: "07:45", ad: "Plan", tur: "gorev" }, { s: "21:00", b: "22:00", ad: "Salon", tur: "spor" }] };
  const l = PR.gunluk("fikret", "2026-10-22");   // Perşembe
  assert.deepStrictEqual(l.map((b) => b.ad), ["Plan", "Dükkân", "Salon"]);
  assert.deepStrictEqual(l.map((b) => b.say), [true, false, false]);
  assert.strictEqual(l[2].tur, "spor");
  assert.deepStrictEqual(PR.gunluk("fikret", "2026-10-23"), []);   // Cuma boş
  P0.duzen = null;
  assert.ok(PR.gunluk("fikret", "2026-10-22").length > 0);       // düzen yoksa profil programı
});

(async () => {
  // uçtan uca şifreleme: iki kişi okur; üçüncü kişi ve yanlış şifre okuyamaz
  const S = require("../sifre.js");
  const a = await S.yeniAnahtar("ornek-sifre-1"), b = await S.yeniAnahtar("ornek-sifre-2"), c = await S.yeniAnahtar("ornek-sifre-3");
  const m = await S.sifrele(a.ozel, b.kayit.ak, "Selam, yarın görüşelim.");
  assert.ok(m.startsWith("e1.") && !m.includes("Selam"));
  assert.strictEqual(await S.coz(b.ozel, a.kayit.ak, m), "Selam, yarın görüşelim.");
  assert.strictEqual(await S.coz(await S.kilitAc(a.kayit, "ornek-sifre-1"), b.kayit.ak, m), "Selam, yarın görüşelim.");
  await assert.rejects(S.kilitAc(a.kayit, "yanlis-sifre"));
  await assert.rejects(S.coz(c.ozel, a.kayit.ak, m));
  assert.ok(!JSON.stringify(a.kayit).includes('"d"'), "gizli anahtar açıkta değil");
  n++;
  console.log("tamam: " + n + " test");
})().catch((e) => { console.error(e); process.exit(1); });
