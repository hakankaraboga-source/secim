-- Raporlama gorunumleri ve destek durumu degisiklik gecmisi
-- 0001_init.sql calistirildiktan sonra calistirin.

-- ---------- destek durumu degisiklik gecmisi (7 gunluk trend icin) ----------

create table destek_durumu_gecmisi (
  id uuid primary key default gen_random_uuid(),
  firma_id uuid not null references firmalar(id) on delete cascade,
  eski_durum destek_durumu,
  yeni_durum destek_durumu not null,
  degistiren_id uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index destek_durumu_gecmisi_created_idx on destek_durumu_gecmisi (created_at desc);

alter table destek_durumu_gecmisi enable row level security;

create policy "destek_gecmisi: admin okur" on destek_durumu_gecmisi
  for select using (is_admin());

create or replace function log_destek_durumu_degisikligi()
returns trigger as $$
begin
  if (tg_op = 'UPDATE' and old.destek_durumu is distinct from new.destek_durumu) then
    insert into destek_durumu_gecmisi (firma_id, eski_durum, yeni_durum, degistiren_id)
    values (new.id, old.destek_durumu, new.destek_durumu, auth.uid());
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger firmalar_destek_durumu_log
after update on firmalar
for each row execute function log_destek_durumu_degisikligi();

-- ---------- secim ayarlari (kazanmak icin gereken oy sayisi) ----------

create table secim_ayarlari (
  id int primary key default 1,
  gereken_oy_sayisi int not null default 0,
  constraint tek_satir check (id = 1)
);

insert into secim_ayarlari (id, gereken_oy_sayisi) values (1, 0);

alter table secim_ayarlari enable row level security;

create policy "secim_ayarlari: herkes okur" on secim_ayarlari
  for select using (auth.uid() is not null);

create policy "secim_ayarlari: admin gunceller" on secim_ayarlari
  for update using (is_admin());

-- ---------- meslek grubu ozet gorunumu ----------

create view meslek_grubu_ozet
with (security_invoker = true) as
select
  mg.id as meslek_grubu_id,
  mg.ad,
  mg.sira,
  mg.hedef_meclis_uyesi,
  count(f.id) as toplam_uye,
  count(f.id) filter (where f.destek_durumu <> 'oy_kullanamaz') as oy_kullanabilecek,
  count(f.id) filter (where f.destek_durumu = 'kesin_destek') as kesin_destek,
  count(f.id) filter (where f.destek_durumu = 'kararsiz') as kararsiz,
  count(f.id) filter (where f.destek_durumu = 'rakip') as rakip,
  count(f.id) filter (where f.destek_durumu = 'gorusulmedi') as gorusulmedi,
  count(f.id) filter (where f.destek_durumu = 'oy_kullanamaz') as oy_kullanamaz
from meslek_gruplari mg
left join firmalar f on f.meslek_grubu_id = mg.id
group by mg.id, mg.ad, mg.sira, mg.hedef_meclis_uyesi
order by mg.sira;

-- ---------- genel ozet gorunumu (admin paneli) ----------

create view genel_ozet
with (security_invoker = true) as
select
  count(*) as toplam_firma,
  count(*) filter (where destek_durumu <> 'oy_kullanamaz') as oy_kullanabilecek,
  count(*) filter (where destek_durumu = 'kesin_destek') as kesin_destek,
  count(*) filter (where destek_durumu = 'kararsiz') as kararsiz,
  count(*) filter (where destek_durumu = 'rakip') as rakip,
  count(*) filter (where destek_durumu = 'gorusulmedi') as gorusulmedi,
  count(*) filter (where destek_durumu = 'oy_kullanamaz') as oy_kullanamaz
from firmalar;

-- ---------- secim gunu ozet gorunumu ----------

create view secim_gunu_ozet
with (security_invoker = true) as
select
  count(*) filter (where secim_gunu_durumu = 'bekleniyor') as bekleniyor,
  count(*) filter (where secim_gunu_durumu = 'yolda') as yolda,
  count(*) filter (where secim_gunu_durumu = 'oy_kullandi') as oy_kullandi,
  count(*) filter (where secim_gunu_durumu = 'ulasilamiyor') as ulasilamiyor,
  count(*) filter (where secim_gunu_durumu = 'arac_gonderilecek') as arac_gonderilecek,
  count(*) filter (where secim_gunu_durumu = 'yetki_sorunu') as yetki_sorunu,
  count(*) filter (where destek_durumu = 'kesin_destek' and secim_gunu_durumu = 'bekleniyor') as kesin_destek_oy_kullanmadi
from firmalar
where destek_durumu <> 'oy_kullanamaz';
