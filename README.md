# Karaambar Kamyoncular Derneği

Arkadaşlar için tek site, Netflix gibi profil seçimi. Statik PWA + tek sunucu işlevi (`api/bildir.js`).

- `profiller.js` — dört profilin programı, teması, cümleleri, bildirim saatleri
- `app.js` — arayüz; giriş Supabase Auth ile, veri `st_veri` tablosunda (satır güvenliği: herkes yalnız kendini görür)
- `oku/` — ders sayfaları
- `supabase/kurulum.sql` — tablolar ve bildirim zamanlayıcısı (275'in Supabase projesinde, `st_` önekli)
- Test: `node araclar/test.js`

Bildirimlerde sınav, ders ya da okul adı geçmez (test bunu denetler).
