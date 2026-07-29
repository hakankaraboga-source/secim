import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { DestekBadge } from "@/components/DestekBadge";
import { DESTEK_DURUMLARI, type DestekDurumu } from "@/lib/constants";

type TakipSatiri = {
  id: string;
  firma_unvani: string;
  yetkili_kisi: string | null;
  yetkili_telefon: string | null;
  oda_sicil_no: string | null;
  destek_durumu: string;
  referans: string | null;
  mahalle: string | null;
  meslek_gruplari: { ad: string } | null;
};

const SAYFA_BOYU = 50;

export default async function GenelTakipPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    durum?: string;
    grup?: string;
    referans?: string;
    mahalle?: string;
    sayfa?: string;
  }>;
}) {
  const profile = await requireProfile();
  const { q, durum, grup, referans, mahalle, sayfa } = await searchParams;
  const supabase = await createClient();

  const sayfaNo = Math.max(1, Number(sayfa) || 1);

  const { data: meslekGruplari } = await supabase
    .from("meslek_gruplari")
    .select("id, ad")
    .order("sira");

  let query = supabase
    .from("firmalar")
    .select(
      "id, firma_unvani, yetkili_kisi, yetkili_telefon, oda_sicil_no, destek_durumu, referans, mahalle, meslek_gruplari(ad)",
      { count: "exact" }
    )
    .order("firma_unvani")
    .range((sayfaNo - 1) * SAYFA_BOYU, sayfaNo * SAYFA_BOYU - 1);

  if (q) {
    // unvan, yetkili veya sicil no uzerinde arama
    query = query.or(
      `firma_unvani.ilike.%${q}%,yetkili_kisi.ilike.%${q}%,oda_sicil_no.ilike.%${q}%`
    );
  }
  if (durum) query = query.eq("destek_durumu", durum);
  if (grup) query = query.eq("meslek_grubu_id", grup);
  if (referans) query = query.ilike("referans", `%${referans}%`);
  if (mahalle) query = query.ilike("mahalle", `%${mahalle}%`);

  const { data, count } = await query;
  const firmalar = data as unknown as TakipSatiri[] | null;
  const toplam = count ?? 0;
  const toplamSayfa = Math.max(1, Math.ceil(toplam / SAYFA_BOYU));

  const filtreParams = new URLSearchParams();
  if (q) filtreParams.set("q", q);
  if (durum) filtreParams.set("durum", durum);
  if (grup) filtreParams.set("grup", grup);
  if (referans) filtreParams.set("referans", referans);
  if (mahalle) filtreParams.set("mahalle", mahalle);

  const sayfaLinki = (n: number) => {
    const p = new URLSearchParams(filtreParams);
    if (n > 1) p.set("sayfa", String(n));
    const s = p.toString();
    return `/firmalar${s ? `?${s}` : ""}`;
  };

  return (
    <div className="flex flex-1 flex-col">
      <Header profile={profile} title="Firmalar — Genel Takip" />
      <div className="mx-auto w-full max-w-2xl md:max-w-6xl flex-1 space-y-3 p-4">
        {/* Filtreler */}
        <form method="get" className="space-y-2 rounded-xl bg-white p-3 shadow-sm">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Firma, yetkili veya sicil no ara..."
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-slate-500 focus:outline-none md:col-span-3"
            />
            <select
              name="durum"
              defaultValue={durum ?? ""}
              className="h-11 rounded-lg border border-slate-300 px-2 text-sm"
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
              className="h-11 rounded-lg border border-slate-300 px-2 text-sm"
            >
              <option value="">Tüm meslek grupları</option>
              {meslekGruplari?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.ad}
                </option>
              ))}
            </select>
            <input
              type="text"
              name="referans"
              defaultValue={referans}
              placeholder="Referans"
              className="h-11 rounded-lg border border-slate-300 px-3 text-sm"
            />
            <input
              type="text"
              name="mahalle"
              defaultValue={mahalle}
              placeholder="Mahalle"
              className="h-11 rounded-lg border border-slate-300 px-3 text-sm md:col-span-2"
            />
            <button
              type="submit"
              className="h-11 rounded-lg bg-slate-900 text-sm font-medium text-white"
            >
              Filtrele
            </button>
          </div>
          {(q || durum || grup || referans || mahalle) && (
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                {toplam} sonuç bulundu
              </span>
              <Link href="/firmalar" className="underline">
                Filtreleri temizle
              </Link>
            </div>
          )}
        </form>

        {profile.rol === "admin" && (
          <Link
            href="/firmalar/yeni"
            className="block rounded-xl border-2 border-dashed border-slate-300 p-3 text-center text-sm font-medium text-slate-600"
          >
            + Yeni firma ekle
          </Link>
        )}

        {/* Masaustu: tablo */}
        <div className="hidden overflow-x-auto rounded-xl bg-white shadow-sm md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-3 py-2.5">Firma</th>
                <th className="px-3 py-2.5">Yetkili</th>
                <th className="px-3 py-2.5">Sicil No</th>
                <th className="px-3 py-2.5">Grup</th>
                <th className="px-3 py-2.5">Durum</th>
                <th className="px-3 py-2.5">Referans</th>
              </tr>
            </thead>
            <tbody>
              {(firmalar ?? []).map((f) => (
                <tr key={f.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td className="max-w-xs px-3 py-2.5">
                    <Link href={`/firmalar/${f.id}`} className="block truncate font-medium text-slate-900 hover:underline">
                      {f.firma_unvani}
                    </Link>
                    {f.mahalle && <span className="text-xs text-slate-400">📍 {f.mahalle}</span>}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">
                    <p>{f.yetkili_kisi ?? "-"}</p>
                    <p className="text-xs text-slate-400">{f.yetkili_telefon ?? ""}</p>
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">{f.oda_sicil_no ?? "-"}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">
                    {f.meslek_gruplari?.ad ?? "-"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <DestekBadge durum={f.destek_durumu as DestekDurumu} />
                  </td>
                  <td className="max-w-[10rem] truncate px-3 py-2.5 text-slate-600">
                    {f.referans ?? "-"}
                  </td>
                </tr>
              ))}
              {(firmalar ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                    Sonuç bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobil: kartlar */}
        <ul className="space-y-2 md:hidden">
          {(firmalar ?? []).map((f) => (
            <li key={f.id}>
              <Link
                href={`/firmalar/${f.id}`}
                className="block rounded-xl bg-white p-3 shadow-sm active:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-medium text-slate-900">{f.firma_unvani}</p>
                  <DestekBadge durum={f.destek_durumu as DestekDurumu} />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {f.yetkili_kisi ?? "-"} · {f.yetkili_telefon ?? "-"}
                </p>
                <p className="text-xs text-slate-400">
                  {[f.meslek_gruplari?.ad, f.oda_sicil_no && `Sicil: ${f.oda_sicil_no}`, f.mahalle]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {f.referans && <p className="text-xs text-slate-400">👤 Ref: {f.referans}</p>}
              </Link>
            </li>
          ))}
          {(firmalar ?? []).length === 0 && (
            <li className="rounded-xl bg-white p-4 text-center text-sm text-slate-500 shadow-sm">
              Sonuç bulunamadı.
            </li>
          )}
        </ul>

        {/* Sayfalama */}
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
              Sayfa {sayfaNo} / {toplamSayfa} · {toplam} firma
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
