/* Bozkurt Ordusu · uygulama
   Giriş: Supabase Auth (profil başına bir hesap). Veri önce telefonda tutulur, sonra st_veri tablosuna eşitlenir;
   satır güvenliği yüzünden herkes yalnız kendi satırını görür. */
(function () {
  "use strict";
  const SURUM = "st-v19";
  const SB_URL = "https://pqzjayxdrnpokyffyole.supabase.co";
  const SB_ANAHTAR = "sb_publishable_ViJ3hRKsZVHcDpVVUA3BOw_ZOZbDMRD";
  const ALAN = "@sexy-tangent.app";
  const PR = window.Profiller, P = PR.P;
  const GUNLER = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  const KISA = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
  const RAF = {
    mat: ["Matematik", "Sayılardan olasılığa, 48 parça"], geo: ["Geometri", "Açıdan çembere, TYT kısmı"],
    turkce: ["Türkçe", "Paragraf, anlam, dil bilgisi"], sosyal: ["Sosyal", "Tarih, coğrafya, felsefe, din"],
    fizik: ["Fizik", "Hareketten modern fiziğe"], kimya: ["Kimya", "Atomdan organiğe"], biyo: ["Biyoloji", "Hücreden ekolojiye"],
    tahsilat: ["Tahsilat", "Alacak, çek, senet, vade"], pazarlik: ["Pazarlık", "Masada ne söylenir, ne söylenmez"],
    ortaklik: ["Ortaklık", "Ortakla iş, sözleşme, ayrılık"], sirket: ["Şirket", "Şahıs mı, limited mi, kâr nasıl çekilir"],
    banka: ["Banka", "Kredi, faiz, teminat, POS"], para: ["Para", "Enflasyon, kur, birikim, risk"]
  };

  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const kac = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function tost(m) { const t = $("tost"); t.textContent = m; t.classList.add("on"); clearTimeout(tost.z); tost.z = setTimeout(() => t.classList.remove("on"), 2600); }

  let sb = null;
  try { sb = window.supabase.createClient(SB_URL, SB_ANAHTAR, { auth: { persistSession: true, autoRefreshToken: true, storageKey: "st-oturum" } }); } catch (e) { console.error(e); }

  /* ---------- zaman ---------- */
  function bugun() { const d = new Date(Date.now() + 3 * 3600000); return d.toISOString().slice(0, 10); }   // Türkiye saati
  function simdiDk() { const d = new Date(Date.now() + 3 * 3600000); return d.getUTCHours() * 60 + d.getUTCMinutes(); }
  function gunEkle(g, n) { return new Date((PR.gunNo(g) + n) * 86400000).toISOString().slice(0, 10); }
  function haftaBasi(g) { const w = PR.haftaGunu(g); return gunEkle(g, -((w + 6) % 7)); }

  /* ---------- durum ---------- */
  let slug = null, uid = null, V = null, yazZ = null;
  const anahtar = () => "st:" + slug;
  function yukle() { try { V = JSON.parse(localStorage.getItem(anahtar()) || "null"); } catch (e) { V = null; } V = V || { isaret: {}, denemeler: [], _t: 0 }; V.isaret = V.isaret || {}; V.denemeler = V.denemeler || []; }
  function kaydet() {
    V._t = Date.now();
    const g = bugun(), bl = PR.gunluk(slug, g).filter((b) => b.say);
    V.bugun_ozet = { gun: g, toplam: bl.length, yapilan: bl.filter((b) => (V.isaret[g] || {})[b.s]).length };
    try { localStorage.setItem(anahtar(), JSON.stringify(V)); } catch (e) {}
    clearTimeout(yazZ); yazZ = setTimeout(esitleYaz, 1200);
  }
  async function esitleYaz() {
    if (!sb || !uid) return;
    const { error } = await sb.from("st_veri").upsert({ uid, slug, veri: V, guncel: new Date().toISOString() });
    if (error) console.warn("eşitleme", error.message);
  }
  async function esitleOku() {
    if (!sb || !uid) return;
    const { data, error } = await sb.from("st_veri").select("veri").eq("uid", uid).maybeSingle();
    if (error) { console.warn("eşitleme", error.message); return; }
    if (data && data.veri && (data.veri._t || 0) > (V._t || 0)) { V = data.veri; V.isaret = V.isaret || {}; V.denemeler = V.denemeler || []; try { localStorage.setItem(anahtar(), JSON.stringify(V)); } catch (e) {} ciz(); }
    else if (V._t) esitleYaz();
  }

  /* ---------- tema ---------- */
  function tema(s) {
    const p = P[s], r = document.documentElement.style;
    r.setProperty("--desen", "url(icons/desen-" + (p ? p.desen : "bogaz") + ".svg)");
  }
  /* Görünüm: oto (gündüz Mermer, telefon koyu modda Gece Yolu) · mermer · yol. Telefonda saklanır, ders sayfaları da okur. */
  const KOYU = window.matchMedia("(prefers-color-scheme: dark)");
  function gorunum() { let g = "oto"; try { g = localStorage.getItem("st-gorunum") || "oto"; } catch (e) {} return ["oto", "mermer", "yol"].includes(g) ? g : "oto"; }
  function gorunumUygula() {
    const g = gorunum(), t = g === "oto" ? (KOYU.matches ? "yol" : "mermer") : g;
    document.documentElement.dataset.tema = t;
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = { mermer: "#E6F2F3", yol: "#111214" }[t];
    for (const b of document.querySelectorAll(".secim button")) b.classList.toggle("on", b.dataset.g === g);
  }
  KOYU.addEventListener && KOYU.addEventListener("change", gorunumUygula);
  gorunumUygula();
  for (const b of document.querySelectorAll(".secim button")) b.onclick = () => { try { localStorage.setItem("st-gorunum", b.dataset.g); } catch (e) {} gorunumUygula(); };

  function avatar(e, s) { e.textContent = P[s].ad[0]; }

  /* ---------- ekranlar ---------- */
  function goster(id) { for (const e of ["giris", "yeniSifre", "uyg"]) $(e).hidden = e !== id; window.scrollTo(0, 0); }

  function girisCiz() {
    tema(null); goster("giris");
    const k = $("profiller"); k.innerHTML = "";
    for (const s of PR.SIRA) {
      const p = P[s], b = el("button", "profil");
      b.style.setProperty("--p", p.renk); b.style.setProperty("--p2", p.renk2); b.style.setProperty("--pd", "url(icons/desen-" + p.desen + ".svg)");
      b.innerHTML = '<div class="kutu"><b>' + p.ad[0] + "</b></div><span>" + p.ad + "</span>";
      b.onclick = () => sifreSor(s);
      k.appendChild(b);
    }
  }
  let secili = null;
  function sifreSor(s) {
    secili = s; tema(s);
    avatar($("girisAvatar"), s); $("girisAd").textContent = "Selam " + P[s].ad;
    $("girisKullanici").value = s + ALAN; $("girisSifre").value = ""; $("girisHata").hidden = true;
    $("sifreKart").hidden = false; setTimeout(() => $("girisSifre").focus(), 60);
  }
  $("girisKapat").onclick = () => { $("sifreKart").hidden = true; tema(null); };
  $("sifreKart").onclick = (e) => { if (e.target === $("sifreKart")) $("girisKapat").onclick(); };
  $("girisForm").onsubmit = async (e) => {
    e.preventDefault();
    if (!sb) return hata("girisHata", "Bağlantı kurulamadı. İnternetini kontrol et.");
    $("girisBtn").disabled = true; $("girisBtn").textContent = "…";
    const { data, error } = await sb.auth.signInWithPassword({ email: secili + ALAN, password: $("girisSifre").value });
    $("girisBtn").disabled = false; $("girisBtn").textContent = "Gir";
    if (error) return hata("girisHata", /invalid/i.test(error.message) ? "Şifre tutmadı. Bir daha dene." : "Giriş olmadı: " + error.message);
    $("sifreKart").hidden = true; oturumAc(data.user);
  };
  function hata(id, m) { $(id).textContent = m; $(id).hidden = false; }

  $("sifreForm").onsubmit = async (e) => {
    e.preventDefault();
    const a = $("ys1").value, b = $("ys2").value;
    if (a.length < 6) return hata("ysHata", "En az 6 karakter.");
    if (a !== b) return hata("ysHata", "İki şifre aynı değil.");
    const bt = $("ysBtn"); bt.disabled = true; bt.textContent = "Kaydediliyor…";
    let error = null;
    try { ({ error } = await sb.auth.updateUser({ password: a, data: { sifre_degisti: true } })); } catch (x) { error = x; }
    bt.disabled = false; bt.textContent = "Kaydet";
    if (error) {
      const m = String(error.message || error);
      return hata("ysHata", /different|same/i.test(m) ? "Yeni şifre eskisinden farklı olmalı."
        : /reauth|nonce/i.test(m) ? "Sunucu bu değişiklik için ek doğrulama istiyor. Fati'ye haber ver."
        : /weak|least/i.test(m) ? "Şifre çok zayıf; biraz uzat." : "Kaydedilemedi: " + m);
    }
    try { localStorage.setItem("st-sd:" + uid, "1"); } catch (x) {}
    try { await sb.auth.refreshSession(); } catch (x) {}
    $("ys1").value = $("ys2").value = ""; $("ysHata").hidden = true; tost("Şifren kaydedildi."); uygAc();
  };

  async function oturumAc(user) {
    const s = (user.email || "").split("@")[0];
    if (!P[s]) { tost("Bu hesap için profil yok."); sb.auth.signOut(); return girisCiz(); }
    slug = s; uid = user.id; tema(s); yukle();
    let degisti = user.user_metadata && user.user_metadata.sifre_degisti;
    if (!degisti && sb) {   // telefondaki oturum eski olabilir: sunucudan taze bilgiyi al
      try { const { data } = await sb.auth.getUser(); degisti = data && data.user && data.user.user_metadata && data.user.user_metadata.sifre_degisti; } catch (x) {}
    }
    if (!degisti) { try { degisti = localStorage.getItem("st-sd:" + uid) === "1"; } catch (x) {} }
    if (!degisti) { avatar($("ysAvatar"), s); goster("yeniSifre"); return; }
    uygAc();
  }
  function uygAc() {
    goster("uyg"); ozel = null; mesajlar = []; mesajSon = 0; mKonu = null; cozulmus = {}; sonRozet = null;
    navCiz(); ciz(); esitleOku(); bildirimDurum(); mesajBasla();
    if (location.hash === "#mesaj") { history.replaceState(null, "", location.pathname); sekmeAc("mesaj"); }
    else if (!V.tanitim) setTimeout(tanitimAc, 400);
  }

  /* ---------- kullanım tanıtımı: ilk girişte bir kez, sonra Ayar'dan ---------- */
  function tanitimSayfalari() {
    const p = P[slug], t = p.tur, l = [];
    l.push(["Hoş geldin " + p.ad, "Burası senin sayfan. Sadece sen görürsün: işaretlerin ve notların senin hesabında durur, başka profiller açamaz."]);
    const mesajS = ["Mesajlar", "Sağ üstteki zarf. <b>Ortak duvar</b>a yazdığını herkes görür. Birebir mesajlar uçtan uca şifreli: yalnız sen ve karşındaki okur, uygulamayı yöneten bile açamaz. İlk açışta bir <b>mesaj şifresi</b> koyarsın; unutursan eski birebir mesajlar açılmaz."];
    const panoS = ["Pano", "Döviz ve altın kurları (5 dakikada bir yenilenir), hızlı TL hesabı, yapılacaklar listesi ve notların tek ekranda. Kurlar gecikmeli olabilir; alım-satımda bankanın ya da kuyumcunun ekranı geçerli."];
    const kurS = ["Bildirim ve kurulum", "Safari → Paylaş → <b>Ana Ekrana Ekle</b>, sonra uygulamayı oradan aç. <b>Ayar → Bildirimler</b>'i açarsan yeni mesaj gelince haber verir; kilit ekranında kimden geldiği ve ne yazdığı görünmez."];
    if (t === "sade") {
      l.push(["Bugün", "Günün işlerini yaz, bitirdikçe işaretle. Altta kurlar ve gündem."]);
      l.push(panoS, mesajS, kurS); return l;
    }
    if (t === "is") {
      l.push(["Bugün", "Üstte şu an ne olduğu (dükkân, spor, gün sonu). Rutin işleri bitirince <b>✓</b>'ye bas. Kaçırdığın gün için ceza yok."]);
      l.push(["Bugünün işleri", "Sabah aklındaki işleri yaz (3 satır hazır, 8'e kadar), bitirdikçe işaretle."]);
      l.push(panoS);
      l.push(["Oku", "İş ve para üzerine kısa parçalar: tahsilat, pazarlık, ortaklık, şirket, banka. Her biri tek oturuşta biter."]);
      l.push(mesajS);
      l.push(["Gündem", "Bugün'ün en altında. Haberleri tek yerden okursun; günde 15 dakika."]);
      l.push(["Bildirim ve kurulum", "Safari → Paylaş → <b>Ana Ekrana Ekle</b>, sonra uygulamayı oradan aç. <b>Ayar → Bildirimler</b>'i açarsan sabah ve akşam birer hatırlatma, bir de yeni mesaj bildirimi gelir. Kilit ekranında ayrıntı yazmaz."]);
      return l;
    }
    l.push(["Bugün", "Üstteki kart şu an ne yapman gerektiğini söyler. Bir bloğu bitirince <b>✓ bitti</b>'ye bas ya da listedeki kutuyu işaretle. Kaçırdığın gün için ceza yok; haftalık çubuk sadece gösterir."]);
    if (p.plan3 !== false) l.push(["Bugünün işleri", "Sabah gün planında işlerini yaz (3 satır hazır, '+ İş ekle' ile 8'e kadar), bitirdikçe işaretle. Hepsi bitince gün kazanılmıştır."]);
    l.push(["Hafta", "Haftanın tamamını tek ekranda görürsün: hangi gün ne var, kaçını bitirdin."]);
    l.push(["Sayaç ve seri", "Şu an kartındaki <b>Sayacı başlat</b> bloğun sonuna kadar sayar, bitince bloğu kendisi işaretler. Günün %70'ini bitirdiğin günler üst üste seriyi büyütür; 3, 7, 14… günde rozet. Pazar akşamı haftanın özeti çıkar."]);
    if (t === "yks" || t === "karma") {
      l.push(["Netler", "Her denemeden sonra <b>+ Deneme ekle</b> ile netlerini gir. Hedefle yan yana görürsün; en çok açık olan ders kırmızı yanar."]);
      l.push(["Oku", "Konu anlatımları burada. Her parça tek oturuşta biter, sonunda kısa bir quiz var. Programdaki ders bloğunda o dersin rafını aç."]);
      l.push(["Yanlış defteri", "Netler'in altında. Denemede yanlış ya da boş bıraktığın her soruyu dersi, konusu ve nedeniyle gir. O konu 1, 3, 7 ve 21 gün sonra tekrar için önüne gelir. <b>Deneme sayacı</b> gerçek süreyle deneme çözdürür, bitince net girişine götürür."]);
    }
    if (t === "uni") l.push(["Kitaplık", "Okuma listen sırayla burada. Bitirdiğini işaretle. Ders içeriklerin gelince aynı sekmeye eklenecek."]);
    l.push(["Gündem", "Bugün'ün en altında. Haberleri tek yerden okursun; günün işinin çoğu bitince açılır, günde 15 dakika."]);
    l.push(mesajS);
    l.push(["Bildirim ve kurulum", "Safari → Paylaş → <b>Ana Ekrana Ekle</b>, sonra uygulamayı oradan aç. <b>Ayar → Bildirimler</b>'i açarsan günde iki bildirim gelir: sabah ve gün sonu. Kilit ekranında ne yaptığın yazmaz."]);
    return l;
  }
  function tanitimAc() {
    const l = tanitimSayfalari(); let i = 0;
    const d = el("div", "sayfa-alt tanitim"), k = el("div", "kart giris-kart");
    d.appendChild(k); document.body.appendChild(d);
    const kapat = () => { d.remove(); if (!V.tanitim) { V.tanitim = 1; kaydet(); } };
    const ciz1 = () => {
      k.innerHTML = '<div class="nokta">' + l.map((_, j) => "<i" + (j === i ? ' class="on"' : "") + "></i>").join("") + "</div><h2>" + l[i][0] + '</h2><p class="metin">' + l[i][1] + "</p>";
      const b = el("button", "btn", i < l.length - 1 ? "Devam" : "Başlayalım"); b.onclick = () => { if (i < l.length - 1) { i++; ciz1(); } else kapat(); };
      const g = el("button", "gec", i < l.length - 1 ? "Geç" : ""); g.onclick = kapat;
      k.append(b); if (i < l.length - 1) k.append(g);
    };
    ciz1();
  }

  /* ---------- alt gezinti ---------- */
  const IKON = {
    beslenme: '<svg viewBox="0 0 24 24"><path d="M7 3v8a2 2 0 0 0 2 2v8M5 3v6M9 3v6M17 21V3c-2 0-4 2-4 6v5h4"/></svg>',
    spor: '<svg viewBox="0 0 24 24"><path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/></svg>',
    bugun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>',
    hafta: '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>',
    net: '<svg viewBox="0 0 24 24"><path d="M5 19V11M12 19V5M19 19v-6"/></svg>',
    oku: '<svg viewBox="0 0 24 24"><path d="M4 5h6a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h6z"/></svg>',
    kitap: '<svg viewBox="0 0 24 24"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="2"/><rect x="17" y="14" width="4" height="6" rx="2"/></svg>',
    pano: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><path d="M13 16.5h7M16.5 13v7"/></svg>',
    ayar: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/></svg>'
  };
  function sekmeler() {
    const t = P[slug].tur, l = [["bugun", "Bugün"]];
    if (t === "sade") return l.concat([["pano", "Pano"], ["ayar", "Ayar"]]);
    if (P[slug].pano) l.push(["pano", "Pano"]);
    l.push(["hafta", "Hafta"]);
    if (t === "yks" || t === "karma") l.push(["net", "Netler"], ["oku", "Oku"]);
    if (t === "is" && P[slug].oku.length) l.push(["oku", "Oku"]);
    if (t === "uni") l.push(["kitap", "Kitaplık"]);
    l.push(["spor", "Spor"]);
    if (P[slug].beslenme) l.push(["beslenme", "Beslenme"]);
    l.push(["ayar", "Ayar"]);
    return l;
  }
  function navCiz() {
    const n = $("altNav"); n.innerHTML = "";
    for (const [id, ad] of sekmeler()) {
      const b = el("button", id === "bugun" ? "on" : "", IKON[id] + "<span>" + ad + "</span>");
      b.dataset.s = id; b.onclick = () => sekmeAc(id); n.appendChild(b);
    }
    sekmeAc("bugun");
  }
  function sekmeAc(id) {
    if (slug && V) { if (id === "bugun") bugunCiz(); else if (id === "hafta") haftaCiz(); else if (id === "spor") sporCiz(); else if (id === "gundem") gundemCiz(); else if (id === "pano") panoCiz(); else if (id === "mesaj") mesajCiz(); }
    for (const b of $("altNav").children) b.classList.toggle("on", b.dataset.s === id);
    for (const s of document.querySelectorAll(".sekme")) s.classList.toggle("on", s.id === "s-" + id);
    window.scrollTo(0, 0);
  }
  $("avatarBtn").onclick = () => sekmeAc("ayar");

  /* ---------- çizim ---------- */
  function ciz() { if (!slug) return; ustCiz(); bugunCiz(); haftaCiz(); netCiz(); okuCiz(); kitapCiz(); sporCiz(); beslenmeCiz(); sinavCiz(); $("surum").textContent = "Bozkurt Ordusu · " + SURUM; }

  function ustCiz() {
    const p = P[slug], m = simdiDk();
    const sel = m < 300 ? "Hâlâ ayakta mısın" : m < 720 ? "Günaydın" : m < 1080 ? "Selam" : "İyi akşamlar";
    $("selam").innerHTML = sel + ", <em>" + p.ad + "</em>";
    avatar($("avatarBtn"), slug);
    const k = (p.tur === "yks" || p.tur === "karma") ? PR.kalan(bugun()) : null;
    $("kalan").innerHTML = k ? "<b>" + k + "</b> · " + GUNLER[PR.haftaGunu(bugun())] : GUNLER[PR.haftaGunu(bugun())] + " · " + PR.haftaNo(bugun()) + ". hafta";
    const c = p.cumleler; $("sozMetin").textContent = c[PR.gunNo(bugun()) % c.length];
    rozetYaz();
  }

  function isaretli(g, b) { return !!(V.isaret[g] || {})[b.s]; }
  let sonTik = null;   // az önce işaretlenen blok: tik animasyonu yalnız ona
  function isaretle(g, b, durum) {
    V.isaret[g] = V.isaret[g] || {};
    if (durum) { V.isaret[g][b.s] = 1; sonTik = { k: g + b.s, t: Date.now() }; } else delete V.isaret[g][b.s];
    kaydet(); bugunCiz(); haftaCiz();
    if (durum) { rozetKontrol(); const y = gunYuzde(g); if (y.t && y.y === y.t) tost("Gün tamam. Helal."); }
  }

  function bugunCiz() {
    const g = bugun(), m = simdiDk(), l = PR.gunluk(slug, g), p = P[slug];
    const say = l.filter((b) => b.say);
    let su = l.find((b) => PR.dk(b.s) <= m && m < PR.dk(b.b)), sonraki = l.find((b) => PR.dk(b.s) > m);
    const hedef = (su && su.say && !isaretli(g, su)) ? su
      : say.filter((b) => PR.dk(b.b) <= m && !isaretli(g, b)).pop() || null;

    const k = $("simdi"); k.innerHTML = "";
    if (su) {
      const o = Math.min(100, Math.round((m - PR.dk(su.s)) / (PR.dk(su.b) - PR.dk(su.s)) * 100));
      k.innerHTML = '<span class="etk">Şu an</span><h3>' + kac(su.ad) + '</h3><span class="zaman">' + su.s + "–" + su.b + " · " + sure(PR.dk(su.b) - m) + ' kaldı</span><div class="cubuk"><i style="width:' + o + '%"></i></div>';
    } else if (sonraki) {
      k.innerHTML = '<span class="etk">Sıradaki</span><h3>' + kac(sonraki.ad) + '</h3><span class="zaman">' + sonraki.s + " · " + sure(PR.dk(sonraki.s) - m) + " sonra" + "</span>";
    } else {
      const y = say.filter((b) => isaretli(g, b)).length;
      k.innerHTML = '<span class="etk">Gün bitti</span><h3>' + (say.length ? y + "/" + say.length + " blok" : "Bugün dinlen") + '</h3><span class="zaman">' + (say.length && y >= say.length ? "Tam gün. Helal." : "Yarın kaldığın yerden.") + "</span>";
    }
    if (su && su.tur === "spor" && (sporV().program[PR.haftaGunu(g)] || []).length) {
      const sb = el("button", "btn", "Antrenmanı aç ›"); sb.onclick = () => { sporGun = PR.haftaGunu(g); sekmeAc("spor"); }; k.appendChild(sb);
    } else if (hedef) {
      const gecti = !(su && su === hedef);   // şu anki blok değil, saati geçmiş ve işaretlenmemiş
      const bt = el("button", gecti ? "btn ikincil kucuk" : "btn", (gecti ? "Kaçanı işaretle: " : "✓ ") + kac(hedef.ad) + (gecti ? "" : " bitti"));
      bt.onclick = () => { isaretle(g, hedef, true); tost(p.nazik ? "Bir adım daha. Aferin." : "İşaretlendi. Devam."); };
      k.appendChild(bt);
    }

    // haftalık ilerleme: cezalandırmaz, sadece gösterir
    const hb = haftaBasi(g); let top = 0, yap = 0;
    for (let i = 0; i < 7; i++) { const gg = gunEkle(hb, i), bl = PR.gunluk(slug, gg).filter((b) => b.say); top += bl.length; yap += bl.filter((b) => isaretli(gg, b)).length; }
    const sr = seri(), sonra = ROZETLER.find((x) => x > sr);
    $("haftaIlerleme").innerHTML = (top ? "<span>Bu hafta</span><div class=\"cubuk\"><i style=\"width:" + Math.round(yap / top * 100) + "%\"></i></div><b>" + yap + "/" + top + "</b>" : "") +
      '<em class="seri" title="%70 ve üstü biten günler üst üste">Seri ' + sr + (sonra ? " · " + sonra + YONE[sonra] + " " + (sonra - sr) : "") + "</em>";
    odakCiz(g, su, m); haftaOzetCiz(g, m); gundemKartCiz(g);

    plan3Ciz(g); sporBugunCiz(g);
    $("profilNot").hidden = !p.not; $("profilNot").textContent = p.not || "";
    kurMiniCiz();
    const sade = p.tur === "sade";   // sade profilde program yok: şu an kartı, blok listesi ve seri gizli
    for (const id of ["simdi", "bloklar", "haftaIlerleme"]) $(id).hidden = sade;
    if (sade) { $("haftaOzet").hidden = true; return; }

    const ol = $("bloklar"); ol.innerHTML = "";
    for (const b of l) {
      const li = el("li", "blok" + (b.say ? "" : " pasif") + (b === su ? " simdiki" : "") + (b.say && isaretli(g, b) ? " bitti" : ""));
      const [ust, alt] = b.ad.includes(" · ") && !b.say ? [b.ad.split(" · ")[0], b.ad.split(" · ").slice(1).join(" · ")] : [b.ad, ""];
      li.innerHTML = '<span class="sa">' + b.s + '</span><span class="ad"><b>' + kac(ust) + "</b><small>" + (alt ? kac(alt) + " · " : "") + b.s + "–" + b.b + "</small></span>";
      if (b.say) {
        const t = el("button", "tik" + (isaretli(g, b) ? " on" : "") + (sonTik && sonTik.k === g + b.s && Date.now() - sonTik.t < 1200 && isaretli(g, b) ? " pop" : ""), "✓");
        t.setAttribute("aria-label", b.ad + " bitti mi");
        t.onclick = () => isaretle(g, b, !isaretli(g, b));
        li.appendChild(t);
      }
      ol.appendChild(li);
    }
    if (!l.length) ol.appendChild(el("li", "blok pasif", '<span class="ad"><b>Bugün için plan yok.</b></span>'));
  }
  function sure(d) { return d < 60 ? d + " dk" : Math.floor(d / 60) + " sa" + (d % 60 ? " " + (d % 60) + " dk" : ""); }

  /* Günün işleri: sabah yazılır, gün içinde işaretlenir. Varsayılan 3; "+ İş ekle" ile en çok 8. */
  const IS_EN_AZ = 3, IS_EN_COK = 8;
  function plan3Ciz(g) {
    const k = $("plan3"); if (P[slug].plan3 === false) { k.hidden = true; return; }   // herkeste açık; kapatmak için profilde plan3: false
    k.hidden = false; V.plan = V.plan || {};
    const l = (V.plan[g] || []).slice();
    while (l.length < IS_EN_AZ) l.push({ t: "", ok: 0 });
    const dolu = l.filter((y) => y.t), biten = dolu.filter((y) => y.ok).length;
    k.innerHTML = '<span class="etk">Bugünün işleri' + (dolu.length ? " · " + biten + "/" + dolu.length : "") + "</span>";
    const sakla = () => { V.plan[g] = l; kaydet(); };
    l.forEach((x, i) => {
      const r = el("label"), t = el("button", "tik" + (x.ok ? " on" : ""), "✓"), inp = el("input");
      t.type = "button"; t.setAttribute("aria-label", (i + 1) + ". iş bitti mi");
      inp.type = "text"; inp.value = x.t; inp.placeholder = (i + 1) + ". iş"; inp.maxLength = 80;
      t.onclick = () => {
        if (!l[i].t) return; l[i].ok = l[i].ok ? 0 : 1; sakla(); plan3Ciz(g);
        const d = l.filter((y) => y.t); if (l[i].ok && d.every((y) => y.ok)) tost(d.length > 1 ? "Hepsi tamam. Bugün kazandın." : "Tamam.");
      };
      inp.onchange = () => {   // yeniden çizme: bir sonraki kutuya geçerken klavye kapanmasın
        l[i].t = inp.value.trim(); if (!l[i].t) { l[i].ok = 0; t.classList.remove("on"); } sakla();
        const d = l.filter((y) => y.t); k.querySelector(".etk").textContent = "Bugünün işleri" + (d.length ? " · " + d.filter((y) => y.ok).length + "/" + d.length : "");
      };
      r.append(t, inp);
      if (i >= IS_EN_AZ) {   // sonradan eklenen satır silinebilir
        const s2 = el("button", "issil", "×"); s2.type = "button"; s2.setAttribute("aria-label", (i + 1) + ". işi sil");
        s2.onclick = (e) => { e.preventDefault(); l.splice(i, 1); sakla(); plan3Ciz(g); };
        r.appendChild(s2);
      }
      k.appendChild(r);
    });
    if (l.length < IS_EN_COK) {
      const ekle = el("button", "isekle", "+ İş ekle"); ekle.type = "button";
      ekle.onclick = () => { l.push({ t: "", ok: 0 }); sakla(); plan3Ciz(g); const s3 = k.querySelectorAll("input"); if (s3.length) s3[s3.length - 1].focus(); };
      k.appendChild(ekle);
    }
  }

  function haftaCiz() {
    const g = bugun(), hb = haftaBasi(g), k = $("hafta"); k.innerHTML = "";
    for (let i = 0; i < 7; i++) {
      const gg = gunEkle(hb, i), l = PR.gunluk(slug, gg), bl = l.filter((b) => b.say), y = bl.filter((b) => isaretli(gg, b)).length;
      const sabit = l.filter((b) => !b.say).map((b) => b.ad + " " + b.s);
      const konu = [...new Set(bl.map((b) => b.ad))];
      const d = el("div", "gun" + (gg === g ? " bugun" : ""));
      d.innerHTML = '<span class="gad">' + KISA[PR.haftaGunu(gg)] + "<small>" + gg.slice(8) + "." + gg.slice(5, 7) + '</small></span><span class="gic">' +
        kac([...konu, ...sabit].join(" · ") || "Boş gün") + '</span><span class="say">' + (bl.length ? y + "/" + bl.length : "") + "</span>";
      k.appendChild(d);
    }
  }

  /* ---------- netler ---------- */
  function netCiz() {
    const p = P[slug]; if (!p.hedef) return;
    const son = { TYT: null, AYT: null };
    for (const d of V.denemeler) if (!son[d.tur] || d.tarih >= son[d.tur].tarih) son[d.tur] = d;
    let h = "<h3>" + kac(p.hedefAd) + '</h3><p class="ince">Çubuk son denemen, sağdaki hedef. Kırmızı = en çok açık olan.</p>';
    for (const tur of Object.keys(p.hedef)) {
      const hd = p.hedef[tur], s = son[tur];
      let enAcik = null, fark = -1;
      if (s) for (const ders in hd) { const f = hd[ders] - (s.netler[ders] || 0); if (f > fark) { fark = f; enAcik = ders; } }
      h += '<div class="grup">' + tur + (s ? " · son: " + s.tarih.slice(8) + "." + s.tarih.slice(5, 7) : " · henüz deneme yok") + "</div>";
      for (const ders in hd) {
        const n = s ? (s.netler[ders] || 0) : 0, o = Math.max(0, Math.min(100, n / hd[ders] * 100));
        h += '<div class="net-satir' + (ders === enAcik && fark > 0 ? " acik" : "") + '"><span>' + ders + '</span><span class="c"><i style="width:' + o + '%"></i></span><span class="n">' + (s ? fmt(n) : "–") + " / " + hd[ders] + "</span></div>";
      }
    }
    $("hedefKart").innerHTML = h;
    tahminCiz(); defterCiz(); sinavSecCiz();

    const f = $("denemeForm");
    if (!f.dataset.kuruldu) {
      f.dataset.kuruldu = 1;
      const turler = Object.keys(p.hedef);
      let s = '<div class="iki"><label>Tarih<input type="date" name="tarih" required></label><label>Tür<select name="tur">' + turler.map((t) => "<option>" + t + "</option>").join("") + "</select></label></div><div class=\"iki\" id=\"netAlan\"></div><button class=\"btn\">Kaydet</button>";
      f.innerHTML = s; f.tarih.value = bugun();
      const alan = () => { const hd = p.hedef[f.tur.value]; f.querySelector("#netAlan").innerHTML = Object.keys(hd).map((d) => '<label>' + d + ' net<input type="number" step="0.25" min="-10" max="40" inputmode="decimal" name="n_' + d + '"></label>').join(""); };
      f.tur.onchange = alan; alan();
      f.onsubmit = (e) => {
        e.preventDefault();
        const netler = {}; for (const d of Object.keys(p.hedef[f.tur.value])) { const v = parseFloat(String(f["n_" + d].value).replace(",", ".")); netler[d] = isNaN(v) ? 0 : v; }
        V.denemeler.push({ id: Date.now(), tarih: f.tarih.value, tur: f.tur.value, netler });
        kaydet(); netCiz(); f.reset(); f.tarih.value = bugun(); alan(); $("denemeEkle").open = false; tost("Deneme kaydedildi.");
      };
    }
    const k = $("denemeler"); k.innerHTML = "";
    for (const d of [...V.denemeler].sort((a, b) => b.tarih.localeCompare(a.tarih))) {
      const top = Object.values(d.netler).reduce((a, b) => a + b, 0);
      const r = el("div", "deneme", "<span>" + d.tarih.slice(8) + "." + d.tarih.slice(5, 7) + " · " + d.tur + "</span><span><b>" + fmt(top) + "</b> net </span>");
      const sil = el("button", "", "×"); sil.setAttribute("aria-label", "Sil");
      sil.onclick = () => { if (confirm("Bu deneme silinsin mi?")) { V.denemeler = V.denemeler.filter((x) => x.id !== d.id); kaydet(); netCiz(); } };
      r.lastChild.appendChild(sil); k.appendChild(r);
    }
  }
  const fmt = (n) => (Math.round(n * 100) / 100).toString().replace(".", ",");

  function okuCiz() {
    const p = P[slug], k = $("raflar"); k.innerHTML = "";
    for (const r of p.oku) { const a = el("a", "raf", "<b>" + RAF[r][0] + "</b><span>" + RAF[r][1] + "</span>"); a.href = "oku/" + r + ".html"; k.appendChild(a); }
  }

  function kitapCiz() {
    const k = $("kitaplar"), p = P[slug]; if (p.tur !== "uni") return;
    V.kitap = V.kitap || {};
    const l = p.kitaplar || [];
    const biten = l.filter((x) => V.kitap[x[0]]).length;
    k.innerHTML = '<p class="ince">Sırayla git. Storytel\'de bulamadığın olursa Fati\'ye söyle, yerine benzerini koyarız. ' + (l.length ? biten + "/" + l.length + " bitti." : "") + "</p>";
    l.forEach((x, i) => {
      const d = el("div", "kitap" + (V.kitap[x[0]] ? " bitti" : ""));
      d.innerHTML = '<div class="kap"><span>' + (i + 1) + "</span></div><div><b>" + kac(x[0]) + "</b><small>" + kac(x[1]) + "</small><p>" + kac(x[2]) + "</p></div>";
      const t = el("button", "tik" + (V.kitap[x[0]] ? " on" : ""), "✓"); t.setAttribute("aria-label", x[0] + " bitti mi");
      t.onclick = () => { if (V.kitap[x[0]]) delete V.kitap[x[0]]; else { V.kitap[x[0]] = bugun(); tost("Bir kitap daha. Helal."); } kaydet(); kitapCiz(); };
      d.appendChild(t); k.appendChild(d);
    });
    k.appendChild(el("div", "kart", '<b>Ders içeriklerin</b><p class="ince">Derslerini gönderince konu anlatımları burada olacak.</p>'));
  }


  /* ---------- spor: program + son kaldırılan kilo ----------
     V.spor = { program: { 1: [{ id, ad, set, tekrar }], ... }, kayit: { id: [{ t: "2026-10-20", kg: 60, tk: 8 }] } }
     Program herkesin kendisi; şablonlar sadece hızlı başlangıç. */
  const SABLON = {
    tam: { ad: "Tüm vücut · 3 gün", gun: { 1: "A", 3: "A", 5: "A" }, A: [["Squat", 3, "8"], ["Bench Press", 3, "8"], ["Barbell Row", 3, "8"], ["Overhead Press", 3, "10"], ["Romanian Deadlift", 3, "10"], ["Plank", 3, "45 sn"]] },
    ustalt: { ad: "Üst / Alt · 4 gün", gun: { 1: "U", 2: "L", 4: "U", 5: "L" },
      U: [["Bench Press", 4, "8"], ["Lat Pulldown", 4, "10"], ["Shoulder Press", 3, "10"], ["Cable Row", 3, "10"], ["Biceps Curl", 3, "12"], ["Triceps Pushdown", 3, "12"]],
      L: [["Squat", 4, "8"], ["Romanian Deadlift", 3, "10"], ["Leg Press", 3, "12"], ["Leg Curl", 3, "12"], ["Calf Raise", 4, "15"], ["Plank", 3, "45 sn"]] },
    ppl: { ad: "Push / Pull / Legs · 6 gün", gun: { 1: "P", 2: "C", 3: "B", 4: "P", 5: "C", 6: "B" },
      P: [["Bench Press", 4, "8"], ["Incline Dumbbell Press", 3, "10"], ["Shoulder Press", 3, "10"], ["Lateral Raise", 3, "15"], ["Triceps Pushdown", 3, "12"]],
      C: [["Deadlift", 3, "5"], ["Lat Pulldown", 4, "10"], ["Barbell Row", 3, "10"], ["Face Pull", 3, "15"], ["Biceps Curl", 3, "12"]],
      B: [["Squat", 4, "8"], ["Leg Press", 3, "12"], ["Romanian Deadlift", 3, "10"], ["Leg Curl", 3, "12"], ["Calf Raise", 4, "15"]] }
  };
  let sporGun = null, sporAcik = null, sporDuzen = false;
  const sporV = () => { V.spor = V.spor || { program: {}, kayit: {} }; V.spor.program = V.spor.program || {}; V.spor.kayit = V.spor.kayit || {}; return V.spor; };
  const yeniId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const kgYaz = (n) => (Math.round(n * 100) / 100).toString().replace(".", ",");
  function once(t) { const d = PR.gunNo(bugun()) - PR.gunNo(t); return d <= 0 ? "bugün" : d === 1 ? "dün" : d + " gün önce"; }
  function sablonUygula(k) {
    const s = sablonUygula.s = SABLON[k], sp = sporV(), eski = sp.program;
    const adlar = {}; for (const g in eski) for (const h of eski[g]) adlar[h.ad.toLowerCase()] = h.id;   // aynı isimli harekete kayıtlar bağlı kalsın
    sp.program = {};
    for (const g in s.gun) sp.program[g] = s[s.gun[g]].map(([ad, set, tekrar]) => ({ id: adlar[ad.toLowerCase()] || (adlar[ad.toLowerCase()] = yeniId()), ad, set, tekrar }));
    kaydet(); sporCiz(); tost(s.ad + " kuruldu. İstediğin gibi düzenle.");
  }
  function sporBugunCiz(g) {
    const b = $("sporBugun"), l = (sporV().program[PR.haftaGunu(g)] || []);
    if (!l.length) { b.hidden = true; return; }
    b.hidden = false;
    b.innerHTML = '<span class="etk">Bugünkü antrenman</span><b>' + l.length + " hareket</b><small>" + kac(l.slice(0, 3).map((h) => h.ad).join(" · ")) + (l.length > 3 ? " …" : "") + "</small><i>›</i>";
    b.onclick = () => { sporGun = PR.haftaGunu(g); sekmeAc("spor"); sporCiz(); };
  }
  function sporCiz() {
    if (!slug) return;
    const sp = sporV(); if (sporGun === null) sporGun = PR.haftaGunu(bugun());
    const gs = $("sporGunler"); gs.innerHTML = "";
    for (const g of [1, 2, 3, 4, 5, 6, 0]) {
      const n = (sp.program[g] || []).length, b = el("button", (g === sporGun ? "on" : "") + (n ? " dolu" : ""), KISA[g] + (n ? "<i></i>" : ""));
      b.onclick = () => { sporGun = g; sporAcik = null; sporCiz(); }; gs.appendChild(b);
    }
    const k = $("sporListe"); k.innerHTML = "";
    const l = sp.program[sporGun] || [];
    if (!Object.keys(sp.program).some((g) => (sp.program[g] || []).length)) {
      const bos = el("div", "kart sporbos", "<b>Programını kur</b><p class=\"ince\">Kendi programın varsa her güne hareketlerini ekle. Yoksa bir şablonla başla, sonra istediğin gibi değiştir. Şablonlar genel örnektir; antrenörün ya da kendi programın varsa onu kullan.</p>");
      for (const key in SABLON) { const bt = el("button", "btn ikincil", SABLON[key].ad); bt.onclick = () => sablonUygula(key); bos.appendChild(bt); }
      k.appendChild(bos);
    } else if (!l.length) k.appendChild(el("p", "ince orta", GUNLER[sporGun] + " dinlenme günü. Hareket eklemek istersen aşağıdan ekle."));
    l.forEach((h, i) => {
      const kay = sp.kayit[h.id] || [], son = kay[kay.length - 1], onceki = kay[kay.length - 2];
      const d = el("div", "hareket" + (sporAcik === h.id ? " acik" : ""));
      const ok = son && onceki ? (son.kg > onceki.kg ? '<em class="up">▲ ' + kgYaz(son.kg - onceki.kg) + "</em>" : son.kg < onceki.kg ? '<em class="dn">▼ ' + kgYaz(onceki.kg - son.kg) + "</em>" : "") : "";
      d.innerHTML = '<div class="hb"><div><b>' + kac(h.ad) + "</b><small>" + h.set + " × " + kac(h.tekrar) + "</small></div>" +
        '<div class="kg">' + (son ? "<strong>" + kgYaz(son.kg) + "<span> kg</span></strong><small>" + ok + once(son.t) + "</small>" : "<small>henüz kayıt yok</small>") + "</div></div>";
      d.querySelector(".hb").onclick = () => { sporAcik = sporAcik === h.id ? null : h.id; sporCiz(); };
      if (sporAcik === h.id) {
        const f = el("form", "hform");
        f.innerHTML = '<label>Kilo<input name="kg" type="number" inputmode="decimal" step="0.5" min="0" max="500" value="' + (son ? son.kg : "") + '" required></label><label>Tekrar<input name="tk" type="text" inputmode="numeric" maxlength="6" value="' + kac(son && son.tk ? son.tk : String(h.tekrar).split(" ")[0]) + '"></label><button class="btn">Kaydet</button>';
        f.onsubmit = (e) => {
          e.preventDefault(); const kg = parseFloat(String(f.kg.value).replace(",", ".")); if (isNaN(kg)) return;
          const arr = sp.kayit[h.id] = sp.kayit[h.id] || [], t = bugun(), r = { t, kg, tk: f.tk.value.trim() };
          if (arr.length && arr[arr.length - 1].t === t) arr[arr.length - 1] = r; else arr.push(r);
          if (arr.length > 60) arr.splice(0, arr.length - 60);
          kaydet(); sporCiz(); tost(son && kg > son.kg ? "Geçen seferden ağır. Helal." : "Kaydedildi.");
        };
        d.appendChild(f);
        if (kay.length) {
          const gec = el("div", "gecmis");
          gec.innerHTML = kay.slice(-6).reverse().map((x) => "<span><b>" + kgYaz(x.kg) + " kg</b>" + (x.tk ? " × " + kac(x.tk) : "") + " · " + x.t.slice(8) + "." + x.t.slice(5, 7) + "</span>").join("");
          d.appendChild(gec);
        }
        const ar = el("div", "harac");
        const yuk = el("button", "", "↑"), asg = el("button", "", "↓"), duz = el("button", "", "Düzenle"), sil = el("button", "", "Kaldır");
        yuk.onclick = () => { if (i > 0) { [l[i - 1], l[i]] = [l[i], l[i - 1]]; kaydet(); sporCiz(); } };
        asg.onclick = () => { if (i < l.length - 1) { [l[i + 1], l[i]] = [l[i], l[i + 1]]; kaydet(); sporCiz(); } };
        duz.onclick = () => { const ad = prompt("Hareket adı", h.ad); if (ad === null) return; const st = prompt("Set × tekrar (ör. 4x8)", h.set + "x" + h.tekrar); if (ad.trim()) h.ad = ad.trim().slice(0, 40); const m = st && st.match(/^\s*(\d+)\s*[x×*]\s*(.+)$/i); if (m) { h.set = +m[1]; h.tekrar = m[2].trim().slice(0, 10); } kaydet(); sporCiz(); };
        sil.onclick = () => { if (confirm(h.ad + " bu günden kaldırılsın mı? (Kilo geçmişi silinmez.)")) { l.splice(i, 1); sporAcik = null; kaydet(); sporCiz(); } };
        ar.append(yuk, asg, duz, sil); d.appendChild(ar);
      }
      k.appendChild(d);
    });
    if (Object.keys(sp.program).some((g) => (sp.program[g] || []).length)) {
      const ek = el("form", "kart hekle");
      ek.innerHTML = '<input name="ad" placeholder="+ Hareket ekle (ör. Bench Press)" maxlength="40" required><div class="iki"><input name="set" type="number" min="1" max="10" placeholder="Set" value="3"><input name="tk" placeholder="Tekrar" value="10" maxlength="10"></div><button class="btn">Ekle</button>';
      ek.onsubmit = (e) => {
        e.preventDefault(); const ad = ek.ad.value.trim(); if (!ad) return;
        let id = null; for (const g in sp.program) for (const x of sp.program[g]) if (x.ad.toLowerCase() === ad.toLowerCase()) id = x.id;
        (sp.program[sporGun] = sp.program[sporGun] || []).push({ id: id || yeniId(), ad: ad.slice(0, 40), set: +ek.set.value || 3, tekrar: ek.tk.value.trim() || "10" });
        kaydet(); sporCiz();
      };
      k.appendChild(ek);
      const sb = el("details", "sablonlar"); sb.innerHTML = "<summary>Şablonla baştan kur</summary>";
      for (const key in SABLON) { const bt = el("button", "btn ikincil", SABLON[key].ad); bt.onclick = () => { if (confirm("Haftalık program şablonla değiştirilsin mi? Kilo geçmişin aynı isimli hareketlerde kalır.")) sablonUygula(key); }; sb.appendChild(bt); }
      k.appendChild(sb);
    }
  }

  /* ---------- beslenme (profilde tanımlıysa) ---------- */
  function beslenmeCiz() {
    const b = P[slug].beslenme, k = $("beslenme"); if (!b) { k.innerHTML = ""; return; }
    let h = '<p class="ince">' + kac(b.not) + "</p>";
    h += '<div class="kart bes"><span class="etk">Her gün</span>' + b.gun.map((x) => '<div class="bs"><b>' + kac(x[0]) + "</b><span>" + kac(x[1]) + "</span></div>").join("") + "</div>";
    h += '<div class="kart bes"><span class="etk">Kurallar</span><ul>' + b.kurallar.map((x) => "<li>" + kac(x) + "</li>").join("") + "</ul></div>";
    h += '<details class="kart bes"><summary><span class="etk">Maraton haftası</span></summary>' + b.maraton.map((x) => '<div class="bs"><b>' + kac(x[0]) + "</b><span>" + kac(x[1]) + "</span></div>").join("") + "</details>";
    h += '<div class="kart bes"><span class="etk">Dolapta dursun</span><p>' + kac(b.dolap) + "</p></div>";
    h += '<p class="ince">Genel bir sporcu beslenme düzenidir, diyetisyen programı değildir. Halsizlik, baş dönmesi ya da kramp olursa bir uzmana danış.</p>';
    k.innerHTML = h;
  }

  /* =====================================================================
     275'ten gelenler: seri ve rozetler, odak sayacı, Pazar özeti, ikon rozeti,
     gidiş ve tahmin, deneme sayacı, yanlış defteri, gündem.
     ===================================================================== */
  const yksMi = () => { const t = P[slug].tur; return t === "yks" || t === "karma"; };
  function gunYuzde(g) {
    const bl = PR.gunluk(slug, g).filter((b) => b.say), y = bl.filter((b) => isaretli(g, b)).length;
    return { y, t: bl.length, pct: bl.length ? Math.round(y * 100 / bl.length) : 0, eksik: bl.filter((b) => !isaretli(g, b)) };
  }

  /* ---------- seri: günün %70'i biten günler üst üste; işsiz gün (izin) seriyi bozmaz ---------- */
  const ROZETLER = [3, 7, 14, 21, 30, 50, 75, 100, 150, 200];
  const YONE = { 3: "'e", 7: "'ye", 14: "'e", 21: "'e", 30: "'a", 50: "'ye", 75: "'e", 100: "'e", 150: "'ye", 200: "'e" };   // 7'ye, 30'a …
  function seri() {
    const b = bugun(); let n = 0;
    const p0 = gunYuzde(b); if (p0.t && p0.pct >= 70) n++;
    let d = gunEkle(b, -1);
    for (let i = 0; i < 400 && d >= PR.BASLANGIC; i++) {
      const p = gunYuzde(d);
      if (p.t && p.pct < 70) break;
      if (p.t) n++;
      d = gunEkle(d, -1);
    }
    return n;
  }
  function enUzunSeri() {
    let d = PR.BASLANGIC, n = 0, en = 0; const b = bugun();
    while (d <= b) { const p = gunYuzde(d); if (p.t) { if (p.pct >= 70) { n++; en = Math.max(en, n); } else if (d !== b) n = 0; } d = gunEkle(d, 1); }
    return en;
  }
  function rozetKontrol() {
    const r = ROZETLER.filter((x) => x <= seri()).pop(); if (!r) return;
    if (r > (V.rozet_son || 0)) { V.rozet_son = r; kaydet(); setTimeout(() => tost(r + " gün üst üste. Rozet senin."), 900); }
  }

  /* ---------- ikon rozeti: YKS'lilerde kalan hafta (son haftada gün); öbürlerinde boş ---------- */
  let sonRozet = null;
  function rozetYaz() {
    if (!("setAppBadge" in navigator)) return;
    let n = 0;
    if (yksMi()) { const g = PR.gunNo(PR.SINAV) - PR.gunNo(bugun()); n = g <= 0 ? 0 : g >= 7 ? Math.floor(g / 7) : g; }
    else n = okunmamis();   // öbürlerinde okunmamış mesaj sayısı
    if (n === sonRozet) return; sonRozet = n;
    try { (n > 0 ? navigator.setAppBadge(n) : navigator.clearAppBadge()).catch(() => {}); } catch (e) {}
  }

  /* ---------- odak sayacı: şu anki bloğun sonuna kadar sayar, bitince bloğu işaretler ---------- */
  const odakAnahtar = () => "st-odak:" + slug;
  let odakTik = null;
  function odakOku() { try { return JSON.parse(localStorage.getItem(odakAnahtar()) || "null"); } catch (e) { return null; } }
  function odakBitir(o, tamam) {
    try { localStorage.removeItem(odakAnahtar()); } catch (e) {}
    clearInterval(odakTik); odakTik = null;
    if (tamam) {
      const b = PR.gunluk(slug, o.gun).find((x) => x.s === o.s && x.say);
      if (b && !isaretli(o.gun, b)) isaretle(o.gun, b, true);
      try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (e) {}
      tost(o.ad + " bitti, işaretlendi.");
      try { if (document.hidden && window.Notification && Notification.permission === "granted") navigator.serviceWorker.ready.then((r) => r.showNotification("Bozkurt Ordusu", { body: "Süre doldu.", tag: "odak", icon: "icons/ikon-192.png" })); } catch (e) {}
    }
    bugunCiz();
  }
  function odakCiz(g, su, m) {
    const k = $("simdi"); let o = odakOku();
    if (o && o.gun !== g) { try { localStorage.removeItem(odakAnahtar()); } catch (e) {} o = null; }
    const d = el("div", "odak");
    if (o) {
      const kal = Math.round((o.bit - Date.now()) / 1000);
      if (kal <= 0) { setTimeout(() => odakBitir(o, true), 0); return; }
      d.classList.add("calisiyor");
      d.innerHTML = '<span class="osay" id="odakSay"></span><span class="oad">Sayaç açık · bitince işaretlenir</span>';
      const dur = el("button", "btn ikincil kucuk", "Durdur"); dur.type = "button"; dur.onclick = () => odakBitir(o, false);
      d.appendChild(dur); k.appendChild(d);
      const yaz = () => { const s = Math.round((o.bit - Date.now()) / 1000), e = $("odakSay"); if (s <= 0) return odakBitir(o, true); if (e) e.textContent = (s >= 3600 ? Math.floor(s / 3600) + ":" + PR.p2(Math.floor(s % 3600 / 60)) : Math.floor(s / 60)) + ":" + PR.p2(s % 60); };
      yaz(); clearInterval(odakTik); odakTik = setInterval(yaz, 1000);
      return;
    }
    if (!su || !su.say || su.tur === "spor" || isaretli(g, su)) return;
    const kalan = PR.dk(su.b) - m; if (kalan < 5) return;
    const bs = el("button", "btn ikincil kucuk", "Sayacı başlat · " + sure(kalan)); bs.type = "button";
    bs.onclick = () => {
      const bit = Date.now() + kalan * 60000 - (new Date().getSeconds()) * 1000;
      try { localStorage.setItem(odakAnahtar(), JSON.stringify({ gun: g, s: su.s, ad: su.ad, bit })); } catch (e) {}
      bugunCiz();
    };
    d.appendChild(bs); k.appendChild(d);
  }

  /* ---------- Pazar akşamı (ve Pazartesi öğlene kadar): haftanın özeti ---------- */
  function haftaHesap(hb) {
    const b = bugun(); let y = 0, t = 0; const gunler = [], eksik = {};
    for (let i = 0; i < 7; i++) {
      const gg = gunEkle(hb, i);
      if (gg > b || gg < PR.BASLANGIC) { gunler.push({ g: gg, yok: true }); continue; }
      const p = gunYuzde(gg); y += p.y; t += p.t; gunler.push({ g: gg, pct: p.pct, t: p.t });
      if (gg < b) for (const x of p.eksik) eksik[x.ad] = (eksik[x.ad] || 0) + 1;
    }
    const son = gunEkle(hb, 6);
    return { y, t, pct: t ? Math.round(y * 100 / t) : null, gunler, eksik, dn: V.denemeler.filter((d) => d.tarih >= hb && d.tarih <= son) };
  }
  function haftaOzetCiz(g, m) {
    const k = $("haftaOzet"), w = PR.haftaGunu(g);
    const goster = (w === 0 && m >= 17 * 60) || (w === 1 && m < 12 * 60);
    const hb = gunEkle(haftaBasi(g), w === 1 ? -7 : 0);
    if (!goster || V.ozet_kapat === hb) { k.hidden = true; return; }
    const h = haftaHesap(hb), o = haftaHesap(gunEkle(hb, -7));
    const fark = h.pct != null && o.pct != null ? h.pct - o.pct : null;
    const en = h.gunler.filter((x) => !x.yok && x.t).sort((a, b) => b.pct - a.pct)[0];
    const ek = Object.keys(h.eksik).sort((a, b) => h.eksik[b] - h.eksik[a]).slice(0, 2);
    let s = '<div class="houst"><span class="etk">' + (w === 1 ? "Geçen hafta" : "Haftanın özeti") + '</span><button class="hokapat" type="button" aria-label="Kapat">×</button></div>';
    s += '<div class="hobuyuk"><b>' + (h.pct == null ? "–" : "%" + h.pct) + "</b><span>" + h.y + "/" + h.t + " blok" + (fark == null ? "" : ' · <em class="' + (fark >= 0 ? "art" : "az") + '">geçen haftaya göre ' + (fark >= 0 ? "+" : "") + fark + "</em>") + "</span></div>";
    s += '<div class="hocubuk">' + h.gunler.map((x) => '<i class="' + (x.yok ? "yok" : "") + '"><u style="height:' + (x.yok ? 0 : Math.max(4, x.pct)) + '%"></u><small>' + KISA[PR.haftaGunu(x.g)] + "</small></i>").join("") + "</div>";
    const satir = (a, b) => '<div class="hosatir"><span>' + a + "</span><b>" + kac(b) + "</b></div>";
    if (en) s += satir("En iyi gün", KISA[PR.haftaGunu(en.g)] + " %" + en.pct);
    s += satir("En çok atlanan", ek.length ? ek.map((a) => a + " (" + h.eksik[a] + ")").join(" · ") : "yok");
    if (yksMi()) s += satir("Denemeler", h.dn.length ? h.dn.map((d) => d.tur + " " + fmt(Object.values(d.netler).reduce((a, b) => a + b, 0))).join(" · ") : "girilmedi");
    s += satir("Seri", seri() + " gün · en uzun " + enUzunSeri());
    k.innerHTML = s; k.hidden = false;
    k.querySelector(".hokapat").onclick = () => { V.ozet_kapat = hb; kaydet(); k.hidden = true; };
  }

  /* ---------- Netler: gidiş ve tahmin (son 8 denemenin eğimi, hedefe gereken eğim) ---------- */
  const SORU = { TYT: 120, AYT: 80 };
  function tahminCiz() {
    const k = $("tahminKart"), p = P[slug]; if (!p.hedef) { k.hidden = true; return; }
    k.hidden = false;
    let s = '<span class="etk">Gidiş ve tahmin</span>';
    for (const tur of Object.keys(p.hedef)) {
      const l = V.denemeler.filter((d) => d.tur === tur).sort((a, b) => a.tarih.localeCompare(b.tarih)).slice(-8);
      const tepe = Object.values(p.hedef[tur]).reduce((a, b) => a + b, 0);
      s += '<div class="grup">' + tur + " · hedef " + tepe + "</div>";
      if (l.length < 3) { s += '<p class="ince">Tahmin için ' + (3 - l.length) + " deneme daha gerek (" + l.length + "/3).</p>"; continue; }
      const xs = l.map((d) => PR.gunNo(d.tarih)), ys = l.map((d) => Object.values(d.netler).reduce((a, b) => a + b, 0)), n = l.length;
      const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
      let pay = 0, payda = 0; xs.forEach((x, i) => { pay += (x - mx) * (ys[i] - my); payda += (x - mx) * (x - mx); });
      const egim = payda > 0 ? pay / payda : 0, son3 = ys.slice(-3).reduce((a, b) => a + b, 0) / 3;
      const kalanGun = Math.max(7, PR.gunNo(PR.SINAV) - PR.gunNo(bugun())), kalanHafta = kalanGun / 7;
      const gerek = (tepe - son3) / kalanHafta, haftalik = egim * 7;
      const uzat = Math.max(0, Math.min(SORU[tur] || 120, son3 + egim * (PR.gunNo(PR.SINAV) - xs[n - 1])));
      const iyi = son3 >= tepe || haftalik >= gerek - 0.05, erken = n < 5;
      s += '<div class="thg"><div><span>Son 3 ortalama</span><b>' + fmt(Math.round(son3 * 10) / 10) + '</b></div><div class="' + (haftalik < 0 ? "kotu" : "") + '"><span>Gidişin</span><b>' + (haftalik >= 0 ? "+" : "") + fmt(Math.round(haftalik * 100) / 100) + "/hf</b></div>" +
        "<div><span>Gereken</span><b>" + (son3 >= tepe ? "hedefte" : "+" + fmt(Math.round(gerek * 100) / 100) + "/hf") + '</b></div><div class="' + (erken ? "" : iyi ? "iyi" : "kotu") + '"><span>Bu gidişle</span><b>' + (erken ? "erken" : "≈ " + Math.round(uzat)) + "</b></div></div>";
      s += '<p class="ince">' + (erken ? "Tahmin için 5 deneme lazım, " + n + " var. Şimdilik bak: gidişin gerekenin üstünde mi?"
        : iyi ? "Gidiş yeterli; bozma." : haftalik <= 0 ? "Net artmıyor. Aynı çalışma aynı sonucu verir; yanlış defterindeki en çok hata yapılan konulara dön." : "Hız yetmiyor: haftada " + fmt(Math.round((gerek - haftalik) * 100) / 100) + " net açık var.") +
        (erken ? "" : " Düz çizgi uzatmasıdır; net yükseldikçe artış yavaşlar, rakam iyimser tarafta kalır.") + "</p>";
    }
    k.innerHTML = s;
  }

  /* ---------- deneme sayacı: ekranda yalnız süre kalır; bitince net girişine geçer ---------- */
  const SURE = { TYT: 165, AYT: 180 };
  const sinavAnahtar = () => "st-sinav:" + slug;
  let sinavTik = null, sinavKilit = null;
  function sinavOku() { try { return JSON.parse(localStorage.getItem(sinavAnahtar()) || "null"); } catch (e) { return null; } }
  function sinavSecCiz() {
    const k = $("sinavSec"), p = P[slug]; if (!p.hedef) return;
    k.innerHTML = '<p class="ince">Gerçek süre başlar, ekranda yalnız sayaç kalır. Bitirince netlerini gir.</p>';
    for (const tur of Object.keys(p.hedef)) { const b = el("button", "btn", tur + " · " + SURE[tur] + " dk"); b.type = "button"; b.onclick = () => { try { localStorage.setItem(sinavAnahtar(), JSON.stringify({ bas: Date.now(), dk: SURE[tur], tur })); } catch (e) {} k.hidden = true; sinavCiz(); }; k.appendChild(b); }
  }
  function sinavCiz() {
    const o = $("sinavMod"), d = slug ? sinavOku() : null;
    if (!d) { o.hidden = true; clearInterval(sinavTik); sinavTik = null; if (sinavKilit && sinavKilit.release) { try { sinavKilit.release(); } catch (e) {} } sinavKilit = null; return; }
    o.hidden = false;
    const gecen = (Date.now() - d.bas) / 1000, top = d.dk * 60, kal = Math.max(0, top - gecen);
    $("smSayac").textContent = kal <= 0 ? "Süre doldu" : Math.floor(kal / 3600) + ":" + PR.p2(Math.floor(kal % 3600 / 60)) + ":" + PR.p2(Math.floor(kal % 60));
    $("smBar").style.width = Math.min(100, gecen * 100 / top) + "%";
    const bas = new Date(d.bas), bit = new Date(d.bas + top * 1000);
    $("smAlt").textContent = d.tur + " · " + PR.p2(bas.getHours()) + ":" + PR.p2(bas.getMinutes()) + " → " + PR.p2(bit.getHours()) + ":" + PR.p2(bit.getMinutes());
    $("smBitir").textContent = kal <= 0 ? "Netleri gir" : "Bitir";
    o.classList.toggle("son", kal > 0 && kal <= 600);
    if (!sinavTik) sinavTik = setInterval(sinavCiz, 1000);
    if (!sinavKilit && navigator.wakeLock && !document.hidden) { sinavKilit = 1; navigator.wakeLock.request("screen").then((k) => { sinavKilit = k; }).catch(() => { sinavKilit = null; }); }
  }
  let sinavOnay = 0;
  $("sinavAc").onclick = () => { const k = $("sinavSec"); k.hidden = !k.hidden; };
  $("smBitir").onclick = () => {
    const d = sinavOku(); if (!d) return;
    const doldu = (Date.now() - d.bas) / 1000 >= d.dk * 60;
    if (!doldu && Date.now() - sinavOnay > 4000) { sinavOnay = Date.now(); $("smBitir").textContent = "Emin misin? Bir daha bas"; return; }
    try { localStorage.removeItem(sinavAnahtar()); } catch (e) {}
    sinavOnay = 0; sinavCiz(); sekmeAc("net");
    const f = $("denemeForm"); $("denemeEkle").open = true;
    if (f.tur) { f.tur.value = d.tur; f.tur.onchange && f.tur.onchange(); } if (f.tarih) f.tarih.value = bugun();
    setTimeout(() => $("denemeEkle").scrollIntoView({ block: "start" }), 50);
  };

  /* ---------- yanlış defteri: her yanlış ve boş için bir satır; konu 1, 3, 7, 21 gün sonra tekrar gelir ---------- */
  const TEKRAR = [1, 3, 7, 21];
  let defterHarita = null;
  function dersler() { const p = P[slug]; const l = []; for (const tur of Object.keys(p.hedef || {})) for (const k of Object.keys(window.Defter.KONULAR)) if (k.indexOf(tur + " ") === 0) l.push(k); return l; }
  function tekrarHesap() {
    const b = bugun(), m = {}, T = V.tekrar || {}, vadesi = []; let yarin = 0, biten = 0;
    for (const h of V.hatalar || []) { const k = h.ders + "||" + h.konu; if (!m[k]) m[k] = { k, ders: h.ders, konu: h.konu, adet: 0, son: h.tarih }; m[k].adet++; if (h.tarih > m[k].son) m[k].son = h.tarih; }
    for (const k in m) {
      const r = m[k], t = T[k] || { adim: 0, son: "" }; let adim = t.adim, taban = t.son;
      if (!taban || r.son > taban) { adim = 0; taban = r.son; }
      if (adim >= TEKRAR.length) { biten++; continue; }
      r.adim = adim; r.vade = gunEkle(taban, TEKRAR[adim]);
      if (r.vade <= b) vadesi.push(r); else if (r.vade === gunEkle(b, 1)) yarin++;
    }
    vadesi.sort((a, c) => a.vade.localeCompare(c.vade) || c.adet - a.adet);
    return { vadesi, yarin, biten, toplam: Object.keys(m).length };
  }
  function defterCiz() {
    const k = $("defter"); if (!yksMi() || !window.Defter) { k.innerHTML = ""; return; }
    if (k.contains(document.activeElement) && /SELECT|INPUT/.test(document.activeElement.tagName)) return;
    V.hatalar = V.hatalar || []; V.tekrar = V.tekrar || {};
    const D = window.Defter, ds = dersler();
    k.innerHTML = "";
    const kart = el("div", "kart defter");
    kart.innerHTML = '<span class="etk">Yanlış defteri</span><p class="ince">Her yanlış ve boş için bir satır. Neden kısmını boş geçme: konu mu eksik, dikkat mi, süre mi, onu bu söyler.</p>';
    const f = el("form", "dform");
    f.innerHTML = '<label>Ders<select name="ders">' + ds.map((d) => "<option>" + d + "</option>").join("") + '</select></label><label>Konu<select name="konu"></select></label><label>Neden<select name="neden">' + D.NEDENLER.map((x) => "<option>" + x + "</option>").join("") + '</select></label><button class="btn">Ekle</button>';
    const konular = () => { f.konu.innerHTML = (D.KONULAR[f.ders.value] || []).map((x) => "<option>" + kac(x) + "</option>").join(""); };
    f.ders.onchange = konular; konular();
    if (defterCiz.son) { if (ds.includes(defterCiz.son.ders)) { f.ders.value = defterCiz.son.ders; konular(); } f.neden.value = defterCiz.son.neden; }
    f.onsubmit = (e) => {
      e.preventDefault();
      V.hatalar.push({ id: Date.now(), tarih: bugun(), ders: f.ders.value, konu: f.konu.value, neden: f.neden.value });
      defterCiz.son = { ders: f.ders.value, neden: f.neden.value };
      kaydet(); defterCiz(); tost("Deftere yazıldı.");
    };
    kart.appendChild(f); k.appendChild(kart);

    // bugün tekrar
    const r = tekrarHesap(), tk = el("div", "kart tekrar");
    tk.innerHTML = '<span class="etk">Bugün tekrar' + (r.vadesi.length ? " · " + r.vadesi.length + " konu" : "") + "</span>";
    if (!r.toplam) tk.innerHTML += '<p class="ince">Deftere hata girdikçe o konular 1, 3, 7 ve 21 gün sonra burada tekrar için çıkar.</p>';
    else if (!r.vadesi.length) tk.innerHTML += '<p class="ince">Bugün tekrar yok.' + (r.yarin ? " Yarın " + r.yarin + " konu bekliyor." : "") + (r.biten ? " " + r.biten + " konu dört tekrarı bitirdi." : "") + "</p>";
    for (const x of r.vadesi) {
      const gec = PR.gunNo(bugun()) - PR.gunNo(x.vade);
      const s = el("div", "tkr", "<div><b>" + kac(x.konu) + "</b><small>" + kac(x.ders) + " · " + x.adet + " hata · " + (x.adim + 1) + ". tekrar" + (gec > 0 ? " · " + gec + " gün gecikti" : "") + "</small></div>");
      const b = el("button", "btn ikincil kucuk", "Tekrar ettim"); b.type = "button";
      b.onclick = () => { V.tekrar[x.k] = { adim: x.adim + 1, son: bugun() }; kaydet(); defterCiz(); };
      s.appendChild(b); tk.appendChild(s);
    }
    k.appendChild(tk);
    if (!V.hatalar.length) return;

    // en çok hata ve neden dağılımı
    const m = {}, nm = {};
    for (const h of V.hatalar) { const kk = h.ders + "||" + h.konu; m[kk] = m[kk] || { ders: h.ders, konu: h.konu, n: 0 }; m[kk].n++; nm[h.neden] = (nm[h.neden] || 0) + 1; }
    const en = Object.values(m).sort((a, b) => b.n - a.n).slice(0, 8), enc = Math.max(...Object.values(nm));
    const ist = el("div", "kart dist");
    ist.innerHTML = '<span class="etk">En çok hata · ' + V.hatalar.length + " kayıt</span>" + en.map((x) => '<div class="dsat"><span><b>' + kac(x.konu) + "</b><small>" + kac(x.ders) + "</small></span><em>" + x.n + "</em></div>").join("") +
      '<span class="etk" style="margin-top:12px">Neden</span>' + D.NEDENLER.filter((x) => nm[x]).sort((a, b) => nm[b] - nm[a]).map((x) => '<div class="dned"><span>' + kac(x) + '</span><i><u style="width:' + Math.round(nm[x] * 100 / enc) + '%"></u></i><em>' + Math.round(nm[x] * 100 / V.hatalar.length) + "%</em></div>").join("");
    k.appendChild(ist);

    // konu haritası: her kare bir konu, koyulaştıkça hata çok
    const hr = el("details", "kart harita"); hr.open = defterHarita === true;
    hr.ontoggle = () => { defterHarita = hr.open; };
    let hs = '<summary><span class="etk">Konu haritası</span></summary><p class="ince" id="haritaBilgi">Bir kareye dokun: konu ve hata sayısı burada.</p>';
    for (const d of ds) {
      const lst = D.KONULAR[d] || [], top = lst.reduce((a, x) => a + ((m[d + "||" + x] || {}).n || 0), 0);
      hs += '<div class="hrs"><b>' + kac(d) + "<small>" + (top || "–") + '</small></b><div class="hrk">' + lst.map((x) => { const n = (m[d + "||" + x] || {}).n || 0; return '<i class="l' + (n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : n <= 6 ? 3 : 4) + '" data-b="' + kac(d + " · " + x + ": " + (n ? n + " hata" : "hata yok")) + '"></i>'; }).join("") + "</div></div>";
    }
    hr.innerHTML = hs;
    hr.onclick = (e) => { const i = e.target.closest("i[data-b]"); if (i) $("haritaBilgi").textContent = i.dataset.b; };
    k.appendChild(hr);
  }

  /* ---------- gündem: haberler tek yerde; günün işinin %60'ı bitince açılır, günde 15 dakika ---------- */
  const GUNDEM = { oran: 0.6, dk: 15 };
  const HESAPLAR = [["İbrahim Haskoloğlu · X", "https://x.com/haskologlu"], ["Telegram", "https://t.me/s/ibrahimhaskologlu"], ["YouTube", "https://www.youtube.com/ibrahimhaskologlu"]];
  let gundemVeri = null, gundemZaman = 0, gundemSon = Date.now();
  function gundemOkuma() { const g = bugun(); return V.gundem && V.gundem.gun === g ? V.gundem : { gun: g, sn: 0 }; }
  function gundemDurum() {
    const p = gunYuzde(bugun()), gerek = Math.ceil(p.t * GUNDEM.oran);
    if (p.t && p.y < gerek) return { acik: false, neden: "Gündem günün işinin çoğu bitince açılır: " + (gerek - p.y) + " blok daha (" + p.y + "/" + p.t + ")." , kalanBlok: gerek - p.y };
    const r = gundemOkuma();
    if (r.sn >= GUNDEM.dk * 60) return { acik: false, neden: "Bugünlük gündem süren doldu (" + GUNDEM.dk + " dk). Yarın yine burada." };
    return { acik: true, kalan: GUNDEM.dk * 60 - r.sn };
  }
  function gundemKartCiz() {
    const k = $("gundemKart"), d = gundemDurum();
    k.innerHTML = '<span class="etk">Gündem</span><b>' + (d.acik ? "Açık · " + Math.ceil(d.kalan / 60) + " dk" : d.kalanBlok ? d.kalanBlok + " blok sonra açılır" : "Bugünlük bitti") + "</b><i>›</i>";
    k.classList.toggle("kilitli", !d.acik);
    k.onclick = () => sekmeAc("gundem");
  }
  function zamanFarki(iso) { const d = Math.round((Date.now() - new Date(iso).getTime()) / 60000); return d < 1 ? "şimdi" : d < 60 ? d + " dk" : d < 1440 ? Math.round(d / 60) + " sa" : Math.round(d / 1440) + " gün"; }
  function gundemCiz(zorla) {
    const liste = $("gundemListe"), alt = $("gundemAlt"), hs = $("hesaplar"), d = gundemDurum();
    hs.innerHTML = d.acik ? HESAPLAR.map(([a, u]) => '<a class="hesap" target="_blank" rel="noopener" href="' + u + '">' + kac(a) + "</a>").join("") : "";
    if (!d.acik) { liste.innerHTML = '<div class="kart"><p class="ince">' + kac(d.neden) + "</p></div>"; alt.textContent = "Kilitli."; return; }
    alt.textContent = "Bugün kalan süre: " + Math.ceil(d.kalan / 60) + " dk";
    if (gundemVeri && !zorla && Date.now() - gundemZaman < 5 * 60000) return gundemYaz();
    liste.innerHTML = '<p class="ince">Yükleniyor…</p>';
    fetch("api/gundem", { cache: "no-store" }).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((v) => { gundemVeri = v; gundemZaman = Date.now(); gundemYaz(); })
      .catch(() => { liste.innerHTML = '<div class="kart"><p class="ince">Gündem yüklenemedi; bağlantını kontrol et.</p></div>'; });
  }
  function gundemYaz() {
    const liste = $("gundemListe"), v = gundemVeri || { ogeler: [], kaynaklar: [] };
    liste.innerHTML = v.ogeler.length ? "" : '<p class="ince">Kaynaklardan bir şey gelmedi.</p>';
    for (const o of v.ogeler.slice(0, 60)) { const a = el("a", "kart haber"); a.href = o.link; a.target = "_blank"; a.rel = "noopener"; a.innerHTML = '<div class="hu"><b>' + kac(o.kaynak) + "</b><span>" + zamanFarki(o.zaman) + "</span></div><p>" + kac(o.metin) + "</p>"; liste.appendChild(a); }
    const bozuk = (v.kaynaklar || []).filter((x) => !x.tamam).map((x) => x.ad);
    if (bozuk.length) liste.appendChild(el("p", "ince", "Okunamayan kaynak: " + kac(bozuk.join(", "))));
  }
  $("gundemGeri").onclick = () => sekmeAc("bugun");
  setInterval(() => {
    const s = Date.now(), f = Math.round((s - gundemSon) / 1000); gundemSon = s;
    if (!slug || document.hidden || f <= 0 || f > 15 || !$("s-gundem").classList.contains("on")) return;
    if (!gundemDurum().acik) return;
    const r = gundemOkuma(); r.sn += f; V.gundem = r;
    if (r.sn % 30 < 5) kaydet(); else { try { localStorage.setItem(anahtar(), JSON.stringify(V)); } catch (e) {} }   // sunucuya 30 sn'de bir
    const d = gundemDurum(); if (!d.acik) gundemCiz(); else $("gundemAlt").textContent = "Bugün kalan süre: " + Math.ceil(d.kalan / 60) + " dk";
  }, 5000);

  /* ---------- Pano: kurlar, hesap, yapılacaklar, notlar (profilde pano: true) ----------
     Kurlar api/kurlar'dan gelir (5 dk önbellek); son gelen telefonda saklanır, bağlantı yokken de görünür. */
  const KUR_ANA = ["USD", "EUR", "gram-altin", "ceyrek-altin", "cumhuriyet-altini", "ons"];
  let kurVeri = null, kurZaman = 0, kurTum = false, kurIstek = null;
  try { const c = JSON.parse(localStorage.getItem("st-kur") || "null"); if (c && c.v) { kurVeri = c.v; kurZaman = c.z; } } catch (e) {}
  const tl = (n, b) => n == null ? "—" : n.toLocaleString("tr-TR", { minimumFractionDigits: b, maximumFractionDigits: b });
  const kurBas = (x) => x.tur === "doviz" ? 4 : x.satis >= 1000 ? 0 : 2;
  const kurBirim = (x) => x.kod === "ons" ? "$" : "";
  function kurGetir(zorla) {
    if (!zorla && kurVeri && Date.now() - kurZaman < 5 * 60000) return Promise.resolve(kurVeri);
    if (kurIstek) return kurIstek;
    kurIstek = fetch("api/kurlar", { cache: "no-store" }).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((v) => { if (v.kalemler && v.kalemler.length) { kurVeri = v; kurZaman = Date.now(); try { localStorage.setItem("st-kur", JSON.stringify({ v, z: kurZaman })); } catch (e) {} } return kurVeri; })
      .catch(() => kurVeri).finally(() => { kurIstek = null; });
    return kurIstek;
  }
  function kurMiniCiz() {
    const k = $("kurMini"); if (!P[slug].pano) { k.hidden = true; return; }
    const v = kurVeri; k.hidden = !v;
    if (!v) { kurGetir().then(() => kurVeri && kurMiniCiz()); return; }
    const al = (kod) => v.kalemler.find((x) => x.kod === kod);
    k.innerHTML = '<span class="etk">Kurlar</span><span class="km">' + ["USD", "EUR", "gram-altin"].map(al).filter(Boolean)
      .map((x) => "<span>" + (x.kod === "gram-altin" ? "Gram" : x.ad) + " <b>" + tl(x.satis, x.tur === "doviz" ? 2 : 0) + "</b></span>").join("") + "</span><i>›</i>";
    k.onclick = () => sekmeAc("pano");
    if (Date.now() - kurZaman > 5 * 60000) kurGetir().then(() => { if (Date.now() - kurZaman < 60000) kurMiniCiz(); });
  }
  function kurCiz() {
    const k = $("kurlar"), v = kurVeri;
    if (!v || !v.kalemler.length) { k.innerHTML = '<span class="etk">Kurlar</span><p class="ince">' + (kurIstek ? "Yükleniyor…" : "Kurlar yüklenemedi; bağlantını kontrol et.") + "</p>"; return; }
    const l = kurTum ? v.kalemler : v.kalemler.filter((x) => KUR_ANA.includes(x.kod));
    let h = '<div class="kurust"><span class="etk">Kurlar</span><button type="button" class="kuryen" id="kurYenile" aria-label="Yenile">↻</button></div>'
      + '<table class="kurtab"><thead><tr><th></th><th>Alış</th><th>Satış</th><th>Gün</th></tr></thead><tbody>';
    for (const x of l) {
      const b = kurBas(x), u = kurBirim(x), d = x.degisim;
      h += "<tr><td>" + kac(x.ad) + "</td><td>" + u + tl(x.alis, b) + "</td><td><b>" + u + tl(x.satis, b) + '</b></td><td class="' + (d > 0 ? "art" : d < 0 ? "dus" : "") + '">' + (d == null ? "" : (d > 0 ? "+" : "") + tl(d, 2) + "%") + "</td></tr>";
    }
    h += '</tbody></table><button type="button" class="isekle" id="kurTum">' + (kurTum ? "Daha az göster" : "Hepsini göster (" + v.kalemler.length + ")") + "</button>"
      + '<p class="ince kurnot">' + kac(v.kaynak || "") + (v.tarih ? " · " + kac(v.tarih) : "") + ". Gecikmeli olabilir; alım-satımda bankanın ya da kuyumcunun ekranı geçerli.</p>";
    k.innerHTML = h;
    $("kurTum").onclick = () => { kurTum = !kurTum; kurCiz(); };
    $("kurYenile").onclick = () => { $("kurYenile").classList.add("don"); kurGetir(true).then(() => { kurCiz(); hesapCiz(); kurMiniCiz(); }); };
  }
  const sayiOku = (s) => {   // "1.500" = bin beş yüz, "1,5" = bir buçuk, "1500.75" de olur
    s = String(s).trim().replace(/\s/g, "");
    if (s.includes(",")) s = s.replace(/\./g, "").replace(",", "."); else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
    return parseFloat(s);
  };
  function hesapCiz() {
    const k = $("kurHesap"); if (!kurVeri || !kurVeri.kalemler.length) { k.hidden = true; return; }
    k.hidden = false;
    const l = kurVeri.kalemler.filter((x) => x.kod !== "ons");
    const sec = l.some((x) => x.kod === V.kur_sec) ? V.kur_sec : "USD";
    const eski = $("khMik") ? $("khMik").value : "";
    k.innerHTML = '<span class="etk">Hesap</span><div class="khsat"><input type="text" inputmode="decimal" id="khMik" placeholder="Miktar" aria-label="Miktar"><select id="khKod" aria-label="Birim">'
      + l.map((x) => '<option value="' + x.kod + '"' + (x.kod === sec ? " selected" : "") + ">" + kac(x.ad) + "</option>").join("")
      + '</select><button type="button" class="khyon" id="khYon" aria-label="Yönü çevir">⇄</button></div><p class="khsonuc" id="khSonuc"></p>';
    $("khMik").value = eski;
    const hes = () => {
      const m = sayiOku($("khMik").value), x = l.find((y) => y.kod === $("khKod").value), tersten = !!V.kur_ters;
      $("khMik").placeholder = tersten ? "TL tutarı" : "Miktar";
      if (isNaN(m) || !x) { $("khSonuc").textContent = tersten ? "TL tutarını yaz, kaç " + x.ad.toLowerCase() + " eder göreyim." : "Miktarı yaz, TL karşılığını göreyim."; return; }
      $("khSonuc").innerHTML = tersten
        ? "Satıştan alırsın: <b>" + tl(m / x.satis, 2) + "</b> · Alıştan: " + tl(m / x.alis, 2)
        : "Satış: <b>" + tl(m * x.satis, 2) + " ₺</b> · Alış: " + tl(m * x.alis, 2) + " ₺";
    };
    $("khMik").oninput = hes;
    $("khKod").onchange = () => { V.kur_sec = $("khKod").value; kaydet(); hes(); };
    $("khYon").onclick = () => { V.kur_ters = V.kur_ters ? 0 : 1; kaydet(); hes(); };
    hes();
  }
  /* Yapılacaklar: tarihsiz liste; bitenler alta iner, "bitenleri temizle" ile silinir. */
  function yapilacakCiz() {
    const k = $("yapilacak"); V.yapilacak = V.yapilacak || [];
    const l = V.yapilacak, acik = l.filter((x) => !x.ok), biten = l.filter((x) => x.ok);
    k.innerHTML = '<span class="etk">Yapılacaklar' + (l.length ? " · " + acik.length + " açık" : "") + "</span>";
    const f = el("form", "yekle"); f.innerHTML = '<input type="text" maxlength="140" placeholder="Yeni iş: kime, ne, ne zaman" aria-label="Yeni iş"><button class="btn kucuk">Ekle</button>';
    f.onsubmit = (e) => { e.preventDefault(); const t = f.querySelector("input").value.trim(); if (!t) return; l.unshift({ id: Date.now(), t, ok: 0, z: bugun() }); kaydet(); yapilacakCiz(); $("yapilacak").querySelector("input").focus(); };
    k.appendChild(f);
    for (const x of acik.concat(biten)) {
      const r = el("div", "ysatir" + (x.ok ? " bitti" : "")), t = el("button", "tik" + (x.ok ? " on" : ""), "✓"), sil = el("button", "issil", "×");
      t.type = sil.type = "button"; t.setAttribute("aria-label", "Bitti mi"); sil.setAttribute("aria-label", "Sil");
      t.onclick = () => { x.ok = x.ok ? 0 : 1; if (x.ok) x.bitti = bugun(); kaydet(); yapilacakCiz(); };
      sil.onclick = () => { V.yapilacak = l.filter((y) => y !== x); kaydet(); yapilacakCiz(); };
      r.append(t, el("span", "", kac(x.t) + "<small>" + kac(x.z.slice(8) + "." + x.z.slice(5, 7)) + "</small>"), sil); k.appendChild(r);
    }
    if (biten.length) { const b = el("button", "isekle", "Bitenleri temizle (" + biten.length + ")"); b.type = "button"; b.onclick = () => { V.yapilacak = acik; kaydet(); yapilacakCiz(); }; k.appendChild(b); }
    if (!l.length) k.appendChild(el("p", "ince", "Aklındaki işi yaz, kafandan çıksın."));
  }
  /* Notlar: yeniden eskiye; dokununca düzenlenir. */
  function notlarCiz() {
    const k = $("notlar"); V.notlar = V.notlar || [];
    k.innerHTML = '<span class="etk">Notlar</span>';
    const f = el("form", "nekle"); f.innerHTML = '<textarea rows="2" maxlength="2000" placeholder="Not al…" aria-label="Yeni not"></textarea><button class="btn kucuk">Kaydet</button>';
    f.onsubmit = (e) => { e.preventDefault(); const t = f.querySelector("textarea").value.trim(); if (!t) return; V.notlar.unshift({ id: Date.now(), t, z: new Date().toISOString() }); kaydet(); notlarCiz(); };
    k.appendChild(f);
    for (const n of V.notlar) {
      const d = el("div", "notk"), zz = new Date(n.z);
      d.innerHTML = '<p></p><div class="nalt"><small>' + PR.p2(zz.getDate()) + "." + PR.p2(zz.getMonth() + 1) + " " + PR.p2(zz.getHours()) + ":" + PR.p2(zz.getMinutes()) + "</small></div>";
      d.querySelector("p").textContent = n.t;
      const du = el("button", "isekle", "Düzenle"), sil = el("button", "isekle sil", "Sil"); du.type = sil.type = "button";
      du.onclick = () => {
        const ta = el("textarea"); ta.rows = 4; ta.maxLength = 2000; ta.value = n.t; d.querySelector("p").replaceWith(ta); ta.focus();
        du.textContent = "Kaydet"; du.onclick = () => { const t = ta.value.trim(); if (t) { n.t = t; kaydet(); } notlarCiz(); };
      };
      let emin = false; sil.onclick = () => { if (!emin) { emin = true; sil.textContent = "Emin misin?"; setTimeout(() => { emin = false; sil.textContent = "Sil"; }, 3000); return; } V.notlar = V.notlar.filter((y) => y !== n); kaydet(); notlarCiz(); };
      d.querySelector(".nalt").append(du, sil); k.appendChild(d);
    }
  }
  function panoCiz() { if (!P[slug].pano) return; kurCiz(); hesapCiz(); yapilacakCiz(); notlarCiz(); kurGetir().then(() => { if ($("s-pano").classList.contains("on")) { kurCiz(); hesapCiz(); } kurMiniCiz(); }); }

  /* ---------- Mesajlar: birebir (uçtan uca şifreli, sifre.js) + ortak duvar (şifresiz, üyelerin hepsi görür) ----------
     Gizli anahtar bu cihazda IndexedDB'de, dışa aktarılamaz biçimde durur; yeni cihazda mesaj şifresiyle açılır.
     V.anahtar: mesaj şifresiyle kilitli gizli anahtar + açık anahtar. V.mesaj_okundu: { konu: son okunan id }. */
  const SF = window.Sifre;
  let ozel = null, mesajlar = [], mesajSon = 0, mKonu = null, aciklar = {}, cozulmus = {}, mesajZ = null, mesajYukleniyor = false;
  function idb(islem, deger) {
    return new Promise((ok) => {
      try {
        const r = indexedDB.open("bozkurt", 1);
        r.onupgradeneeded = () => r.result.createObjectStore("anahtar");
        r.onerror = () => ok(null);
        r.onsuccess = () => {
          const tx = r.result.transaction("anahtar", islem === "al" ? "readonly" : "readwrite"), st = tx.objectStore("anahtar");
          const q = islem === "al" ? st.get(slug) : islem === "sil" ? st.delete(slug) : st.put(deger, slug);
          q.onsuccess = () => ok(islem === "al" ? q.result || null : true); q.onerror = () => ok(null);
        };
      } catch (e) { ok(null); }
    });
  }
  async function anahtarHazir() {
    if (ozel) return true;
    if (!V.anahtar || !SF) return false;
    const k = await idb("al");
    if (k && k.ozel && SF.ayni(k.ak, V.anahtar.ak)) { ozel = k.ozel; return true; }
    return false;
  }
  async function acikYayinla() { if (sb && V.anahtar) { const { error } = await sb.from("st_anahtar").upsert({ slug, ak: V.anahtar.ak, guncel: new Date().toISOString() }); if (error) console.warn("anahtar", error.message); } }
  const konuAdi = (k) => k === "herkes" ? "Ortak duvar" : P[k] ? P[k].ad : k;
  const konuOf = (m) => m.kime === "herkes" ? "herkes" : m.kimden === slug ? m.kime : m.kimden;
  function okunmamis(konu) {
    const o = V.mesaj_okundu || {};
    return mesajlar.filter((m) => m.kimden !== slug && (!konu || konuOf(m) === konu) && m.id > (o[konuOf(m)] || 0)).length;
  }
  function mesajSayCiz() { const n = okunmamis(), i = $("mesajSay"); i.hidden = !n; i.textContent = n > 9 ? "9+" : n; rozetYaz(); }
  async function mesajCek() {
    if (!sb || !uid || mesajYukleniyor) return; mesajYukleniyor = true;
    try {
      let q = sb.from("st_mesaj").select("id,kimden,kime,metin,ak_gonderen,ak_alici,zaman").order("id", { ascending: false }).limit(300);
      if (mesajSon) q = q.gt("id", mesajSon);
      const { data, error } = await q; if (error) { console.warn("mesaj", error.message); return; }
      if (data && data.length) {
        const yeni = data.reverse(); mesajlar = mesajlar.concat(yeni).slice(-600); mesajSon = mesajlar[mesajlar.length - 1].id;
        mesajSayCiz();
        if ($("s-mesaj").classList.contains("on")) mesajCiz();
      } else if (!mesajSon) mesajSayCiz();
    } finally { mesajYukleniyor = false; }
  }
  async function acikAnahtarlar() {
    if (!sb) return; const { data } = await sb.from("st_anahtar").select("slug,ak");
    aciklar = {}; for (const r of data || []) aciklar[r.slug] = r.ak;
  }
  async function cozMesaj(m) {
    if (m.kime === "herkes") return m.metin;
    if (cozulmus[m.id] != null) return cozulmus[m.id];
    if (!ozel) return null;
    const benimAk = m.kimden === slug ? m.ak_gonderen : m.ak_alici, karsiAk = m.kimden === slug ? m.ak_alici : m.ak_gonderen;
    try { if (!SF.ayni(benimAk, V.anahtar.ak)) throw 0; cozulmus[m.id] = await SF.coz(ozel, karsiAk, m.metin); }
    catch (e) { cozulmus[m.id] = false; }
    return cozulmus[m.id];
  }
  function mesajNotYaz() {
    $("mesajNot").textContent = mKonu === "herkes"
      ? "Ortak duvar şifresiz: üyelerin hepsi okur. Özel bir şeyse birebir yaz."
      : "Birebir mesajlar uçtan uca şifreli: yalnız sen ve karşındaki okur. Veritabanında karışık metin olarak durur; uygulamayı yöneten de açamaz.";
  }
  /* Mesaj şifresi: ilk kurulum, yeni cihazda kilit açma, unutunca sıfırlama. */
  function kilitCiz(k, sifirla) {
    const yeni = !V.anahtar || sifirla;
    k.innerHTML = "";
    const f = el("form", "kart giris-kart mkilit");
    f.innerHTML = yeni
      ? "<h3>" + (sifirla ? "Yeni mesaj şifresi" : "Mesaj şifreni koy") + '</h3><p class="ince">' + (sifirla ? "Eski birebir mesajların artık açılmaz; ortak duvar etkilenmez." : "Birebir mesajların bu şifreyle kilitlenir. Giriş şifrenden farklı olsun, en az 8 karakter. Unutursan eski birebir mesajlar açılmaz; kimse kurtaramaz.") + '</p><input type="password" id="ms1" autocomplete="new-password" placeholder="Mesaj şifresi" minlength="8" required><input type="password" id="ms2" autocomplete="new-password" placeholder="Bir daha" minlength="8" required>'
      : '<h3>Mesaj şifren</h3><p class="ince">Bu cihazda ilk kez açıyorsun. Mesaj şifreni bir kez gir; bu cihaz hatırlar.</p><input type="password" id="ms1" autocomplete="current-password" placeholder="Mesaj şifresi" required>';
    f.innerHTML += '<p class="hata" id="msHata" hidden></p><button class="btn">' + (yeni ? "Kur" : "Aç") + "</button>";
    if (!yeni) { const u = el("button", "gec", "Şifremi unuttum"); u.type = "button"; u.onclick = () => kilitCiz(k, true); f.appendChild(u); }
    if (sifirla) { const g = el("button", "gec", "Vazgeç"); g.type = "button"; g.onclick = () => kilitCiz(k, false); f.appendChild(g); }
    f.onsubmit = async (e) => {
      e.preventDefault(); const h = $("msHata"), b = f.querySelector(".btn"), s1 = $("ms1").value;
      h.hidden = true;
      if (yeni && s1 !== $("ms2").value) { h.textContent = "İki şifre aynı değil."; h.hidden = false; return; }
      b.disabled = true; b.textContent = "Bekle…";
      try {
        if (yeni) { const r = await SF.yeniAnahtar(s1); V.anahtar = r.kayit; ozel = r.ozel; cozulmus = {}; kaydet(); await esitleYaz(); await acikYayinla(); }
        else { ozel = await SF.kilitAc(V.anahtar, s1); await acikYayinla(); }
        await idb("koy", { ozel, ak: V.anahtar.ak });
        tost(yeni ? "Mesaj şifren kuruldu." : "Açıldı."); mesajCiz();
      } catch (er) { h.textContent = yeni ? "Kurulamadı, tekrar dene." : "Şifre yanlış."; h.hidden = false; b.disabled = false; b.textContent = yeni ? "Kur" : "Aç"; }
    };
    k.appendChild(f);
  }
  async function mesajCiz() {
    const kilit = $("mesajKilit"), liste = $("mesajListe"), form = $("mesajForm");
    if (!sb) { kilit.innerHTML = '<div class="kart"><p class="ince">Mesajlar yalnız girişli kullanımda açık.</p></div>'; liste.innerHTML = ""; form.hidden = true; return; }
    const hazir = await anahtarHazir();
    if (!hazir) { kilitCiz(kilit); liste.innerHTML = ""; form.hidden = true; $("mesajBaslik").textContent = "Mesajlar"; $("mesajNot").textContent = ""; return; }
    kilit.innerHTML = "";
    if (!mKonu) {   // konu listesi
      $("mesajBaslik").textContent = "Mesajlar"; form.hidden = true; $("mesajNot").textContent = "Birebir mesajlar uçtan uca şifreli. Ortak duvarı üyelerin hepsi görür.";
      liste.innerHTML = "";
      for (const k of ["herkes"].concat(PR.SIRA.filter((s) => s !== slug))) {
        const son = mesajlar.filter((m) => konuOf(m) === k).pop(), n = okunmamis(k);
        const b = el("button", "konu" + (n ? " yeni" : ""));
        b.style.setProperty("--p", k === "herkes" ? "var(--acc)" : P[k].renk);
        b.innerHTML = '<span class="kav">' + (k === "herkes" ? "★" : P[k].ad[0]) + '</span><span class="kmet"><b>' + konuAdi(k) + "</b><small></small></span>" + (n ? "<i>" + n + "</i>" : "");
        if (son) { cozMesaj(son).then((t) => { b.querySelector("small").textContent = (son.kimden === slug ? "Sen: " : k === "herkes" ? P[son.kimden].ad + ": " : "") + (t === false ? "🔒 açılamadı" : t || "🔒"); }); }
        else b.querySelector("small").textContent = k === "herkes" ? "Herkese bir şey yaz" : "Henüz mesaj yok";
        b.onclick = () => { mKonu = k; mesajCiz(); window.scrollTo(0, 0); };
        liste.appendChild(b);
      }
      return;
    }
    // konu içi
    const k = mKonu; $("mesajBaslik").textContent = konuAdi(k); mesajNotYaz();
    const l = mesajlar.filter((m) => konuOf(m) === k);
    liste.innerHTML = l.length ? "" : '<p class="ince orta">Henüz mesaj yok. İlk sen yaz.</p>';
    let oncekiGun = "";
    for (const m of l) {
      const z = new Date(m.zaman), gun = z.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
      if (gun !== oncekiGun) { liste.appendChild(el("div", "mgun", gun)); oncekiGun = gun; }
      const ben = m.kimden === slug, d = el("div", "balon" + (ben ? " ben" : ""));
      d.innerHTML = (k === "herkes" && !ben ? "<b>" + kac(P[m.kimden] ? P[m.kimden].ad : m.kimden) + "</b>" : "") + '<p>…</p><small>' + PR.p2(z.getHours()) + ":" + PR.p2(z.getMinutes()) + "</small>";
      cozMesaj(m).then((t) => { const p = d.querySelector("p"); if (t === false) { p.textContent = "🔒 Eski anahtarla şifrelenmiş, açılamıyor."; d.classList.add("kilitli"); } else p.textContent = t; });
      if (ben) { let emin = false; d.onclick = async () => { if (!emin) { emin = true; d.classList.add("silsor"); setTimeout(() => { emin = false; d.classList.remove("silsor"); }, 2500); return; } const { error } = await sb.from("st_mesaj").delete().eq("id", m.id); if (!error) { mesajlar = mesajlar.filter((x) => x !== m); mesajCiz(); } }; d.title = "Silmek için iki kez dokun"; }
      liste.appendChild(d);
    }
    form.hidden = false;
    const enSon = l.length ? l[l.length - 1].id : 0;
    V.mesaj_okundu = V.mesaj_okundu || {};
    if (enSon > (V.mesaj_okundu[k] || 0)) { V.mesaj_okundu[k] = enSon; kaydet(); mesajSayCiz(); }
    setTimeout(() => window.scrollTo(0, document.body.scrollHeight), 30);
  }
  $("mesajForm").onsubmit = async (e) => {
    e.preventDefault();
    const ta = $("mesajMetin"), t = ta.value.trim(), b = $("mesajGonder"), k = mKonu; if (!t || !k || !sb) return;
    b.disabled = true;
    try {
      const satir = { kimden: slug, kime: k, metin: t };
      if (k !== "herkes") {
        await acikAnahtarlar();
        const ak = aciklar[k];
        if (!ak) { tost(P[k].ad + " henüz mesaj şifresini kurmadı. Kurunca yazabilirsin."); return; }
        satir.metin = await SF.sifrele(ozel, ak, t); satir.ak_gonderen = V.anahtar.ak; satir.ak_alici = SF.acikSade(ak);
      }
      const { data, error } = await sb.from("st_mesaj").insert(satir).select("id,kimden,kime,metin,ak_gonderen,ak_alici,zaman").single();
      if (error) { tost("Gönderilemedi: " + error.message); return; }
      cozulmus[data.id] = t; ta.value = ""; ta.style.height = "";
      mesajlar.push(data); mesajSon = Math.max(mesajSon, data.id); mesajCiz();
      sb.auth.getSession().then(({ data: s }) => fetch("api/mesaj", { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + s.session.access_token }, body: JSON.stringify({ id: data.id }) })).catch(() => {});
    } catch (er) { tost("Gönderilemedi."); } finally { b.disabled = false; }
  };
  $("mesajMetin").oninput = () => { const ta = $("mesajMetin"); ta.style.height = ""; ta.style.height = Math.min(160, ta.scrollHeight) + "px"; };
  $("mesajBtn").onclick = () => { mKonu = null; sekmeAc("mesaj"); };
  $("mesajGeri").onclick = () => { if (mKonu) { mKonu = null; mesajCiz(); } else sekmeAc("bugun"); };
  function mesajBasla() { clearInterval(mesajZ); mesajCek(); mesajZ = setInterval(() => { if (!document.hidden) mesajCek(); }, 30000); }
  document.addEventListener("visibilitychange", () => { if (!document.hidden && slug) mesajCek(); });
  if (navigator.serviceWorker) navigator.serviceWorker.addEventListener("message", (e) => { if (e.data && e.data.ac === "mesaj" && slug) { mesajCek(); mKonu = null; sekmeAc("mesaj"); } });

  /* ---------- bildirim ---------- */
  const standalone = () => window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  async function bildirimDurum() {
    const d = $("bildirimDurum"), n = $("bildirimNot");
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      d.textContent = "Desteklenmiyor"; n.hidden = false;
      n.textContent = standalone() ? "Bu cihaz bildirim desteklemiyor." : "iPhone'da önce Safari → Paylaş → Ana Ekrana Ekle; sonra uygulamayı oradan aç.";
      return;
    }
    const r = await navigator.serviceWorker.ready, a = await r.pushManager.getSubscription();
    d.textContent = a && Notification.permission === "granted" ? "Açık" : "Kapalı"; n.hidden = true;
  }
  function b64(s) { const p = "=".repeat((4 - s.length % 4) % 4), r = atob((s + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from([...r].map((c) => c.charCodeAt(0))); }
  $("bildirimBtn").onclick = async () => {
    try {
      if (!("PushManager" in window)) return bildirimDurum();
      const r = await navigator.serviceWorker.ready;
      let a = await r.pushManager.getSubscription();
      if (a && Notification.permission === "granted") {
        await sb.from("st_abone").delete().eq("uc", a.endpoint); await a.unsubscribe(); tost("Bildirimler kapandı."); return bildirimDurum();
      }
      const izin = await Notification.requestPermission();
      if (izin !== "granted") { tost("İzin verilmedi. Ayarlar → Bildirimler'den açabilirsin."); return; }
      if (!a) {
        const { data: acik, error: ve } = await sb.rpc("st_vapid_acik");
        if (ve || !acik) { tost("Bildirim hattı henüz kurulmadı. Fati'ye haber ver."); return; }
        a = await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(acik) });
      }
      const { error } = await sb.from("st_abone").upsert({ uc: a.endpoint, uid, slug, veri: a.toJSON(), guncel: new Date().toISOString() });
      if (error) throw error;
      tost("Bildirimler açık. Günde iki tane, o kadar."); bildirimDurum();
    } catch (e) { tost("Bildirim açılamadı: " + (e.message || e)); }
  };

  $("tanitimBtn").onclick = () => tanitimAc();
  $("ysCikis").onclick = async () => { await idb("sil"); ozel = null; clearInterval(mesajZ); if (sb) await sb.auth.signOut(); slug = uid = null; girisCiz(); };
  $("sifreBtn").onclick = () => { avatar($("ysAvatar"), slug); goster("yeniSifre"); };
  $("cikisBtn").onclick = async () => { await idb("sil"); ozel = null; clearInterval(mesajZ); if (sb) await sb.auth.signOut(); slug = uid = null; girisCiz(); };

  /* ---------- başlangıç ---------- */
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
  setInterval(() => { if (slug && !$("uyg").hidden) { ustCiz(); bugunCiz(); } }, 60000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden && slug) { ciz(); esitleOku(); } });

  (async function () {
    const on = location.hostname === "localhost" && location.hash.match(/^#onizleme=(\w+)$/);   // yalnız yerel ekran kontrolü
    if (on && P[on[1]]) { sb = null; return oturumAc({ email: on[1] + ALAN, id: "yerel", user_metadata: { sifre_degisti: true } }); }
    if (!sb) return girisCiz();
    const { data } = await sb.auth.getSession();
    if (data && data.session && data.session.user) oturumAc(data.session.user); else girisCiz();
  })();

  window.__st = { durum: () => ({ slug, V }) };   // test için
})();
