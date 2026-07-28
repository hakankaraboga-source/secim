import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { DestekBadge } from "@/components/DestekBadge";
import { DESTEK_DURUMLARI, type DestekDurumu } from "@/lib/constants";

export default async function FirmalarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; durum?: string; grup?: string }>;
}) {
  const profile = await requireProfile();
  const { q, durum, grup } = await searchParams;
  const supabase = await createClient();

  const { data: meslekGruplari } = await supabase
    .from("meslek_gruplari")
    .select("id, ad")
    .order("sira");

  let query = supabase
    .from("firmalar")
    .select("id, firma_unvani, yetkili_kisi, yetkili_telefon, destek_durumu, meslek_gruplari(ad)")
    .order("firma_unvani")
    .limit(100);

  if (q) {
    query = query.ilike("firma_unvani", `%${q}%`);
  }
  if (durum) {
    query = query.eq("destek_durumu", durum);
  }
  if (grup) {
    query = query.eq("meslek_grubu_id", grup);
  }

  const { data } = await query;
  const firmalar = data as unknown as Array<{
    id: string;
    firma_unvani: string;
    yetkili_kisi: string | null;
    yetkili_telefon: string | null;
    destek_durumu: string;
    meslek_gruplari: { ad: string } | null;
  }> | null;

  return (
    <div className="flex flex-1 flex-col">
      <Header profile={profile} title="Firmalar" />
      <div className="mx-auto w-full max-w-2xl flex-1 space-y-3 p-4">
        <form method="get" className="space-y-2 rounded-xl bg-white p-3 shadow-sm">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Firma unvanı ara..."
            className="h-12 w-full rounded-lg border border-slate-300 px-3 text-base focus:border-slate-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <select
              name="durum"
              defaultValue={durum ?? ""}
              className="h-11 flex-1 rounded-lg border border-slate-300 px-2 text-sm"
            >
              <option value="">Tüm durumlar</option>
              {Object.entries(DESTEK_DURUMLARI).map(([key, info]) => (
                <option key={key} value={key}>
                  {info.dot} {info.label}
                </option>
              ))}
            </select>
            <select
              name="grup"
              defaultValue={grup ?? ""}
              className="h-11 flex-1 rounded-lg border border-slate-300 px-2 text-sm"
            >
              <option value="">Tüm gruplar</option>
              {meslekGruplari?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.ad}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="h-11 w-full rounded-lg bg-slate-900 text-sm font-medium text-white">
            Filtrele
          </button>
        </form>

        {profile.rol === "admin" && (
          <Link
            href="/firmalar/yeni"
            className="block rounded-xl border-2 border-dashed border-slate-300 p-3 text-center text-sm font-medium text-slate-600"
          >
            + Yeni firma ekle
          </Link>
        )}

        <ul className="space-y-2">
          {(firmalar ?? []).map((f) => (
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
                  {f.meslek_gruplari?.ad ? ` · ${f.meslek_gruplari.ad}` : ""}
                </p>
              </Link>
            </li>
          ))}
          {(firmalar ?? []).length === 0 && (
            <li className="rounded-xl bg-white p-4 text-center text-sm text-slate-500 shadow-sm">
              Sonuç bulunamadı.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
