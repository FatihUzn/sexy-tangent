# Bozkurt Ordusu

Arkadaşlar için tek site, Netflix gibi profil seçimi. Statik PWA + tek sunucu işlevi (`api/bildir.js`).

- `profiller.js` — dört profilin programı, teması, cümleleri, bildirim saatleri
- `app.js` — arayüz; giriş Supabase Auth ile, veri `st_veri` tablosunda (satır güvenliği: herkes yalnız kendini görür)
- `oku/` — ders sayfaları
- `supabase/kurulum.sql` — tablolar ve bildirim zamanlayıcısı (275'in Supabase projesinde, `st_` önekli)
- `supabase/mesaj.sql` — yeni üyeler (Fikret, Fati), açık anahtarlar ve mesaj tablosu. kurulum.sql'den sonra bir kez çalıştırılır.
- `sifre.js` — birebir mesajların uçtan uca şifrelemesi (WebCrypto: ECDH P-256 + HKDF + AES-GCM; gizli anahtar mesaj şifresiyle PBKDF2 600.000 tur kilitli). Veritabanında birebir mesajlar yalnız `e1.` ile başlayan şifreli metin olarak durur; RLS düz metni reddeder.
- `api/kurlar.js` — döviz/altın (Truncgil, düşerse TCMB), 5 dk önbellek. `api/mesaj.js` — yeni mesajda alıcılara yalnız "Yeni mesaj" bildirimi.
- `oku/{tahsilat,pazarlik,ortaklik,sirket,banka,para}.html` — iş okumaları; koc-hukuk/arsiv kaynaklarından derlenip uyarlandı (kilit ve sınav şeridi kapalı).
- Test: `node araclar/test.js`

Bildirimlerde sınav, ders ya da okul adı geçmez (test bunu denetler).
