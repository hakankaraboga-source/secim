-- Yonetici panosu gorunumleri: aksiyon ozeti ve ekip takip ozeti
-- 0004 calistirildiktan sonra calistirin.

create view aksiyon_ozet
with (security_invoker = true) as
select
  count(*) filter (where ana_sorumlu_id is null and destek_durumu <> 'oy_kullanamaz') as sorumsuz,
  count(*) filter (where tekrar_arama_tarihi < current_date) as geciken,
  count(*) filter (where bekleyen_gorev is not null) as bekleyen_gorev,
  count(*) filter (where destek_durumu = 'kararsiz') as kararsiz,
  count(*) filter (where destek_durumu = 'gorusulmedi') as gorusulmedi
from firmalar;

create view ekip_ozet
with (security_invoker = true) as
select
  p.id,
  p.ad_soyad,
  p.email,
  p.rol,
  count(f.id) as atanan_firma,
  count(f.id) filter (where f.destek_durumu = 'kesin_destek') as kesin_destek,
  count(f.id) filter (where f.destek_durumu = 'gorusulmedi') as gorusulmedi,
  count(f.id) filter (where f.tekrar_arama_tarihi < current_date) as geciken,
  count(f.id) filter (where f.bekleyen_gorev is not null) as bekleyen_gorev,
  (
    select count(*)
    from gorusmeler g
    where g.gorusen_id = p.id
      and g.created_at > now() - interval '7 days'
  ) as son7g_gorusme
from profiles p
left join firmalar f on f.ana_sorumlu_id = p.id
where p.aktif = true
group by p.id, p.ad_soyad, p.email, p.rol;
