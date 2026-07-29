"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function firmaOlustur(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const firma_unvani = String(formData.get("firma_unvani") ?? "").trim();
  if (!firma_unvani) throw new Error("Firma unvanı zorunludur.");

  const meslek_grubu_id = String(formData.get("meslek_grubu_id") ?? "").trim() || null;

  const { data, error } = await supabase
    .from("firmalar")
    .insert({
      firma_unvani,
      yetkili_kisi: String(formData.get("yetkili_kisi") ?? "").trim() || null,
      yetkili_telefon: String(formData.get("yetkili_telefon") ?? "").trim() || null,
      meslek_grubu_id,
      vergi_no: String(formData.get("vergi_no") ?? "").trim() || null,
      oda_sicil_no: String(formData.get("oda_sicil_no") ?? "").trim() || null,
      soyisim_grubu: String(formData.get("soyisim_grubu") ?? "").trim() || null,
      mahalle: String(formData.get("mahalle") ?? "").trim() || null,
      referans: String(formData.get("referans") ?? "").trim() || null,
      adres: String(formData.get("adres") ?? "").trim() || null,
      notlar: String(formData.get("notlar") ?? "").trim() || null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/firmalar");
  redirect(`/firmalar/${data.id}`);
}
