import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { SecimGunuDurumForm } from "@/components/SecimGunuDurumForm";
import type { SecimGunuDurumu } from "@/lib/constants";
import { secimGunuDurumuGuncelle } from "./actions";

export default async function SecimGunuPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; oncelik?: string }>;
}) {
  const profile = await requireProfile();
  const { q, oncelik } = await searchParams;
  const supabase = await createClient();

  const { data: ozet } = await supabase.from("secim_gunu_ozet").select("*").single();

  let query = supabase
    .from("firmalar")
    .select("id, firma_unvani, yetkili_kisi, oy_kullanacak_kisi, sandik_grup_bilgisi, destek_durumu, secim_gunu_durumu")
    .neq("destek_durumu", "oy_kullanamaz")
    .order("firma_unvani")
    .limit(150);

  if (q) query = query.ilike("firma_unvani", `%${q}%`);
  if (oncelik === "1") {
    query = query.eq("destek_durumu", "kesin_destek").eq("secim_gunu_durumu", "bekleniyor");
  }

  const { data: firmalar } = await query;

  return (
    <div className="flex flex-1 flex-col">
      <Header profile={profile} title="Seçim Günü Modu" />
      <div className="mx-auto w-full max-w-2xl flex-1 space-y-3 p-4">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <StatBox label="Oy Kullandı" value={ozet?.oy_kullandi ?? 0} color="#16a34a" />
          <StatBox label="Yolda" value={ozet?.yolda ?? 0} color="#2563eb" />
          <StatBox label="Henüz Gelmedi" value={ozet?.bekleniyor ?? 0} color="#6b7280" />
        </div>

        <Link
          href="/secim-gunu?oncelik=1"
          className="block rounded-xl bg-red-50 p-4 text-center shadow-sm"
        >
          <p className="text-sm text-red-700">
            Kesin destek verdiği halde henüz oy kullanmayan
          </p>
          <p className="text-3xl font-bold text-red-700">{ozet?.kesin_destek_oy_kullanmadi ?? 0}</p>
          <p className="text-xs text-red-500">kişi — dokunarak listeyi gör</p>
        </Link>

        <form method="get" className="rounded-xl bg-white p-3 shadow-sm">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Firma ara..."
            className="h-11 w-full rounded-lg border border-slate-300 px-3 text-base"
          />
        </form>

        {oncelik === "1" && (
          <Link href="/secim-gunu" className="text-sm text-slate-500">
            ← Filtreyi kaldır
          </Link>
        )}

        <ul className="space-y-2">
          {(firmalar ?? []).map((f) => {
            const action = secimGunuDurumuGuncelle.bind(null, f.id);
            return (
              <li key={f.id} className="rounded-xl bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">{f.firma_unvani}</p>
                    <p className="text-xs text-slate-500">
                      {f.oy_kullanacak_kisi || f.yetkili_kisi || "-"}
                      {f.sandik_grup_bilgisi ? ` · Sandık: ${f.sandik_grup_bilgisi}` : ""}
                    </p>
                  </div>
                  <SecimGunuDurumForm action={action} mevcutDurum={f.secim_gunu_durumu as SecimGunuDurumu} />
                </div>
              </li>
            );
          })}
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

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl bg-white p-3 shadow-sm">
      <p className="text-2xl font-bold" style={{ color }}>
        {value}
      </p>
      <p className="text-slate-500">{label}</p>
    </div>
  );
}
