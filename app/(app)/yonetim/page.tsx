import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { DESTEK_DURUMLARI, type DestekDurumu } from "@/lib/constants";

export default async function YonetimPage() {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);
  const yediGunOnce = new Date();
  yediGunOnce.setDate(yediGunOnce.getDate() - 7);

  const [
    { data: genelOzet },
    { data: meslekGrubuOzet },
    { count: gunlukGorusme },
    { data: gecikenlerData },
    { data: degisimler },
    { data: secimAyarlari },
  ] = await Promise.all([
    supabase.from("genel_ozet").select("*").single(),
    supabase.from("meslek_grubu_ozet").select("*").order("kararsiz", { ascending: false }),
    supabase
      .from("gorusmeler")
      .select("id", { count: "exact", head: true })
      .gte("created_at", `${today}T00:00:00`),
    supabase
      .from("firmalar")
      .select("ana_sorumlu:ana_sorumlu_id(ad_soyad, email)")
      .lt("tekrar_arama_tarihi", today)
      .not("ana_sorumlu_id", "is", null),
    supabase
      .from("destek_durumu_gecmisi")
      .select("yeni_durum")
      .gte("created_at", yediGunOnce.toISOString()),
    supabase.from("secim_ayarlari").select("*").single(),
  ]);

  const gecikenler = gecikenlerData as unknown as Array<{
    ana_sorumlu: { ad_soyad: string | null; email: string } | null;
  }> | null;

  const gecikenSayilari = new Map<string, number>();
  for (const g of gecikenler ?? []) {
    const ad = g.ana_sorumlu?.ad_soyad || g.ana_sorumlu?.email || "Bilinmiyor";
    gecikenSayilari.set(ad, (gecikenSayilari.get(ad) ?? 0) + 1);
  }

  const degisimSayilari = new Map<string, number>();
  for (const d of degisimler ?? []) {
    degisimSayilari.set(d.yeni_durum, (degisimSayilari.get(d.yeni_durum) ?? 0) + 1);
  }

  const gerekenOy = secimAyarlari?.gereken_oy_sayisi ?? 0;
  const ilaveOy = Math.max(0, gerekenOy - (genelOzet?.kesin_destek ?? 0));

  return (
    <div className="flex flex-1 flex-col">
      <Header profile={profile} title="Yönetim Paneli" />
      <div className="mx-auto w-full max-w-2xl md:max-w-4xl flex-1 space-y-4 p-4">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Link href="/yonetim/atamalar" className="rounded-xl bg-white p-3 text-center text-sm font-medium text-slate-700 shadow-sm">
            🎯 Atamalar
          </Link>
          <Link href="/yonetim/kullanicilar" className="rounded-xl bg-white p-3 text-center text-sm font-medium text-slate-700 shadow-sm">
            👤 Kullanıcılar
          </Link>
          <Link href="/yonetim/ayarlar" className="rounded-xl bg-white p-3 text-center text-sm font-medium text-slate-700 shadow-sm">
            ⚙️ Seçim Ayarları
          </Link>
          <Link href="/veri" className="rounded-xl bg-white p-3 text-center text-sm font-medium text-slate-700 shadow-sm">
            📄 Excel
          </Link>
        </div>

        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Genel Destek Oranı</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Stat label="Toplam firma" value={genelOzet?.toplam_firma ?? 0} />
            <Stat label="Oy kullanabilecek" value={genelOzet?.oy_kullanabilecek ?? 0} />
            <Stat label="🟢 Kesin destek" value={genelOzet?.kesin_destek ?? 0} />
            <Stat label="🟡 Kararsız" value={genelOzet?.kararsiz ?? 0} />
            <Stat label="🔴 Rakip" value={genelOzet?.rakip ?? 0} />
            <Stat label="🔵 Görüşülmedi" value={genelOzet?.gorusulmedi ?? 0} />
          </div>
        </section>

        <section className="rounded-xl bg-slate-900 p-4 text-white shadow-sm">
          <p className="text-xs text-slate-300">Kazanmak için gerekli ilave oy</p>
          <p className="text-3xl font-semibold">{ilaveOy}</p>
          <p className="mt-1 text-xs text-slate-400">
            Gereken oy: {gerekenOy} · Mevcut kesin destek: {genelOzet?.kesin_destek ?? 0}
            {" · "}
            <Link href="/yonetim/ayarlar" className="underline">
              hedefi düzenle
            </Link>
          </p>
        </section>

        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Bugün Yapılan Görüşme</h3>
          <p className="text-2xl font-semibold text-slate-900">{gunlukGorusme ?? 0}</p>
        </section>

        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">En Çok Kararsız Bulunan Gruplar</h3>
          <ul className="space-y-1 text-sm">
            {(meslekGrubuOzet ?? []).slice(0, 5).map((g) => (
              <li key={g.meslek_grubu_id} className="flex justify-between">
                <span className="text-slate-700">{g.ad}</span>
                <span className="font-medium text-amber-700">{g.kararsiz}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Görevini Tamamlamayan Ekip Üyeleri</h3>
          {gecikenSayilari.size === 0 ? (
            <p className="text-sm text-slate-500">Gecikmiş görev yok.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {[...gecikenSayilari.entries()].map(([ad, sayi]) => (
                <li key={ad} className="flex justify-between">
                  <span className="text-slate-700">{ad}</span>
                  <span className="font-medium text-red-600">{sayi} gecikmiş görev</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Son 7 Gündeki Destek Değişimi</h3>
          {degisimSayilari.size === 0 ? (
            <p className="text-sm text-slate-500">Son 7 günde değişiklik yok.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {[...degisimSayilari.entries()].map(([durum, sayi]) => (
                <li key={durum} className="flex justify-between">
                  <span className="text-slate-700">
                    {DESTEK_DURUMLARI[durum as DestekDurumu]?.dot} {DESTEK_DURUMLARI[durum as DestekDurumu]?.label}
                  </span>
                  <span className="font-medium text-slate-900">+{sayi}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-50 p-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}
