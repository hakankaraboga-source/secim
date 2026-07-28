import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getBekleyenGorevler, getGunlukGorusmeSayisi } from "@/lib/queries";
import { DestekBadge } from "@/components/DestekBadge";
import { Header } from "@/components/Header";
import type { DestekDurumu } from "@/lib/constants";

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

  const [bekleyenler, gunlukGorusme] = await Promise.all([
    getBekleyenGorevler(supabase, 8),
    getGunlukGorusmeSayisi(supabase),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <Header profile={profile} title="Ana Sayfa" />
      <div className="mx-auto w-full max-w-2xl flex-1 space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Bugün yapılan görüşme</p>
            <p className="text-2xl font-semibold text-slate-900">{gunlukGorusme}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Bekleyen arama/ziyaret</p>
            <p className="text-2xl font-semibold text-slate-900">{bekleyenler.length}</p>
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-slate-700">
            Tekrar aranması gereken firmalar
          </h2>
          {bekleyenler.length === 0 ? (
            <p className="rounded-xl bg-white p-4 text-sm text-slate-500 shadow-sm">
              Bekleyen görev yok.
            </p>
          ) : (
            <ul className="space-y-2">
              {bekleyenler.map((f) => (
                <li key={f.id}>
                  <Link
                    href={`/firmalar/${f.id}`}
                    className="block rounded-xl bg-white p-3 shadow-sm active:bg-slate-50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-slate-900">{f.firma_unvani}</p>
                      <DestekBadge durum={f.destek_durumu as DestekDurumu} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {f.yetkili_kisi ?? "-"} · {f.yetkili_telefon ?? "-"}
                    </p>
                    {f.bekleyen_gorev && (
                      <p className="mt-1 text-xs text-amber-700">📌 {f.bekleyen_gorev}</p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
