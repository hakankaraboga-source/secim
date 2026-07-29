import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { TopluAtamaForm } from "@/components/TopluAtamaForm";
import { KULLANICI_ROLLERI } from "@/lib/constants";
import type { EkipOzetRow } from "@/lib/database.types";

export default async function AtamalarPage() {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const [{ data: profiller }, { data: meslekGruplari }, { data: ekipData }] = await Promise.all([
    supabase.from("profiles").select("id, ad_soyad, email, rol").eq("aktif", true).order("ad_soyad"),
    supabase.from("meslek_gruplari").select("id, ad").order("sira"),
    supabase.from("ekip_ozet").select("*").order("atanan_firma", { ascending: false }),
  ]);

  const ekip = (ekipData ?? []) as EkipOzetRow[];

  return (
    <div className="flex flex-1 flex-col">
      <Header profile={profile} title="Görev Atamaları" />
      <div className="mx-auto w-full max-w-2xl md:max-w-4xl flex-1 space-y-4 p-4">
        <Link href="/yonetim" className="text-sm text-slate-500">
          ← Yönetim paneline dön
        </Link>

        <TopluAtamaForm
          sorumlular={(profiller ?? []).map((p) => ({
            id: p.id,
            ad: `${p.ad_soyad || p.email} (${KULLANICI_ROLLERI[p.rol as keyof typeof KULLANICI_ROLLERI]})`,
          }))}
          meslekGruplari={(meslekGruplari ?? []).map((g) => ({ id: g.id, ad: g.ad }))}
        />

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Mevcut Atama Dağılımı</h2>
          {ekip.length === 0 ? (
            <p className="text-sm text-slate-500">Aktif kullanıcı yok.</p>
          ) : (
            <ul className="space-y-3">
              {ekip.map((e) => {
                const gorusulen = e.atanan_firma - e.gorusulmedi;
                const yuzde = e.atanan_firma > 0 ? Math.round((gorusulen / e.atanan_firma) * 100) : 0;
                return (
                  <li key={e.id}>
                    <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                      <span className="font-medium text-slate-900">{e.ad_soyad || e.email}</span>
                      <span className="text-xs text-slate-500">
                        {e.atanan_firma} firma · %{yuzde} görüşüldü
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-slate-900"
                        style={{ width: `${yuzde}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      🟢 {e.kesin_destek} kesin destek · 📞 {e.son7g_gorusme} görüşme (7g)
                      {e.geciken > 0 && <span className="text-red-600"> · ⏰ {e.geciken} geciken</span>}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
