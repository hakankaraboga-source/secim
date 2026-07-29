-- Parametrik yetkilendirme: temsilciler meslek grubu ve/veya mahalle
-- kapsamiyla yetkilendirilir; yonetici tum veriyi gorur.
-- 0007 calistirildiktan SONRA ayri bir sorgu olarak calistirin.

-- ---------- profiles: yetki kapsamlari ----------

alter table profiles add column yetki_meslek_gruplari uuid[] not null default '{}';
alter table profiles add column yetki_mahalleler text[] not null default '{}';

-- Eski rolleri yeni modele tasi
update profiles
set rol = 'temsilci'
where rol in ('saha', 'telefon');

update profiles
set rol = 'temsilci',
    yetki_meslek_gruplari = case
      when meslek_grubu_id is not null then array[meslek_grubu_id]
      else yetki_meslek_gruplari
    end
where rol = 'grup_sorumlusu';

-- ---------- yardimci fonksiyonlar ----------

create or replace function is_yonetici()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and rol in ('admin', 'yonetici') and aktif = true
  );
$$ language sql stable security definer set search_path = public;

create or replace function yetkili_meslek_gruplari()
returns uuid[] as $$
  select coalesce(
    (select yetki_meslek_gruplari from profiles where id = auth.uid()),
    '{}'::uuid[]
  );
$$ language sql stable security definer set search_path = public;

create or replace function yetkili_mahalleler()
returns text[] as $$
  select coalesce(
    (select yetki_mahalleler from profiles where id = auth.uid()),
    '{}'::text[]
  );
$$ language sql stable security definer set search_path = public;

-- ---------- profiles politikalari ----------

drop policy "profiles: kendi kaydini gorur" on profiles;
create policy "profiles: kendi kaydini veya yonetici gorur" on profiles
  for select using (id = auth.uid() or is_yonetici());

-- ---------- firmalar politikalari ----------

drop policy "firmalar: admin tum erisim" on firmalar;
drop policy "firmalar: sorumlu gorur" on firmalar;
drop policy "firmalar: sorumlu gunceller" on firmalar;

create policy "firmalar: yonetim tum erisim" on firmalar
  for all using (is_yonetici()) with check (is_yonetici());

create policy "firmalar: temsilci gorur" on firmalar
  for select using (
    ana_sorumlu_id = auth.uid()
    or ikinci_baglanti_id = auth.uid()
    or meslek_grubu_id = any(yetkili_meslek_gruplari())
    or (mahalle is not null and mahalle = any(yetkili_mahalleler()))
    or current_role_is('secim_gunu')
  );

create policy "firmalar: temsilci gunceller" on firmalar
  for update using (
    ana_sorumlu_id = auth.uid()
    or ikinci_baglanti_id = auth.uid()
    or meslek_grubu_id = any(yetkili_meslek_gruplari())
    or (mahalle is not null and mahalle = any(yetkili_mahalleler()))
    or current_role_is('secim_gunu')
  );

-- ---------- gorusmeler politikalari ----------

drop policy "gorusmeler: admin tum erisim" on gorusmeler;
drop policy "gorusmeler: ilgili kullanici gorur" on gorusmeler;
drop policy "gorusmeler: sorumlu ekler" on gorusmeler;

create policy "gorusmeler: yonetim tum erisim" on gorusmeler
  for all using (is_yonetici()) with check (is_yonetici());

create policy "gorusmeler: gorebildigi firmayi okur" on gorusmeler
  for select using (
    gorusen_id = auth.uid()
    or exists (select 1 from firmalar f where f.id = firma_id)
  );

create policy "gorusmeler: gorebildigi firmaya ekler" on gorusmeler
  for insert with check (
    gorusen_id = auth.uid()
    and exists (select 1 from firmalar f where f.id = firma_id)
  );

-- ---------- kisiler politikalari ----------

drop policy "kisiler: admin tum erisim" on kisiler;
drop policy "kisiler: firmayi goren okur" on kisiler;

create policy "kisiler: yonetim tum erisim" on kisiler
  for all using (is_yonetici()) with check (is_yonetici());

create policy "kisiler: gorebildigi firmayi okur" on kisiler
  for select using (
    exists (select 1 from firmalar f where f.id = firma_id)
  );

-- ---------- destek durumu gecmisi ----------

drop policy "destek_gecmisi: admin okur" on destek_durumu_gecmisi;
create policy "destek_gecmisi: yonetim okur" on destek_durumu_gecmisi
  for select using (is_yonetici());
