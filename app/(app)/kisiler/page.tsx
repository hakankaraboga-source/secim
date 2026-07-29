import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { DestekBadge } from "@/components/DestekBadge";
import type { DestekDurumu } from "@/lib/constants";

type KisiSatiri = {
  id: string;
  ad_soyad: string;
  telefon: string | null;
  etiket: string | null;
  firmalar: { id: string; firma_unvani: string; destek_durumu: string } | null;
};

const SAYFA_BOYU = 50;

export default async function KisilerPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sayfa?: string }>;
}) {
  const profile = await requireProfile();
  const { q, sayfa } = await searchParams;
  const supabase = await createClient();

  const sayfaNo = Math.max(1, Number(sayfa) || 1);

  let query = supabase
    .from("kisiler")
    .select("id, ad_soyad, telefon, etiket, firmalar(id, firma_unvani, destek_durumu)", {
      count: "exact",
    })
    .order("ad_soyad")
    .range((sayfaNo - 1) * SAYFA_BOYU, sayfaNo * SAYFA_BOYU - 1);

  if (q) {
    query = query.or(`ad_soyad.ilike.%${q}%,telefon.ilike.%${q}%`);
  }

  const { data, count } = await query;
  const kisiler = data as unknown as KisiSatiri[] | null;
  const toplam = count ?? 0;
  const toplamSayfa = Math.max(1, Math.ceil(toplam / SAYFA_BOYU));

  const sayfaLinki = (n: number) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (n > 1) p.set("sayfa", String(n));
    const s = p.toString();
    return `/kisiler${s ? `?${s}` : ""}`;
  };

  return (
    <div className="flex flex-1 flex-col">
      <Header profile={profile} title="Kişiler" />
      <div className="mx-auto w-full max-w-2xl md:max-w-4xl flex-1 space-y-3 p-4">
        <form method="get" className="flex gap-2 rounded-xl bg-white p-3 shadow-sm">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="İsim veya telefon ara..."
            className="h-11 flex-1 rounded-lg border border-slate-300 px-3 text-sm focus:border-slate-500 focus:outline-none"
          />
          <button type="submit" className="h-11 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white">
            Ara
          </button>
        </form>

        {q && (
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{toplam} kişi bulundu</span>
            <Link href="/kisiler" className="underline">
              Aramayı temizle
            </Link>
          </div>
        )}

        <ul className="space-y-2">
          {(kisiler ?? []).map((k) => (
            <li key={k.id}>
              <Link
                href={`/kisiler/${k.id}`}
                className="block rounded-xl bg-white p-3 shadow-sm active:bg-slate-50 hover:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {k.ad_soyad}
                      {k.etiket && <span className="ml-1.5 text-xs text-slate-400">({k.etiket})</span>}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {k.telefon ?? "Telefon yok"} · {k.firmalar?.firma_unvani ?? "-"}
                    </p>
                  </div>
                  {k.firmalar && <DestekBadge durum={k.firmalar.destek_durumu as DestekDurumu} />}
                </div>
              </Link>
            </li>
          ))}
          {(kisiler ?? []).length === 0 && (
            <li className="rounded-xl bg-white p-4 text-center text-sm text-slate-500 shadow-sm">
              Kişi bulunamadı.
            </li>
          )}
        </ul>

        {toplamSayfa > 1 && (
          <div className="flex items-center justify-between text-sm">
            {sayfaNo > 1 ? (
              <Link href={sayfaLinki(sayfaNo - 1)} className="rounded-lg bg-white px-4 py-2 shadow-sm">
                ← Önceki
              </Link>
            ) : (
              <span />
            )}
            <span className="text-slate-500">
              Sayfa {sayfaNo} / {toplamSayfa} · {toplam} kişi
            </span>
            {sayfaNo < toplamSayfa ? (
              <Link href={sayfaLinki(sayfaNo + 1)} className="rounded-lg bg-white px-4 py-2 shadow-sm">
                Sonraki →
              </Link>
            ) : (
              <span />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
