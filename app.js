/* Karaambar Kamyoncular Derneği · uygulama
   Giriş: Supabase Auth (profil başına bir hesap). Veri önce telefonda tutulur, sonra st_veri tablosuna eşitlenir;
   satır güvenliği yüzünden herkes yalnız kendi satırını görür. */
(function () {
  "use strict";
  const SURUM = "st-v13";
  const SB_URL = "https://pqzjayxdrnpokyffyole.supabase.co";
  const SB_ANAHTAR = "sb_publishable_ViJ3hRKsZVHcDpVVUA3BOw_ZOZbDMRD";
  const ALAN = "@sexy-tangent.app";
  const PR = window.Profiller, P = PR.P;
  const GUNLER = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  const KISA = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
  const RAF = {
    mat: ["Matematik", "Sayılardan olasılığa, 48 parça"], geo: ["Geometri", "Açıdan çembere, TYT kısmı"],
    turkce: ["Türkçe", "Paragraf, anlam, dil bilgisi"], sosyal: ["Sosyal", "Tarih, coğrafya, felsefe, din"],
    fizik: ["Fizik", "Hareketten modern fiziğe"], kimya: ["Kimya", "Atomdan organiğe"], biyo: ["Biyoloji", "Hücreden ekolojiye"]
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
  function uygAc() { goster("uyg"); navCiz(); ciz(); esitleOku(); bildirimDurum(); if (!V.tanitim) setTimeout(tanitimAc, 400); }

  /* ---------- kullanım tanıtımı: ilk girişte bir kez, sonra Ayar'dan ---------- */
  function tanitimSayfalari() {
    const p = P[slug], t = p.tur, l = [];
    l.push(["Hoş geldin " + p.ad, "Burası senin sayfan. Sadece sen görürsün: işaretlerin ve notların senin hesabında durur, başka profiller açamaz."]);
    l.push(["Bugün", "Üstteki kart şu an ne yapman gerektiğini söyler. Bir bloğu bitirince <b>✓ bitti</b>'ye bas ya da listedeki kutuyu işaretle. Kaçırdığın gün için ceza yok; haftalık çubuk sadece gösterir."]);
    if (p.plan3) l.push(["Bugünün 3 işi", "Sabah gün planında üç iş yaz, bitirdikçe işaretle. Üçü de bitince gün kazanılmıştır."]);
    l.push(["Hafta", "Haftanın tamamını tek ekranda görürsün: hangi gün ne var, kaçını bitirdin."]);
    if (t === "yks" || t === "karma") {
      l.push(["Netler", "Her denemeden sonra <b>+ Deneme ekle</b> ile netlerini gir. Hedefle yan yana görürsün; en çok açık olan ders kırmızı yanar."]);
      l.push(["Oku", "Konu anlatımları burada. Her parça tek oturuşta biter, sonunda kısa bir quiz var. Programdaki ders bloğunda o dersin rafını aç."]);
    }
    if (t === "uni") l.push(["Kitaplık", "Okuma listen sırayla burada. Bitirdiğini işaretle. Ders içeriklerin gelince aynı sekmeye eklenecek."]);
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
    spor: '<svg viewBox="0 0 24 24"><path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/></svg>',
    bugun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>',
    hafta: '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>',
    net: '<svg viewBox="0 0 24 24"><path d="M5 19V11M12 19V5M19 19v-6"/></svg>',
    oku: '<svg viewBox="0 0 24 24"><path d="M4 5h6a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h6z"/></svg>',
    kitap: '<svg viewBox="0 0 24 24"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="2"/><rect x="17" y="14" width="4" height="6" rx="2"/></svg>',
    ayar: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/></svg>'
  };
  function sekmeler() {
    const t = P[slug].tur, l = [["bugun", "Bugün"], ["hafta", "Hafta"]];
    if (t === "yks" || t === "karma") l.push(["net", "Netler"], ["oku", "Oku"]);
    if (t === "uni") l.push(["kitap", "Kitaplık"]);
    l.push(["spor", "Spor"], ["ayar", "Ayar"]);
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
    if (slug && V) { if (id === "bugun") bugunCiz(); else if (id === "hafta") haftaCiz(); else if (id === "spor") sporCiz(); }
    for (const b of $("altNav").children) b.classList.toggle("on", b.dataset.s === id);
    for (const s of document.querySelectorAll(".sekme")) s.classList.toggle("on", s.id === "s-" + id);
    window.scrollTo(0, 0);
  }
  $("avatarBtn").onclick = () => sekmeAc("ayar");

  /* ---------- çizim ---------- */
  function ciz() { if (!slug) return; ustCiz(); bugunCiz(); haftaCiz(); netCiz(); okuCiz(); kitapCiz(); sporCiz(); $("surum").textContent = "Karaambar Kamyoncular Derneği · " + SURUM; }

  function ustCiz() {
    const p = P[slug], m = simdiDk();
    const sel = m < 300 ? "Hâlâ ayakta mısın" : m < 720 ? "Günaydın" : m < 1080 ? "Selam" : "İyi akşamlar";
    $("selam").innerHTML = sel + ", <em>" + p.ad + "</em>";
    avatar($("avatarBtn"), slug);
    const k = (p.tur === "yks" || p.tur === "karma") ? PR.kalan(bugun()) : null;
    $("kalan").innerHTML = k ? "<b>" + k + "</b> · " + GUNLER[PR.haftaGunu(bugun())] : GUNLER[PR.haftaGunu(bugun())] + " · " + PR.haftaNo(bugun()) + ". hafta";
    const c = p.cumleler; $("sozMetin").textContent = c[PR.gunNo(bugun()) % c.length];
  }

  function isaretli(g, b) { return !!(V.isaret[g] || {})[b.s]; }
  function isaretle(g, b, durum) {
    V.isaret[g] = V.isaret[g] || {};
    if (durum) V.isaret[g][b.s] = 1; else delete V.isaret[g][b.s];
    kaydet(); bugunCiz(); haftaCiz();
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
      const bt = el("button", "btn", "✓ " + kac(hedef.ad) + " bitti");
      bt.onclick = () => { isaretle(g, hedef, true); tost(p.nazik ? "Bir adım daha. Aferin." : "İşaretlendi. Devam."); };
      k.appendChild(bt);
    }

    // haftalık ilerleme: cezalandırmaz, sadece gösterir
    const hb = haftaBasi(g); let top = 0, yap = 0;
    for (let i = 0; i < 7; i++) { const gg = gunEkle(hb, i), bl = PR.gunluk(slug, gg).filter((b) => b.say); top += bl.length; yap += bl.filter((b) => isaretli(gg, b)).length; }
    $("haftaIlerleme").innerHTML = top ? "<span>Bu hafta</span><div class=\"cubuk\"><i style=\"width:" + Math.round(yap / top * 100) + "%\"></i></div><b>" + yap + "/" + top + "</b>" : "";

    plan3Ciz(g); sporBugunCiz(g);
    $("profilNot").hidden = !p.not; $("profilNot").textContent = p.not || "";

    const ol = $("bloklar"); ol.innerHTML = "";
    for (const b of l) {
      const li = el("li", "blok" + (b.say ? "" : " pasif") + (b === su ? " simdiki" : "") + (b.say && isaretli(g, b) ? " bitti" : ""));
      li.innerHTML = '<span class="sa">' + b.s + '</span><span class="ad"><b>' + kac(b.ad) + "</b><small>" + b.s + "–" + b.b + "</small></span>";
      if (b.say) {
        const t = el("button", "tik" + (isaretli(g, b) ? " on" : ""), "✓");
        t.setAttribute("aria-label", b.ad + " bitti mi");
        t.onclick = () => isaretle(g, b, !isaretli(g, b));
        li.appendChild(t);
      }
      ol.appendChild(li);
    }
    if (!l.length) ol.appendChild(el("li", "blok pasif", '<span class="ad"><b>Bugün için plan yok.</b></span>'));
  }
  function sure(d) { return d < 60 ? d + " dk" : Math.floor(d / 60) + " sa" + (d % 60 ? " " + (d % 60) + " dk" : ""); }

  /* Günün 3 işi: sabah yazılır, gün içinde işaretlenir */
  function plan3Ciz(g) {
    const k = $("plan3"); if (!P[slug].plan3) { k.hidden = true; return; }
    k.hidden = false; V.plan = V.plan || {};
    const l = V.plan[g] || [{ t: "", ok: 0 }, { t: "", ok: 0 }, { t: "", ok: 0 }];
    k.innerHTML = '<span class="etk">Bugünün 3 işi</span>';
    l.forEach((x, i) => {
      const r = el("label"), t = el("button", "tik" + (x.ok ? " on" : ""), "✓"), inp = el("input");
      t.type = "button"; t.setAttribute("aria-label", (i + 1) + ". iş bitti mi");
      inp.type = "text"; inp.value = x.t; inp.placeholder = (i + 1) + ". iş"; inp.maxLength = 80;
      t.onclick = () => { if (!l[i].t) return; l[i].ok = l[i].ok ? 0 : 1; V.plan[g] = l; kaydet(); plan3Ciz(g); if (l.every((y) => y.ok)) tost("Üçü de tamam. Bugün kazandın."); };
      inp.onchange = () => { l[i].t = inp.value.trim(); V.plan[g] = l; kaydet(); };
      r.append(t, inp); k.appendChild(r);
    });
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
  $("ysCikis").onclick = async () => { if (sb) await sb.auth.signOut(); slug = uid = null; girisCiz(); };
  $("sifreBtn").onclick = () => { avatar($("ysAvatar"), slug); goster("yeniSifre"); };
  $("cikisBtn").onclick = async () => { if (sb) await sb.auth.signOut(); slug = uid = null; girisCiz(); };

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
