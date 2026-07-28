import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { firmaOlustur } from "./actions";

export default async function YeniFirmaPage() {
  const profile = await requireAdmin();
  const supabase = await createClient();
  const { data: meslekGruplari } = await supabase.from("meslek_gruplari").select("id, ad").order("sira");

  return (
    <div className="flex flex-1 flex-col">
      <Header profile={profile} title="Yeni Firma Ekle" />
      <div className="mx-auto w-full max-w-2xl flex-1 p-4">
        <form action={firmaOlustur} className="flex flex-col gap-2 rounded-xl bg-white p-4 shadow-sm">
          <Field name="firma_unvani" label="Firma Unvanı *" required />
          <Field name="yetkili_kisi" label="Yetkili Kişi" />
          <Field name="yetkili_telefon" label="Yetkili Telefon" type="tel" />
          <label className="text-xs text-slate-500">Meslek Grubu</label>
          <select name="meslek_grubu_id" className="h-11 rounded-lg border border-slate-300 px-2 text-sm">
            <option value="">Seçilmedi</option>
            {meslekGruplari?.map((g) => (
              <option key={g.id} value={g.id}>
                {g.ad}
              </option>
            ))}
          </select>
          <Field name="vergi_no" label="Vergi No" />
          <Field name="oda_sicil_no" label="Oda Sicil No" />
          <Field name="soyisim_grubu" label="Soyisim Grubu (bağlantılı kişiler için)" />
          <Field name="adres" label="Adres" />
          <label className="text-xs text-slate-500">Notlar</label>
          <textarea name="notlar" className="min-h-20 rounded-lg border border-slate-300 p-2 text-sm" />
          <button type="submit" className="mt-2 h-12 rounded-lg bg-slate-900 text-base font-medium text-white">
            Firmayı Kaydet
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <>
      <label className="text-xs text-slate-500">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        className="h-11 rounded-lg border border-slate-300 px-2 text-sm"
      />
    </>
  );
}
