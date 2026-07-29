-- Genel Takip genisletmesi: mahalle, referans alanlari ve firma kisi kayitlari
-- 0001 ve 0002 calistirildiktan sonra calistirin.

-- ---------- firmalar: mahalle (Gruplandirma 1) ve referans ----------

alter table firmalar add column mahalle text;
alter table firmalar add column referans text;

create index firmalar_mahalle_idx on firmalar (mahalle);
create index firmalar_referans_idx on firmalar (referans);

-- ---------- kisiler: firmaya bagli kisi kayitlari ----------

create table kisiler (
  id uuid primary key default gen_random_uuid(),
  firma_id uuid not null references firmalar(id) on delete cascade,
  ad_soyad text not null,
  telefon text,
  etiket text, -- 'yetkili', 'ilgili kisi' vb.
  created_at timestamptz not null default now()
);

create index kisiler_firma_idx on kisiler (firma_id);

alter table kisiler enable row level security;

create policy "kisiler: admin tum erisim" on kisiler
  for all using (is_admin()) with check (is_admin());

create policy "kisiler: firmayi goren okur" on kisiler
  for select using (
    exists (
      select 1 from firmalar f
      where f.id = firma_id
        and (
          f.ana_sorumlu_id = auth.uid()
          or f.ikinci_baglanti_id = auth.uid()
          or (current_role_is('grup_sorumlusu') and f.meslek_grubu_id = current_meslek_grubu_id())
          or current_role_is('secim_gunu')
        )
    )
  );
