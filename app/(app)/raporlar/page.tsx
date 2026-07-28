import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";

export default async function RaporlarPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: ozet } = await supabase.from("meslek_grubu_ozet").select("*").order("sira");

  return (
    <div className="flex flex-1 flex-col">
      <Header profile={profile} title="Meslek Grubu Raporları" />
      <div className="mx-auto w-full max-w-2xl md:max-w-4xl flex-1 space-y-3 p-4 md:grid md:grid-cols-2 md:content-start md:gap-4 md:space-y-0">
        {(ozet ?? []).length === 0 ? (
          <p className="rounded-xl bg-white p-4 text-center text-sm text-slate-500 shadow-sm md:col-span-2">
            Görüntülenecek veri yok.
          </p>
        ) : (
          (ozet ?? []).map((g) => (
            <div key={g.meslek_grubu_id} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">{g.ad}</h3>
                <span className="text-xs text-slate-500">Hedef meclis üyesi: {g.hedef_meclis_uyesi}</span>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  <Row label="Toplam üye" value={g.toplam_uye} />
                  <Row label="Oy kullanabilecek üye" value={g.oy_kullanabilecek} />
                  <Row label="🟢 Kesin destek" value={g.kesin_destek} />
                  <Row label="🟡 Kararsız" value={g.kararsiz} />
                  <Row label="🔴 Rakip" value={g.rakip} />
                  <Row label="🔵 Görüşülmedi" value={g.gorusulmedi} />
                  <Row label="⚪ Oy kullanamaz" value={g.oy_kullanamaz} />
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <tr className="border-b border-slate-50 last:border-0">
      <td className="py-1 text-slate-600">{label}</td>
      <td className="py-1 text-right font-medium text-slate-900">{value}</td>
    </tr>
  );
}
