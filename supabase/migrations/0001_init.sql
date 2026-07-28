-- BATSO Secim Kampanyasi - ilk sema
-- Bu dosyayi Supabase projenizde SQL Editor'den calistirin
-- (veya `supabase db push` ile, Supabase CLI kuruluysa).

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ---------- enum tipleri ----------

create type user_role as enum ('admin','saha','telefon','grup_sorumlusu','secim_gunu');
create type destek_durumu as enum ('kesin_destek','kararsiz','rakip','gorusulmedi','oy_kullanamaz');
create type gorusme_tipi as enum ('telefon','yuz_yuze');
create type secim_gunu_durumu as enum ('bekleniyor','yolda','oy_kullandi','ulasilamiyor','arac_gonderilecek','yetki_sorunu');

-- ---------- meslek gruplari ----------

create table meslek_gruplari (
  id uuid primary key default gen_random_uuid(),
  ad text not null unique,
  sira int not null,
  hedef_meclis_uyesi int not null default 0
);

insert into meslek_gruplari (ad, sira)
select format('%s. Grup', n), n
from generate_series(1, 11) as n;

-- ---------- profiles (auth.users ile 1-1) ----------

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  ad_soyad text,
  rol user_role not null default 'saha',
  meslek_grubu_id uuid references meslek_gruplari(id),
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- firmalar / uyeler ----------

create table firmalar (
  id uuid primary key default gen_random_uuid(),
  firma_unvani text not null,
  yetkili_kisi text,
  yetkili_telefon text,
  meslek_grubu_id uuid references meslek_gruplari(id),
  vergi_no text,
  oda_sicil_no text,
  oy_kullanacak_kisi text,
  yetki_belgesi_durumu text,
  aidat_engel_durumu text,
  adres text,
  soyisim_grubu text,
  notlar text,
  destek_durumu destek_durumu not null default 'gorusulmedi',
  ana_sorumlu_id uuid references profiles(id),
  ikinci_baglanti_id uuid references profiles(id),
  aile_dostluk_notu text,
  son_gorusme_sonucu text,
  bekleyen_gorev text,
  tekrar_arama_tarihi date,
  secim_gunu_durumu secim_gunu_durumu not null default 'bekleniyor',
  sandik_grup_bilgisi text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index firmalar_meslek_grubu_idx on firmalar (meslek_grubu_id);
create index firmalar_ana_sorumlu_idx on firmalar (ana_sorumlu_id);
create index firmalar_destek_durumu_idx on firmalar (destek_durumu);
create index firmalar_soyisim_grubu_idx on firmalar (soyisim_grubu);
create index firmalar_unvan_trgm_idx on firmalar using gin (firma_unvani gin_trgm_ops);

-- ---------- gorusmeler / ziyaretler ----------

create table gorusmeler (
  id uuid primary key default gen_random_uuid(),
  firma_id uuid not null references firmalar(id) on delete cascade,
  gorusen_id uuid references profiles(id),
  tip gorusme_tipi not null,
  sonuc text,
  talep_problem text,
  tekrar_arama_tarihi date,
  yonlendirilecek_kisi_id uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index gorusmeler_firma_idx on gorusmeler (firma_id, created_at desc);

-- ---------- islem kayitlari (KVKK / denetim izi) ----------

create table islem_kayitlari (
  id uuid primary key default gen_random_uuid(),
  kullanici_id uuid references profiles(id),
  eylem text not null,
  hedef_tablo text not null,
  hedef_id uuid,
  detay jsonb,
  created_at timestamptz not null default now()
);

create index islem_kayitlari_kullanici_idx on islem_kayitlari (kullanici_id, created_at desc);

-- ---------- updated_at tetikleyicisi ----------

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger firmalar_set_updated_at
before update on firmalar
for each row execute function set_updated_at();

-- ---------- yeni auth kullanicisi icin otomatik profil ----------

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();

-- ---------- yardimci fonksiyonlar ----------

create or replace function current_role_is(target_role user_role)
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and rol = target_role and aktif = true
  );
$$ language sql stable security definer set search_path = public;

create or replace function is_admin()
returns boolean as $$
  select current_role_is('admin');
$$ language sql stable security definer set search_path = public;

create or replace function current_meslek_grubu_id()
returns uuid as $$
  select meslek_grubu_id from profiles where id = auth.uid();
$$ language sql stable security definer set search_path = public;

-- ---------- RLS ----------

alter table profiles enable row level security;
alter table meslek_gruplari enable row level security;
alter table firmalar enable row level security;
alter table gorusmeler enable row level security;
alter table islem_kayitlari enable row level security;

-- profiles
create policy "profiles: kendi kaydini gorur" on profiles
  for select using (id = auth.uid() or is_admin());

create policy "profiles: admin gunceller" on profiles
  for update using (is_admin());

create policy "profiles: admin ekler" on profiles
  for insert with check (is_admin());

-- meslek_gruplari: tum girisli kullanicilar okuyabilir
create policy "meslek_gruplari: herkes okur" on meslek_gruplari
  for select using (auth.uid() is not null);

create policy "meslek_gruplari: admin yazar" on meslek_gruplari
  for all using (is_admin()) with check (is_admin());

-- firmalar
create policy "firmalar: admin tum erisim" on firmalar
  for all using (is_admin()) with check (is_admin());

create policy "firmalar: sorumlu gorur" on firmalar
  for select using (
    ana_sorumlu_id = auth.uid()
    or ikinci_baglanti_id = auth.uid()
    or (current_role_is('grup_sorumlusu') and meslek_grubu_id = current_meslek_grubu_id())
    or current_role_is('secim_gunu')
  );

create policy "firmalar: sorumlu gunceller" on firmalar
  for update using (
    ana_sorumlu_id = auth.uid()
    or ikinci_baglanti_id = auth.uid()
    or current_role_is('secim_gunu')
  );

-- gorusmeler
create policy "gorusmeler: admin tum erisim" on gorusmeler
  for all using (is_admin()) with check (is_admin());

create policy "gorusmeler: ilgili kullanici gorur" on gorusmeler
  for select using (
    gorusen_id = auth.uid()
    or exists (
      select 1 from firmalar f
      where f.id = firma_id
        and (f.ana_sorumlu_id = auth.uid() or f.ikinci_baglanti_id = auth.uid())
    )
    or exists (
      select 1 from firmalar f
      where f.id = firma_id
        and current_role_is('grup_sorumlusu')
        and f.meslek_grubu_id = current_meslek_grubu_id()
    )
  );

create policy "gorusmeler: sorumlu ekler" on gorusmeler
  for insert with check (
    gorusen_id = auth.uid()
    and exists (
      select 1 from firmalar f
      where f.id = firma_id
        and (f.ana_sorumlu_id = auth.uid() or f.ikinci_baglanti_id = auth.uid())
    )
  );

-- islem_kayitlari: sadece admin okur, herkes kendi eylemini yazabilir
create policy "islem_kayitlari: admin okur" on islem_kayitlari
  for select using (is_admin());

create policy "islem_kayitlari: kullanici kendi kaydini yazar" on islem_kayitlari
  for insert with check (kullanici_id = auth.uid());
