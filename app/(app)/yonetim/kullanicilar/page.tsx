import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { KULLANICI_ROLLERI } from "@/lib/constants";
import { KullaniciEkleForm } from "@/components/KullaniciEkleForm";
import { kullaniciGuncelle } from "./actions";

export default async function KullanicilarPage() {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const [{ data: kullanicilar }, { data: meslekGruplari }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("meslek_gruplari").select("id, ad").order("sira"),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <Header profile={profile} title="Kullanıcılar" />
      <div className="mx-auto w-full max-w-2xl flex-1 space-y-3 p-4">
        <Link href="/yonetim" className="text-sm text-slate-500">
          ← Yönetim paneline dön
        </Link>

        <KullaniciEkleForm />

        <ul className="space-y-2">
          {(kullanicilar ?? []).map((k) => {
            const guncelleAction = kullaniciGuncelle.bind(null, k.id);
            return (
              <li key={k.id} className="rounded-xl bg-white p-3 shadow-sm">
                <form action={guncelleAction} className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-slate-900">{k.email}</p>
                  <input
                    name="ad_soyad"
                    defaultValue={k.ad_soyad ?? ""}
                    placeholder="Ad Soyad"
                    className="h-10 rounded-lg border border-slate-300 px-2 text-sm"
                  />
                  <select name="rol" defaultValue={k.rol} className="h-10 rounded-lg border border-slate-300 px-2 text-sm">
                    {Object.entries(KULLANICI_ROLLERI).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <select
                    name="meslek_grubu_id"
                    defaultValue={k.meslek_grubu_id ?? ""}
                    className="h-10 rounded-lg border border-slate-300 px-2 text-sm"
                  >
                    <option value="">Meslek grubu yok (Grup Sorumlusu için gerekli)</option>
                    {meslekGruplari?.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.ad}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" name="aktif" defaultChecked={k.aktif} />
                    Aktif
                  </label>
                  <button type="submit" className="h-10 rounded-lg bg-slate-900 text-sm font-medium text-white">
                    Kaydet
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
