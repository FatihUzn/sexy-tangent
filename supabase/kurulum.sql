-- sexy tangent · 275'in Supabase projesine AYRI tablolar (hepsi st_ ile başlar).
-- 275'in tablolarına (esitleme, abone, ayar) dokunmaz; 275 Supabase girişini kullanmadığı için
-- buraya açılan hesapların 275 verisine hiçbir yolu yoktur.
-- Supabase → SQL Editor → bunu yapıştır → Run. Bir kez çalıştırılır; tekrar çalıştırmak zarar vermez.

create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- Kimin hangi profil olduğu. Yalnız bu listedeki e-postalar veri yazabilir.
create table if not exists public.st_uye (email text primary key, slug text unique not null);
insert into public.st_uye (email, slug) values
  ('salih@sexy-tangent.app', 'salih'),
  ('erhan@sexy-tangent.app', 'erhan'),
  ('samed@sexy-tangent.app', 'samed'),
  ('taha@sexy-tangent.app',  'taha')
on conflict (email) do nothing;
alter table public.st_uye enable row level security;
drop policy if exists st_uye_kendi on public.st_uye;
create policy st_uye_kendi on public.st_uye for select to authenticated using (email = (auth.jwt() ->> 'email'));

create or replace function public.st_slug() returns text language sql stable security definer set search_path = '' as $$
  select u.slug from public.st_uye u where u.email = (auth.jwt() ->> 'email')
$$;
revoke all on function public.st_slug() from public, anon;
grant execute on function public.st_slug() to authenticated;

-- Kişisel veri: işaretler, denemeler. Herkes yalnız kendi satırını görür ve yazar.
create table if not exists public.st_veri (
  uid    uuid primary key references auth.users(id) on delete cascade,
  slug   text not null,
  veri   jsonb not null default '{}'::jsonb,
  guncel timestamptz not null default now()
);
alter table public.st_veri enable row level security;
drop policy if exists st_veri_sahip on public.st_veri;
create policy st_veri_sahip on public.st_veri for all to authenticated
  using (uid = auth.uid())
  with check (uid = auth.uid() and slug = public.st_slug() and octet_length(veri::text) < 1000000);

-- Bildirim abonelikleri (telefon başına bir satır).
create table if not exists public.st_abone (
  uc     text primary key,
  uid    uuid not null references auth.users(id) on delete cascade,
  slug   text not null,
  veri   jsonb not null,
  guncel timestamptz not null default now()
);
alter table public.st_abone enable row level security;
drop policy if exists st_abone_sahip on public.st_abone;
create policy st_abone_sahip on public.st_abone for all to authenticated
  using (uid = auth.uid())
  with check (uid = auth.uid() and slug = public.st_slug() and uc like 'https://%' and length(uc) < 1000);

-- Sunucu tarafı: yalnız bildirim şifresini bilen okuyabilir. Şifrenin kendisi saklanmaz, özeti saklanır.
create table if not exists public.st_ayar (ad text primary key, deger text not null);
alter table public.st_ayar enable row level security;

create or replace function public.st_bildirim_yetki(p_sifre text)
returns boolean language sql security definer set search_path = '' as $$
  select p_sifre is not null and length(p_sifre) >= 24 and exists (
    select 1 from public.st_ayar a where a.ad = 'bildirim_sifre_ozet'
      and a.deger = encode(extensions.digest(p_sifre, 'sha256'), 'hex'));
$$;

create or replace function public.st_abone_liste(p_sifre text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if not public.st_bildirim_yetki(p_sifre) then raise exception 'yetkisiz'; end if;
  return jsonb_build_object(
    'aboneler', coalesce((select jsonb_agg(jsonb_build_object('slug', a.slug, 'abone', a.veri)) from public.st_abone a), '[]'::jsonb),
    'ozet', coalesce((select jsonb_object_agg(v.slug, v.veri -> 'bugun_ozet') from public.st_veri v), '{}'::jsonb),
    'vapid', jsonb_build_object(
      'acik', (select deger from public.st_ayar where ad = 'vapid_acik'),
      'ozel', (select deger from public.st_ayar where ad = 'vapid_ozel')));
end $$;

create or replace function public.st_abone_dus(p_sifre text, p_uc text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if not public.st_bildirim_yetki(p_sifre) then raise exception 'yetkisiz'; end if;
  delete from public.st_abone where uc = p_uc;
  return true;
end $$;

-- Bildirim imza anahtarları: sitenin sunucu işlevi ilk çalıştığında kendisi üretir ve buraya bir kez yazar.
-- Böylece hiçbir gizli anahtar elle taşınmaz. Açık anahtarı herkes okuyabilir (telefonun abone olması için gerekir).
create or replace function public.st_vapid_kaydet(p_sifre text, p_acik text, p_ozel text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if not public.st_bildirim_yetki(p_sifre) then raise exception 'yetkisiz'; end if;
  insert into public.st_ayar (ad, deger) values ('vapid_acik', p_acik), ('vapid_ozel', p_ozel) on conflict (ad) do nothing;
  return true;
end $$;
create or replace function public.st_vapid_acik()
returns text language sql stable security definer set search_path = '' as $$
  select deger from public.st_ayar where ad = 'vapid_acik'
$$;

-- Kurulum: şifrenin özetini saklar, 5 dakikada bir siteyi dürten zamanlayıcıyı kurar, deneme bildirimi yollar.
create or replace function public.st_bildirim_kur(p_sifre text, p_adres text)
returns text language plpgsql security definer set search_path = '' as $$
declare adres text := rtrim(p_adres, '/'); bas jsonb;
begin
  if p_sifre is null or length(p_sifre) < 24 then raise exception 'sifre en az 24 karakter olmali'; end if;
  if adres not like 'https://%' then raise exception 'adres https:// ile baslamali'; end if;
  insert into public.st_ayar (ad, deger) values ('bildirim_sifre_ozet', encode(extensions.digest(p_sifre, 'sha256'), 'hex'))
  on conflict (ad) do update set deger = excluded.deger;
  bas := jsonb_build_object('content-type', 'application/json', 'x-sifre', p_sifre);
  perform cron.unschedule(j.jobid) from cron.job j where j.jobname = 'st-bildir';
  perform cron.schedule('st-bildir', '*/5 * * * *',
    format('select net.http_post(url := %L, headers := %L::jsonb, body := %L::jsonb)', adres || '/api/bildir', bas::text, '{}'));
  perform net.http_post(url := adres || '/api/bildir', headers := bas, body := '{"deneme":true}'::jsonb);
  return 'Tamam: zamanlayıcı kuruldu. Abone sayısı: ' || (select count(*) from public.st_abone);
end $$;

revoke all on function public.st_bildirim_yetki(text) from public, anon, authenticated;
revoke all on function public.st_bildirim_kur(text, text) from public, anon, authenticated;
revoke all on function public.st_abone_liste(text) from public;
revoke all on function public.st_abone_dus(text, text) from public;
grant execute on function public.st_abone_liste(text) to anon, authenticated;
grant execute on function public.st_abone_dus(text, text) to anon, authenticated;
revoke all on function public.st_vapid_kaydet(text, text, text) from public;
grant execute on function public.st_vapid_kaydet(text, text, text) to anon, authenticated;
revoke all on function public.st_vapid_acik() from public;
grant execute on function public.st_vapid_acik() to anon, authenticated;

select 'sexy tangent tabloları hazır' as sonuc;
