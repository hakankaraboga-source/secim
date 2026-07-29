-- Yeni roller: yonetici ve temsilci
-- ONEMLI: Bu dosyayi TEK BASINA calistirin, ardindan 0008'i AYRI calistirin
-- (Postgres yeni enum degerlerinin ayni istekte kullanilmasina izin vermez).

alter type user_role add value if not exists 'yonetici';
alter type user_role add value if not exists 'temsilci';
