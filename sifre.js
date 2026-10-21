/* Bozkurt Ordusu · birebir mesajlar için uçtan uca şifreleme (tarayıcının kendi WebCrypto'su, dış kütüphane yok).
   - Herkesin bir anahtar çifti var (ECDH P-256). Açık yarısı st_anahtar tablosunda, herkes görür.
   - Gizli yarısı kullanıcının MESAJ ŞİFRESİYLE kilitlenip (PBKDF2 600.000 tur → AES-GCM) kendi satırında durur.
     Mesaj şifresi hiçbir yere gönderilmez; veritabanını gören (proje sahibi dahil) gizli anahtarı açamaz.
   - İki kişi arasındaki anahtar: ECDH ortak sırrı → HKDF → AES-GCM 256. Her mesaj rastgele 12 baytlık IV ile şifrelenir.
   Sınır: kodu yayınlayan kişi kodu değiştirebilir. Bu katman "veritabanından okunamaz" garantisi verir. */
(function (kok) {
  "use strict";
  const S = kok.crypto.subtle, rastgele = (n) => kok.crypto.getRandomValues(new Uint8Array(n));
  const enc = new TextEncoder(), dec = new TextDecoder();
  const b64 = (u) => { const a = new Uint8Array(u); let s = ""; for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s); };
  const b64c = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const TUR = 600000, EC = { name: "ECDH", namedCurve: "P-256" };
  const acikSade = (j) => ({ kty: "EC", crv: "P-256", x: j.x, y: j.y });

  async function parolaAnahtari(parola, tuz, tur) {
    const ham = await S.importKey("raw", enc.encode(parola.normalize("NFC")), "PBKDF2", false, ["deriveKey"]);
    return S.deriveKey({ name: "PBKDF2", salt: tuz, iterations: tur, hash: "SHA-256" }, ham, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  }
  /* Yeni anahtar çifti: { kayit } sunucuya (kendi satırına) gider, { ozel } yalnız bu cihazda kalır (dışa aktarılamaz). */
  async function yeniAnahtar(parola) {
    const cift = await S.generateKey(EC, true, ["deriveBits"]);
    const ozJ = await S.exportKey("jwk", cift.privateKey), akJ = await S.exportKey("jwk", cift.publicKey);
    const tuz = rastgele(16), iv = rastgele(12);
    const k = await parolaAnahtari(parola, tuz, TUR);
    const ct = await S.encrypt({ name: "AES-GCM", iv }, k, enc.encode(JSON.stringify(ozJ)));
    const kayit = { s: 1, ak: acikSade(akJ), tuz: b64(tuz), tur: TUR, kilit: b64(iv) + "." + b64(ct) };
    return { kayit, ozel: await S.importKey("jwk", ozJ, EC, false, ["deriveBits"]) };
  }
  /* Kilidi aç: yanlış şifrede hata fırlatır. */
  async function kilitAc(kayit, parola) {
    const [iv, ct] = kayit.kilit.split(".");
    const k = await parolaAnahtari(parola, b64c(kayit.tuz), kayit.tur || TUR);
    const duz = await S.decrypt({ name: "AES-GCM", iv: b64c(iv) }, k, b64c(ct));
    return S.importKey("jwk", JSON.parse(dec.decode(duz)), EC, false, ["deriveBits"]);
  }
  const onbellek = new Map();
  async function ortak(ozel, ak) {
    const anah = ak.x + ak.y; if (onbellek.has(anah) && onbellek.get(anah).o === ozel) return onbellek.get(anah).k;
    const pub = await S.importKey("jwk", acikSade(ak), EC, false, []);
    const bit = await S.deriveBits({ name: "ECDH", public: pub }, ozel, 256);
    const h = await S.importKey("raw", bit, "HKDF", false, ["deriveKey"]);
    const k = await S.deriveKey({ name: "HKDF", hash: "SHA-256", salt: new Uint8Array(32), info: enc.encode("bozkurt-mesaj-1") }, h, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    onbellek.set(anah, { o: ozel, k }); return k;
  }
  async function sifrele(ozel, akKarsi, metin) {
    const iv = rastgele(12), k = await ortak(ozel, akKarsi);
    return "e1." + b64(iv) + "." + b64(await S.encrypt({ name: "AES-GCM", iv }, k, enc.encode(metin)));
  }
  async function coz(ozel, akKarsi, s) {
    const [on, iv, ct] = String(s).split("."); if (on !== "e1") throw new Error("biçim");
    const k = await ortak(ozel, akKarsi);
    return dec.decode(await S.decrypt({ name: "AES-GCM", iv: b64c(iv) }, k, b64c(ct)));
  }
  const ayni = (a, b) => !!(a && b && a.x === b.x && a.y === b.y);
  const api = { yeniAnahtar, kilitAc, sifrele, coz, ayni, acikSade };
  if (typeof module === "object" && module.exports) module.exports = api; else kok.Sifre = api;
})(typeof window !== "undefined" ? window : globalThis);
