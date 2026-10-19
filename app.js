/* sexy tangent · uygulama
   Giriş: Supabase Auth (profil başına bir hesap). Veri önce telefonda tutulur, sonra st_veri tablosuna eşitlenir;
   satır güvenliği yüzünden herkes yalnız kendi satırını görür. */
(function () {
  "use strict";
  const SURUM = "st-v1";
  const SB_URL = "https://pqzjayxdrnpokyffyole.supabase.co";
  const SB_ANAHTAR = "sb_publishable_ViJ3hRKsZVHcDpVVUA3BOw_ZOZbDMRD";
  const ALAN = "@sexy-tangent.app";
  const VAPID = "BHT0QWpoQhHqvLq8NHfAvAQPXpWX5PDKpsxuMgsrQLISLQV1-UZGhM_GZqoRdhIINq5JkfiqIxtLkJIIMjvWeGw";
  const PR = window.Profiller, P = PR.P;
  const GUNLER = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  const KISA = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
  const RAF = {
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
    r.setProperty("--acc", p ? p.renk : "#C98A5B");
    r.setProperty("--acc2", p ? p.renk2 : "#E0B48F");
    r.setProperty("--desen", "url(icons/desen-" + (p ? p.desen : "bogaz") + ".svg)");
  }
  function avatar(e, s) { e.textContent = P[s].ad[0]; }

  /* ---------- ekranlar ---------- */
  function goster(id) { for (const e of ["giris", "yeniSifre", "uyg"]) $(e).hidden = e !== id; window.scrollTo(0, 0); }

  function girisCiz() {
    tema(null); goster("giris");
    const k = $("profiller"); k.innerHTML = "";
    for (const s of PR.SIRA) {
      const p = P[s], b = el("button", "profil");
      b.style.setProperty("--p", p.renk); b.style.setProperty("--p2", p.renk2); b.style.setProperty("--pd", "url(icons/desen-" + p.desen + ".svg)");
      b.innerHTML = '<div class="kutu"><b>' + p.ad[0] + "</b></div><span>" + p.ad + "</span><small>" + kac(p.etiket) + "</small>";
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
    const { error } = await sb.auth.updateUser({ password: a, data: { sifre_degisti: true } });
    if (error) return hata("ysHata", /different|same/i.test(error.message) ? "Yeni şifre eskisinden farklı olmalı." : error.message);
    $("ys1").value = $("ys2").value = ""; $("ysHata").hidden = true; tost("Şifren kaydedildi."); uygAc();
  };

  function oturumAc(user) {
    const s = (user.email || "").split("@")[0];
    if (!P[s]) { tost("Bu hesap için profil yok."); sb.auth.signOut(); return girisCiz(); }
    slug = s; uid = user.id; tema(s); yukle();
    if (!(user.user_metadata && user.user_metadata.sifre_degisti)) { avatar($("ysAvatar"), s); goster("yeniSifre"); return; }
    uygAc();
  }
  function uygAc() { goster("uyg"); navCiz(); ciz(); esitleOku(); bildirimDurum(); }

  /* ---------- alt gezinti ---------- */
  const IKON = {
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
    for (const b of $("altNav").children) b.classList.toggle("on", b.dataset.s === id);
    for (const s of document.querySelectorAll(".sekme")) s.classList.toggle("on", s.id === "s-" + id);
    window.scrollTo(0, 0);
  }
  $("avatarBtn").onclick = () => sekmeAc("ayar");

  /* ---------- çizim ---------- */
  function ciz() { if (!slug) return; ustCiz(); bugunCiz(); haftaCiz(); netCiz(); okuCiz(); kitapCiz(); $("surum").textContent = "sexy tangent · " + SURUM; }

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
    if (hedef) {
      const bt = el("button", "btn", "✓ " + kac(hedef.ad) + " bitti");
      bt.onclick = () => { isaretle(g, hedef, true); tost(p.nazik ? "Bir adım daha. Aferin." : "İşaretlendi. Devam."); };
      k.appendChild(bt);
    }

    // haftalık ilerleme: cezalandırmaz, sadece gösterir
    const hb = haftaBasi(g); let top = 0, yap = 0;
    for (let i = 0; i < 7; i++) { const gg = gunEkle(hb, i), bl = PR.gunluk(slug, gg).filter((b) => b.say); top += bl.length; yap += bl.filter((b) => isaretli(gg, b)).length; }
    $("haftaIlerleme").innerHTML = top ? "<span>Bu hafta</span><div class=\"cubuk\"><i style=\"width:" + Math.round(yap / top * 100) + "%\"></i></div><b>" + yap + "/" + top + "</b>" : "";

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
    if (p.tur !== "uni" && slug !== "salih") k.appendChild(el("div", "raf yakinda", "<b>Matematik</b><span>TYT temel matematik rafı yazılıyor.</span>"));
  }

  function kitapCiz() {
    const k = $("kitaplar"); if (P[slug].tur !== "uni") return;
    k.innerHTML = '<div class="kart"><b>Ders içeriklerin ve Storytel listen hazırlanıyor.</b><p class="ince">İçerikleri gönderince dersler burada, dinleme listen de altında olacak. Şimdilik her akşam 30 dakika okuma/dinleme bloğun var.</p></div>';
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
      a = a || await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(VAPID) });
      const { error } = await sb.from("st_abone").upsert({ uc: a.endpoint, uid, slug, veri: a.toJSON(), guncel: new Date().toISOString() });
      if (error) throw error;
      tost("Bildirimler açık. Günde iki tane, o kadar."); bildirimDurum();
    } catch (e) { tost("Bildirim açılamadı: " + (e.message || e)); }
  };

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
