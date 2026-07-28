import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { gerekenOySayisiGuncelle, meslekGrubuHedefGuncelle } from "./actions";

export default async function AyarlarPage() {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const [{ data: secimAyarlari }, { data: meslekGruplari }] = await Promise.all([
    supabase.from("secim_ayarlari").select("*").single(),
    supabase.from("meslek_gruplari").select("*").order("sira"),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <Header profile={profile} title="Seçim Ayarları" />
      <div className="mx-auto w-full max-w-2xl md:max-w-4xl flex-1 space-y-3 p-4">
        <Link href="/yonetim" className="text-sm text-slate-500">
          ← Yönetim paneline dön
        </Link>

        <form action={gerekenOySayisiGuncelle} className="flex flex-col gap-2 rounded-xl bg-white p-4 shadow-sm">
          <label className="text-sm font-semibold text-slate-700">Kazanmak İçin Gereken Toplam Oy Sayısı</label>
          <input
            type="number"
            name="gereken_oy_sayisi"
            defaultValue={secimAyarlari?.gereken_oy_sayisi ?? 0}
            className="h-11 rounded-lg border border-slate-300 px-3 text-sm"
          />
          <button type="submit" className="h-11 rounded-lg bg-slate-900 text-sm font-medium text-white">
            Kaydet
          </button>
        </form>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-700">Meslek Gruplarına Göre Hedeflenen Meclis Üyesi</h3>
          {(meslekGruplari ?? []).map((g) => {
            const action = meslekGrubuHedefGuncelle.bind(null, g.id);
            return (
              <form key={g.id} action={action} className="flex items-center gap-2 rounded-xl bg-white p-3 shadow-sm">
                <span className="flex-1 text-sm text-slate-700">{g.ad}</span>
                <input
                  type="number"
                  name="hedef_meclis_uyesi"
                  defaultValue={g.hedef_meclis_uyesi}
                  className="h-10 w-20 rounded-lg border border-slate-300 px-2 text-sm"
                />
                <button type="submit" className="h-10 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white">
                  Kaydet
                </button>
              </form>
            );
          })}
        </div>
      </div>
    </div>
  );
}
