/* sexy tangent · profiller ve program üreteci.
   Hem tarayıcıda (window.Profiller) hem sunucuda (require) çalışır.
   Burada yalnız program, tema ve cümleler var; kişisel veri (işaretler, netler) Supabase'de, sahibine kapalı. */
(function (kok) {
  "use strict";

  const BASLANGIC = "2026-10-19";            // 1. haftanın pazartesisi
  const SINAV = "2027-06-19";

  /* ---------- yardımcılar ---------- */
  const p2 = (n) => String(n).padStart(2, "0");
  const dk = (s) => { const p = s.split(":"); return +p[0] * 60 + +p[1]; };
  const saat = (m) => p2(Math.floor(m / 60) % 24) + ":" + p2(m % 60);
  const gunNo = (g) => Math.floor(Date.UTC(+g.slice(0, 4), +g.slice(5, 7) - 1, +g.slice(8, 10)) / 86400000);
  const haftaNo = (g) => Math.max(1, Math.floor((gunNo(g) - gunNo(BASLANGIC)) / 7) + 1);
  const haftaGunu = (g) => new Date(gunNo(g) * 86400000).getUTCDay();   // 0 Paz … 6 Cmt
  const her = [0, 1, 2, 3, 4, 5, 6], hi = [1, 2, 3, 4, 5];

  function kalan(gun) {
    const g = gunNo(SINAV) - gunNo(gun);
    if (g <= 0) return null;
    const h = Math.floor(g / 7), a = g % 7;
    return (h ? h + " hafta" : "") + (h && a ? " " : "") + (a ? a + " gün" : "") + " kaldı";
  }

  /* ---------- konu dönüşümleri ---------- */
  function tytDonus(h) {
    if (h <= 6) return ["Matematik · temel", "Türkçe", "Matematik · temel", "Türkçe", "Sosyal"];
    if (h <= 14) return ["Matematik", "Türkçe", "Fen · temel", "Matematik", "Türkçe", "Sosyal"];
    return ["Matematik", "Türkçe", "Fen", "Matematik", "Sosyal", "Türkçe", "Fen"];
  }
  function salihDonus(h) {
    if (h <= 3) return ["Fizik", "Türkçe", "Fizik", "Türkçe", "Fizik"];
    if (h <= 9) return ["Fizik", "Kimya", "Türkçe", "Fizik", "Kimya", "Türkçe", "Fizik", "Kimya"];
    if (h <= 22) return ["Fizik", "Kimya", "Türkçe", "Fizik", "Biyoloji", "Kimya", "Türkçe", "Fizik", "Kimya"];
    return ["Fizik", "Kimya", "Sosyal", "Türkçe", "Fizik", "Biyoloji", "Kimya", "Sosyal", "Türkçe"];
  }

  /* ---------- profiller ---------- */
  const P = {
    salih: {
      ad: "Salih", tur: "yks", renk: "#2F6690", renk2: "#5B8DB8", desen: "bogaz",
      etiket: "Boğaz modu",
      hedefAd: "İTÜ Matematik Mühendisliği · ~3.000",
      hedef: { TYT: { "Türkçe": 33, "Sosyal": 13, "Matematik": 40, "Fen": 18 },
               AYT: { "Matematik": 40, "Fizik": 13, "Kimya": 11, "Biyoloji": 6 } },
      sabah: 465, aksam: 1305, blokDk: 50,
      sabit: [
        { g: [1], s: "10:00", b: "12:00", ad: "Okul", tur: "ders" },
        { g: [2], s: "14:00", b: "17:00", ad: "Okul", tur: "ders" },
        { g: [3], s: "13:00", b: "15:00", ad: "Okul", tur: "ders" },
        { g: hi, s: "18:00", b: "19:30", ad: "Spor", tur: "spor" }
      ],
      mini: { g: [1, 2, 3, 4, 5, 6], s: "09:30", dk: 20, ad: "Paragraf · 20 dk" },
      pencere: { 1: [["14:00", 2]], 2: [["10:00", 2]], 3: [["10:00", 2]], 4: [["10:00", 2], ["20:30", 1]],
                 5: [["10:00", 2], ["20:30", 1]], 6: [["10:00", 3]], 0: [["11:00", 2]] },
      deneme: { g: 6, s: "10:00", b: "13:00", her: 2, ilk: 2, ad: "Deneme + analiz" },
      bakim: { g: 0, her: 2, ad: "Matematik · hız bakımı" },
      donus: salihDonus,
      oku: ["fizik", "kimya", "turkce", "biyo", "sosyal"],
      cumleler: [
        "Bilecik güzel şehir, ama sen Boğaz manzaralı birisin.",
        "Asimptot hep yaklaşır, hiç dokunmaz. Sen dokunacaksın.",
        "İstanbul seni bekliyor, ama randevuya geç kalanı beklemez.",
        "İntegrali aldın, şimdi sıra Fizik'le flörtte.",
        "Matematiği hallettin. Kalan şey sabır, o da çalışılır.",
        "Bugünkü 2 saat, haziranda Maslak'ta bir kahve."
      ],
      bSabah: [
        "Günaydın yakışıklı. Ayna bekler, kitap beklemez.",
        "Kahveni al, bugün de biraz yaklaşıyoruz.",
        "Boğaz rüyada değil, takvimde. Kalk.",
        "Teğet geçme, bugün tam değ.",
        "Bugünün planı hazır. Sen hazır mısın, çapkın?",
        "Limit yok, sadece sen ve masa.",
        "Bir fincan çay, iki blok. Anlaştık mı?",
        "Dün iyiydin. Bugün daha iyi olursun, biliyorum.",
        "Uyandıysan yarısı tamam. Diğer yarısı masada.",
        "Bu sabah seni bir şey bekliyor: ilk blok."
      ],
      bAksam: [
        "Bugün kaç soruyla flörtleştin?",
        "Günü kapat yakışıklı. Yarın yine buradayız.",
        "Bir şey bitti mi? O zaman uyku hak edildi.",
        "Yarının ilk bloğunu şimdi seç, sabah düşünme.",
        "Ekran kapansın, sen dinlen. Yarın teğet geçmek yok.",
        "Günün özeti: yaklaştın. Yarın biraz daha."
      ]
    },

    erhan: {
      ad: "Erhan", tur: "yks", renk: "#B5652B", renk2: "#D99A63", desen: "kat",
      etiket: "Kat kat yukarı",
      hedefAd: "İlk durak: TYT 60 net",
      hedef: { TYT: { "Türkçe": 25, "Sosyal": 12, "Matematik": 15, "Fen": 8 } },
      sabah: 450, aksam: 1380, blokDk: 50,
      not: "Hafta sonu düzenin netleşince cumartesi/pazar güncellenecek.",
      sabit: [{ g: hi, s: "08:00", b: "19:00", ad: "Mesai", tur: "is" }],
      mini: { g: [1, 2, 3, 4, 5, 6], s: "19:40", dk: 15, ad: "Paragraf · 15 dk", gun6: "09:40" },
      pencere: { 1: [["20:00", 3]], 2: [["20:00", 2]], 3: [["20:00", 3]], 4: [["20:00", 2]], 5: [["20:00", 3]], 6: [["10:00", 3]] },
      izin: [0],
      deneme: { g: 6, s: "10:00", b: "12:45", her: 2, ilk: 4, ad: "Deneme + analiz" },
      donus: tytDonus,
      oku: ["turkce", "sosyal", "fizik", "kimya", "biyo"],
      cumleler: [
        "Mesai bitti, asıl vardiya şimdi başlıyor.",
        "Her gün bir kat yukarı. Bu sefer yukarı çıkan sensin.",
        "Kafa çalışmaz diye bir şey yok, çalıştırılmamış kafa var.",
        "Yorgunken çözdüğün her test iki test sayılır.",
        "Bugün 40 soru, yarın başka bir hayat.",
        "Yavaş gidiyorsan sorun yok, durmadığın sürece."
      ],
      bSabah: [
        "Günaydın usta. Akşamki vardiyayı unutma.",
        "Bugün de bir kat yukarı. Asansör sende.",
        "Kolay gelsin. Akşam 8'de görüşürüz.",
        "Bugün işte yorulacaksın, biliyorum. Akşamı yine de bize ayır.",
        "Sabah selamı: akşamın planı hazır.",
        "Bir çay, bir de akşama söz. Yeter."
      ],
      bAksam: [
        "Vardiya bitti. Uyku hak edildi.",
        "Bugün kaç kat çıktın? Yarın bir fazlası.",
        "Ekranı kapat, yarın mesai var.",
        "Yorgun gün, yine de geldin. Bu kadarı bile çok şey.",
        "Günü kapat. Yarın akşam kaldığın yerden."
      ]
    },

    taha: {
      ad: "Taha", tur: "karma", renk: "#8C2F39", renk2: "#B85C66", desen: "galata",
      etiket: "Galata'dan yukarı",
      hedefAd: "İlk durak: TYT 60 net",
      hedef: { TYT: { "Türkçe": 25, "Sosyal": 12, "Matematik": 15, "Fen": 8 } },
      sabah: 480, aksam: 1350, blokDk: 40, nazik: true,
      not: "Ders programını ve spor günlerini gönderince okul saatlerin eklenecek.",
      sabit: [],
      mini: { g: her, s: "20:05", dk: 15, ad: "Paragraf · 15 dk", gun6: "10:35", gun0: "10:35" },
      pencere: { 1: [["20:30", 2]], 2: [["20:30", 2]], 3: [["20:30", 2]], 4: [["20:30", 2]], 5: [["20:30", 2]], 6: [["11:00", 2]], 0: [["11:00", 2]] },
      donus: tytDonus,
      oku: ["turkce", "sosyal", "fizik", "kimya", "biyo"],
      cumleler: [
        "Küçük adım da adımdır. Bugünkü not bitti mi? O zaman kazandın.",
        "Zor geldiyse doğru yerdesin. Bırakma, sadece yavaşla.",
        "Bir gün kaçırdın diye hafta bitmez. Yarın kaldığın yerden.",
        "Her şeyi geri kazanmanın yolu, önce kendini kazanmak.",
        "Galata güzel, ama manzaran daha da güzel olabilir.",
        "Bugün pes etmediysen bugün kazandın."
      ],
      bSabah: [
        "Günaydın. Bugün sadece küçük adımlar, o kadar.",
        "Kule yüksek ama merdiven tek tek çıkılır.",
        "Bugün kolay başla. Yeter ki başla.",
        "Galata seni selamlıyor. Akşam biraz zamanın bizim.",
        "Dün ne olduysa oldu. Bugün temiz sayfa."
      ],
      bAksam: [
        "Bir blok bile yaptıysan gün kazanıldı.",
        "Zorlandıysan normal. Yarın kaldığın yerden.",
        "Günü kapat. Yarın yine 40 dakika, o kadar.",
        "Bugün olmadıysa yarın olur. Ama yarın gerçekten.",
        "İyi geceler. Yarının ilk adımı küçük olsun."
      ]
    },

    samed: {
      ad: "Samed", tur: "uni", renk: "#5F7A3A", renk2: "#8EA866", desen: "zirve",
      etiket: "Yeniden inşa",
      sabah: 480, aksam: 1305, blokDk: 50,
      not: "Ders programın ve ders içeriklerin gelince burası dolacak.",
      sabit: [],
      mini: { g: her, s: "21:00", dk: 30, ad: "Okuma / dinleme · 30 dk" },
      pencere: {},
      donus: () => [],
      oku: [],
      cumleler: [
        "Kendini baştan kuruyorsun. Temel sağlam olsun.",
        "Bugün demiri kaldırdın, yarın hayatını kaldıracaksın.",
        "Önemli olan kimin ne dediği değil, aynada kimi gördüğün.",
        "Geçen ayki sen bugünkü seni görse şaşırırdı. Devam.",
        "Hazır bir hayatın var. Şimdi kendi kurduğun bir hayatın olsun.",
        "Disiplin, motivasyonun bittiği yerde başlar."
      ],
      bSabah: [
        "Şampiyon, bugün kimi inşa ediyoruz?",
        "Kalk, aynadaki adam bekliyor.",
        "Yeni gün, yeni tuğla.",
        "Bugün kendine bir iyilik yap: planı uygula.",
        "Zirve uzakta değil, sadece yukarıda."
      ],
      bAksam: [
        "Gün bitti. Bugün kimden daha iyiydin? Dünkü kendinden.",
        "30 dakika dinledin mi? O zaman uyku hak edildi.",
        "Günü kapat. Yarın bir tuğla daha.",
        "İyi geceler. Yarın yine yukarı."
      ]
    }
  };
  const SIRA = ["salih", "erhan", "samed", "taha"];

  /* ---------- program üreteci ---------- */
  function gunluk(slug, gun) {
    const p = P[slug]; if (!p) return [];
    const g = haftaGunu(gun), h = haftaNo(gun), liste = [];
    if (p.izin && p.izin.includes(g)) return [{ s: "10:00", b: "22:00", ad: "İzin günü · dinlen", tur: "izin", say: false }];
    for (const x of p.sabit) if (x.g.includes(g)) liste.push({ s: x.s, b: x.b, ad: x.ad, tur: x.tur, say: false });

    const denemeGunu = p.deneme && p.deneme.g === g && h >= p.deneme.ilk && (h - p.deneme.ilk) % p.deneme.her === 0;
    if (denemeGunu) liste.push({ s: p.deneme.s, b: p.deneme.b, ad: p.deneme.ad, tur: "deneme", say: true });

    if (p.mini && p.mini.g.includes(g)) {
      const s = (g === 6 && p.mini.gun6) || (g === 0 && p.mini.gun0) || p.mini.s;
      liste.push({ s, b: saat(dk(s) + p.mini.dk), ad: p.mini.ad, tur: "mini", say: true });
    }

    /* haftanın başından bu güne kadar kaç blok geçti → dönüşüm sırası kesintisiz ilerler */
    const don = p.donus(h);
    let haftalik = 0;
    for (const k in p.pencere) for (const w of p.pencere[k]) haftalik += w[1];
    let sira = (h - 1) * haftalik;                 // haftalar arası da kayar: aynı gün hep aynı ders olmaz
    for (let i = 1; i <= 7; i++) {
      const gg = i % 7; if (gg === g) break;
      for (const w of (p.pencere[gg] || [])) sira += w[1];
    }
    const bakimGunu = p.bakim && p.bakim.g === g && h % p.bakim.her === 0;
    for (const w of (p.pencere[g] || [])) {
      if (denemeGunu && dk(w[0]) < dk(p.deneme.b)) { sira += w[1]; continue; }   // deneme sabahı kaplar
      let t = dk(w[0]);
      for (let k = 0; k < w[1]; k++) {
        let ad = don.length ? don[sira % don.length] : "Çalışma";
        if (bakimGunu && k === 0 && liste.every((b) => b.ad !== p.bakim.ad)) ad = p.bakim.ad;
        liste.push({ s: saat(t), b: saat(t + p.blokDk), ad, tur: "calis", say: true });
        t += p.blokDk + 10; sira++;
      }
    }
    return liste.sort((a, b) => dk(a.s) - dk(b.s));
  }

  const api = { P, SIRA, BASLANGIC, SINAV, gunluk, kalan, haftaNo, haftaGunu, gunNo, dk, saat, p2 };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else kok.Profiller = api;
})(typeof self !== "undefined" ? self : this);
