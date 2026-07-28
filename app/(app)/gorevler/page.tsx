import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { DestekBadge } from "@/components/DestekBadge";
import type { DestekDurumu } from "@/lib/constants";

export default async function GorevlerPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);

  let query = supabase
    .from("firmalar")
    .select(
      "id, firma_unvani, yetkili_kisi, yetkili_telefon, destek_durumu, bekleyen_gorev, tekrar_arama_tarihi, ana_sorumlu:ana_sorumlu_id(ad_soyad, email)"
    )
    .or(`bekleyen_gorev.not.is.null,tekrar_arama_tarihi.lte.${today}`)
    .order("tekrar_arama_tarihi", { ascending: true, nullsFirst: false });

  if (profile.rol !== "admin") {
    query = query.or(`ana_sorumlu_id.eq.${profile.id},ikinci_baglanti_id.eq.${profile.id}`);
  }

  const { data } = await query;
  const gorevler = data as unknown as Array<{
    id: string;
    firma_unvani: string;
    yetkili_kisi: string | null;
    yetkili_telefon: string | null;
    destek_durumu: string;
    bekleyen_gorev: string | null;
    tekrar_arama_tarihi: string | null;
    ana_sorumlu: { ad_soyad: string | null; email: string } | null;
  }> | null;

  return (
    <div className="flex flex-1 flex-col">
      <Header profile={profile} title="Görevler" />
      <div className="mx-auto w-full max-w-2xl flex-1 space-y-2 p-4">
        {(gorevler ?? []).length === 0 ? (
          <p className="rounded-xl bg-white p-4 text-center text-sm text-slate-500 shadow-sm">
            Bekleyen görev yok.
          </p>
        ) : (
          (gorevler ?? []).map((f) => {
            const gecikti = f.tekrar_arama_tarihi && f.tekrar_arama_tarihi < today;
            return (
              <Link
                key={f.id}
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
                {profile.rol === "admin" && (
                  <p className="text-xs text-slate-400">
                    Sorumlu: {f.ana_sorumlu?.ad_soyad || f.ana_sorumlu?.email || "Atanmamış"}
                  </p>
                )}
                {f.bekleyen_gorev && <p className="mt-1 text-xs text-amber-700">📌 {f.bekleyen_gorev}</p>}
                {f.tekrar_arama_tarihi && (
                  <p className={`text-xs ${gecikti ? "font-semibold text-red-600" : "text-slate-400"}`}>
                    Tekrar arama: {f.tekrar_arama_tarihi} {gecikti && "(gecikti)"}
                  </p>
                )}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
