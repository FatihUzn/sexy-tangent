-- Bozkurt Ordusu · yeni üyeler + mesajlaşma. kurulum.sql'den SONRA, bir kez çalıştırılır; tekrar çalıştırmak zarar vermez.
-- Supabase → SQL Editor → yapıştır → Run.

-- 1) Yeni üyeler (Auth hesaplarını panelden ayrıca aç: Authentication → Users → Add user).
insert into public.st_uye (email, slug) values
  ('fikret@sexy-tangent.app', 'fikret'),
  ('fati@sexy-tangent.app',   'fati')
on conflict (email) do nothing;

create or replace function public.st_uye_mi(p_slug text) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.st_uye u where u.slug = p_slug)
$$;
revoke all on function public.st_uye_mi(text) from public, anon;
grant execute on function public.st_uye_mi(text) to authenticated;

-- 2) Açık anahtarlar: herkes okur (şifrelemek için gerekir), herkes yalnız kendininkini yazar.
--    Gizli anahtar burada DEĞİL: kullanıcının mesaj şifresiyle kilitlenip kendi st_veri satırında durur.
create table if not exists public.st_anahtar (
  slug   text primary key,
  ak     jsonb not null,
  guncel timestamptz not null default now()
);
alter table public.st_anahtar enable row level security;
drop policy if exists st_anahtar_oku on public.st_anahtar;
drop policy if exists st_anahtar_ekle on public.st_anahtar;
drop policy if exists st_anahtar_degis on public.st_anahtar;
create policy st_anahtar_oku   on public.st_anahtar for select to authenticated using (true);
create policy st_anahtar_ekle  on public.st_anahtar for insert to authenticated with check (slug = public.st_slug());
create policy st_anahtar_degis on public.st_anahtar for update to authenticated using (slug = public.st_slug()) with check (slug = public.st_slug());

-- 3) Mesajlar. kime: bir üye ya da 'herkes' (ortak duvar).
--    Birebir mesaj şifresiz kaydedilemez (metin 'e1.' ile başlamak zorunda): yanlışlıkla düz metin yazılmaz.
create table if not exists public.st_mesaj (
  id          bigint generated always as identity primary key,
  kimden      text not null,
  kime        text not null,
  metin       text not null check (length(metin) between 1 and 8000),
  ak_gonderen jsonb,
  ak_alici    jsonb,
  zaman       timestamptz not null default now()
);
create index if not exists st_mesaj_zaman on public.st_mesaj (id desc);
alter table public.st_mesaj enable row level security;
drop policy if exists st_mesaj_oku on public.st_mesaj;
drop policy if exists st_mesaj_yaz on public.st_mesaj;
drop policy if exists st_mesaj_sil on public.st_mesaj;
create policy st_mesaj_oku on public.st_mesaj for select to authenticated
  using (kime = 'herkes' or kime = public.st_slug() or kimden = public.st_slug());
create policy st_mesaj_yaz on public.st_mesaj for insert to authenticated
  with check (
    kimden = public.st_slug() and kime <> kimden
    and (kime = 'herkes' or (public.st_uye_mi(kime) and metin like 'e1.%'))
    and zaman between now() - interval '2 minutes' and now() + interval '2 minutes');
create policy st_mesaj_sil on public.st_mesaj for delete to authenticated using (kimden = public.st_slug());
revoke update on public.st_mesaj from authenticated, anon;

select 'Tamam: üyeler ' || (select count(*) from public.st_uye) || ', mesaj tablosu hazır.' as sonuc;
