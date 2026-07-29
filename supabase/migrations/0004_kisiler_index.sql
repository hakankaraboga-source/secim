-- Kisiler modulu (CRM) icin arama indeksleri
-- 0003 calistirildiktan sonra calistirin.

create index kisiler_ad_soyad_idx on kisiler (ad_soyad);
create index kisiler_telefon_idx on kisiler (telefon);
