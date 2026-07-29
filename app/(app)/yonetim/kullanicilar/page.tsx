import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { KULLANICI_ROLLERI, ROL_SECENEKLERI } from "@/lib/constants";
import { KullaniciEkleForm, SanalTemsilciForm } from "@/components/KullaniciEkleForm";
import { kullaniciGuncelle } from "./actions";
import type { ProfileRow } from "@/lib/database.types";

export default async function KullanicilarPage() {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const [{ data: kullanicilarData }, { data: meslekGruplari }] = await Promise.all([
    supabase.from("profiles").select("*").order("rol").order("ad_soyad"),
    supabase.from("meslek_gruplari").select("id, ad").order("sira"),
  ]);

  const kullanicilar = (kullanicilarData ?? []) as ProfileRow[];

  return (
    <div className="flex flex-1 flex-col">
      <Header profile={profile} title="Kullanıcı Yönetimi" />
      <div className="mx-auto w-full max-w-2xl md:max-w-6xl flex-1 space-y-4 p-4">
        <Link href="/yonetim" className="text-sm text-slate-500">
          ← Yönetim paneline dön
        </Link>

        <div className="grid gap-3 md:grid-cols-2">
          <KullaniciEkleForm />
          <SanalTemsilciForm />
        </div>

        <div className="rounded-xl bg-slate-100 p-3 text-xs text-slate-600">
          <p className="font-medium">Yetki modeli:</p>
          <p>
            <strong>Admin</strong> her şeyi yönetir · <strong>Yönetici</strong> tüm veriyi görür ve
            düzenler · <strong>Temsilci</strong> yalnızca kendisine atanan firmaları ve aşağıda
            seçtiğiniz meslek grubu / mahalle kapsamındaki firmaları görür ·{" "}
            <strong>Seçim Günü Görevlisi</strong> yalnızca seçim günü ekranını kullanır.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {kullanicilar.map((k) => {
            const guncelleAction = kullaniciGuncelle.bind(null, k.id);
            const rolDegeri = ROL_SECENEKLERI.includes(k.rol as (typeof ROL_SECENEKLERI)[number])
              ? k.rol
              : "temsilci";
            return (
              <form
                key={k.id}
                action={guncelleAction}
                className={`rounded-2xl bg-white p-4 shadow-sm ${!k.aktif ? "opacity-60" : ""}`}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {k.ad_soyad || k.email}
                  </p>
                  <span className="whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {KULLANICI_ROLLERI[k.rol]}
                  </span>
                </div>

                <input type="hidden" name="mevcut_email" value={k.email} />
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <label className="flex flex-col gap-1 text-xs text-slate-500">
                    Ad Soyad
                    <input
                      name="ad_soyad"
                      defaultValue={k.ad_soyad ?? ""}
                      className="h-10 rounded-lg border border-slate-300 px-2 text-sm text-slate-900"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-slate-500">
                    E-posta (giriş adresi)
                    <input
                      type="email"
                      name="email"
                      defaultValue={k.email}
                      className="h-10 rounded-lg border border-slate-300 px-2 text-sm text-slate-900"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-slate-500">
                    Telefon (SMS için)
                    <input
                      type="tel"
                      name="telefon"
                      defaultValue={k.telefon ?? ""}
                      className="h-10 rounded-lg border border-slate-300 px-2 text-sm text-slate-900"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-slate-500">
                    Rol
                    <select
                      name="rol"
                      defaultValue={rolDegeri}
                      className="h-10 rounded-lg border border-slate-300 px-2 text-sm text-slate-900"
                    >
                      {ROL_SECENEKLERI.map((rol) => (
                        <option key={rol} value={rol}>
                          {KULLANICI_ROLLERI[rol]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-slate-500 sm:col-span-2">
                    Yetkili olduğu meslek grupları (temsilci için — Ctrl/⌘ ile çoklu seçim)
                    <select
                      name="yetki_gruplar"
                      multiple
                      size={4}
                      defaultValue={k.yetki_meslek_gruplari ?? []}
                      className="rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-900"
                    >
                      {meslekGruplari?.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.ad}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-slate-500 sm:col-span-2">
                    Yetkili olduğu mahalleler (virgülle ayırın: Gap, Kültür, Meydan)
                    <input
                      name="yetki_mahalleler"
                      defaultValue={(k.yetki_mahalleler ?? []).join(", ")}
                      className="h-10 rounded-lg border border-slate-300 px-2 text-sm text-slate-900"
                    />
                  </label>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" name="aktif" defaultChecked={k.aktif} />
                    Aktif
                  </label>
                  <button
                    type="submit"
                    className="h-10 rounded-lg bg-slate-900 px-5 text-sm font-medium text-white"
                  >
                    Kaydet
                  </button>
                </div>
              </form>
            );
          })}
        </div>
      </div>
    </div>
  );
}
