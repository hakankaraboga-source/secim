import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getBekleyenGorevler, getGunlukGorusmeSayisi } from "@/lib/queries";
import { DestekBadge } from "@/components/DestekBadge";
import { Header } from "@/components/Header";
import { CihazBanner } from "@/components/CihazBanner";
import { DESTEK_DURUMLARI, type DestekDurumu } from "@/lib/constants";
import type { GenelOzetRow } from "@/lib/database.types";

type SonGorusme = {
  id: string;
  tip: string;
  sonuc: string | null;
  created_at: string;
  firmalar: { firma_unvani: string } | null;
  gorusen: { ad_soyad: string | null; email: string } | null;
};

export default async function AnaSayfa() {
  const profile = await requireProfile();
  const supabase = await createClient();

  if (profile.rol === "secim_gunu") {
    return (
      <div className="flex flex-1 flex-col">
        <Header profile={profile} title="Ana Sayfa" />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-2xl">🗳️</p>
          <p className="text-slate-600">Seçim günü modu için aşağıdaki butona dokunun.</p>
          <Link
            href="/secim-gunu"
            className="rounded-xl bg-slate-900 px-6 py-4 text-base font-medium text-white"
          >
            Seçim Günü Ekranını Aç
          </Link>
        </div>
      </div>
    );
  }

  const [
    { data: genelOzetData },
    { data: secimAyarlari },
    gunlukGorusme,
    bekleyenler,
    { data: sonGorusmelerData },
  ] = await Promise.all([
    supabase.from("genel_ozet").select("*").single(),
    supabase.from("secim_ayarlari").select("*").single(),
    getGunlukGorusmeSayisi(supabase),
    getBekleyenGorevler(supabase, 6),
    supabase
      .from("gorusmeler")
      .select("id, tip, sonuc, created_at, firmalar(firma_unvani), gorusen:gorusen_id(ad_soyad, email)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const ozet = (genelOzetData ?? null) as GenelOzetRow | null;
  const sonGorusmeler = (sonGorusmelerData ?? []) as unknown as SonGorusme[];

  const gerekenOy = secimAyarlari?.gereken_oy_sayisi ?? 0;
  const kesinDestek = ozet?.kesin_destek ?? 0;
  const ilaveOy = Math.max(0, gerekenOy - kesinDestek);
  const ilerlemeYuzde = gerekenOy > 0 ? Math.min(100, Math.round((kesinDestek / gerekenOy) * 100)) : 0;

  const toplamFirma = ozet?.toplam_firma ?? 0;
  const dagilim = (
    [
      ["kesin_destek", ozet?.kesin_destek ?? 0],
      ["kararsiz", ozet?.kararsiz ?? 0],
      ["rakip", ozet?.rakip ?? 0],
      ["gorusulmedi", ozet?.gorusulmedi ?? 0],
      ["oy_kullanamaz", ozet?.oy_kullanamaz ?? 0],
    ] as [DestekDurumu, number][]
  ).filter(([, sayi]) => sayi > 0);

  const bugun = new Date().toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  });

  return (
    <div className="flex flex-1 flex-col">
      <Header profile={profile} title="Ana Sayfa" />
      <div className="mx-auto w-full max-w-2xl md:max-w-4xl flex-1 space-y-4 p-4">
        <CihazBanner />

        {/* Karsilama */}
        <div>
          <p className="text-lg font-semibold text-slate-900">
            Merhaba{profile.ad_soyad ? `, ${profile.ad_soyad.split(" ")[0]}` : ""} 👋
          </p>
          <p className="text-sm text-slate-500">{bugun} · Başkan Adayımız: Ferdi Kurt</p>
        </div>

        {/* Hedefe ilerleme */}
        <section className="rounded-2xl bg-slate-900 p-5 text-white shadow-sm">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Kesin Destek</p>
              <p className="text-4xl font-bold">{kesinDestek}</p>
            </div>
            {gerekenOy > 0 ? (
              <div className="text-right">
                <p className="text-xs text-slate-400">Hedef: {gerekenOy} oy</p>
                <p className="text-lg font-semibold text-emerald-400">%{ilerlemeYuzde}</p>
              </div>
            ) : (
              profile.rol === "admin" && (
                <Link href="/yonetim/ayarlar" className="text-xs text-slate-300 underline">
                  Oy hedefini belirleyin →
                </Link>
              )
            )}
          </div>
          {gerekenOy > 0 && (
            <>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-700">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all"
                  style={{ width: `${ilerlemeYuzde}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-slate-300">
                Kazanmak için <strong className="text-white">{ilaveOy}</strong> oy daha gerekiyor.
              </p>
            </>
          )}
        </section>

        {/* Destek dagilimi */}
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Destek Dağılımı</h2>
            <span className="text-xs text-slate-400">{toplamFirma} firma</span>
          </div>
          {toplamFirma === 0 ? (
            <p className="text-sm text-slate-500">
              Henüz firma verisi yok.{" "}
              {profile.rol === "admin" && (
                <Link href="/veri" className="underline">
                  Excel ile yükleyin →
                </Link>
              )}
            </p>
          ) : (
            <>
              <div className="flex h-4 overflow-hidden rounded-full">
                {dagilim.map(([durum, sayi]) => (
                  <div
                    key={durum}
                    style={{
                      width: `${(sayi / toplamFirma) * 100}%`,
                      backgroundColor: DESTEK_DURUMLARI[durum].color,
                    }}
                    title={`${DESTEK_DURUMLARI[durum].label}: ${sayi}`}
                  />
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 md:grid-cols-5">
                {dagilim.map(([durum, sayi]) => (
                  <Link
                    key={durum}
                    href={`/firmalar?durum=${durum}`}
                    className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900"
                  >
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: DESTEK_DURUMLARI[durum].color }}
                    />
                    {DESTEK_DURUMLARI[durum].label}
                    <strong className="ml-auto text-slate-900">{sayi}</strong>
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Gunluk sayilar */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatKart etiket="Bugünkü görüşme" deger={gunlukGorusme} ikon="📞" />
          <StatKart etiket="Bekleyen arama" deger={bekleyenler.length} ikon="⏰" vurgu={bekleyenler.length > 0} />
          <StatKart etiket="Kararsız firma" deger={ozet?.kararsiz ?? 0} ikon="🟡" href="/firmalar?durum=kararsiz" />
          <StatKart etiket="Görüşülmedi" deger={ozet?.gorusulmedi ?? 0} ikon="🔵" href="/firmalar?durum=gorusulmedi" />
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Bekleyen gorevler */}
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">Tekrar Aranacak Firmalar</h2>
              <Link href="/gorevler" className="text-xs text-slate-400 hover:text-slate-600">
                Tümü →
              </Link>
            </div>
            {bekleyenler.length === 0 ? (
              <p className="text-sm text-slate-500">Bekleyen arama yok. 🎉</p>
            ) : (
              <ul className="space-y-2">
                {bekleyenler.map((f) => (
                  <li key={f.id}>
                    <Link
                      href={`/firmalar/${f.id}`}
                      className="block rounded-xl border border-slate-100 p-2.5 hover:bg-slate-50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-slate-900">{f.firma_unvani}</p>
                        <DestekBadge durum={f.destek_durumu as DestekDurumu} />
                      </div>
                      {f.bekleyen_gorev && (
                        <p className="mt-0.5 truncate text-xs text-amber-700">📌 {f.bekleyen_gorev}</p>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Son gorusmeler */}
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold text-slate-700">Son Görüşmeler</h2>
            {sonGorusmeler.length === 0 ? (
              <p className="text-sm text-slate-500">Henüz görüşme kaydı yok.</p>
            ) : (
              <ul className="space-y-2">
                {sonGorusmeler.map((g) => (
                  <li key={g.id} className="rounded-xl border border-slate-100 p-2.5">
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                      <span>
                        {g.tip === "telefon" ? "📞" : "🤝"}{" "}
                        {g.gorusen?.ad_soyad || g.gorusen?.email || "-"}
                      </span>
                      <span>
                        {new Date(g.created_at).toLocaleDateString("tr-TR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <p className="truncate text-sm font-medium text-slate-900">
                      {g.firmalar?.firma_unvani ?? "-"}
                    </p>
                    {g.sonuc && <p className="truncate text-xs text-slate-500">{g.sonuc}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Hizli erisim */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <HizliLink href="/firmalar" ikon="🏢" etiket="Firmalar" />
          <HizliLink href="/gorevler" ikon="✅" etiket="Görevler" />
          {(profile.rol === "admin" || profile.rol === "grup_sorumlusu") && (
            <HizliLink href="/raporlar" ikon="📊" etiket="Raporlar" />
          )}
          {profile.rol === "admin" && <HizliLink href="/yonetim" ikon="⚙️" etiket="Yönetim" />}
        </section>
      </div>
    </div>
  );
}

function StatKart({
  etiket,
  deger,
  ikon,
  vurgu,
  href,
}: {
  etiket: string;
  deger: number;
  ikon: string;
  vurgu?: boolean;
  href?: string;
}) {
  const icerik = (
    <div
      className={`rounded-2xl p-3.5 shadow-sm ${
        vurgu ? "bg-amber-50" : "bg-white"
      } ${href ? "hover:bg-slate-50" : ""}`}
    >
      <p className="text-xs text-slate-500">
        {ikon} {etiket}
      </p>
      <p className={`text-2xl font-bold ${vurgu ? "text-amber-700" : "text-slate-900"}`}>{deger}</p>
    </div>
  );
  return href ? <Link href={href}>{icerik}</Link> : icerik;
}

function HizliLink({ href, ikon, etiket }: { href: string; ikon: string; etiket: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-center gap-2 rounded-2xl bg-white p-3.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
    >
      <span className="text-lg">{ikon}</span>
      {etiket}
    </Link>
  );
}
