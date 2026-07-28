"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function gerekenOySayisiGuncelle(formData: FormData) {
  await requireAdmin();
  const gereken_oy_sayisi = Number(formData.get("gereken_oy_sayisi") ?? 0);
  const supabase = await createClient();
  const { error } = await supabase.from("secim_ayarlari").update({ gereken_oy_sayisi }).eq("id", 1);
  if (error) throw new Error(error.message);
  revalidatePath("/yonetim");
  revalidatePath("/yonetim/ayarlar");
}

export async function meslekGrubuHedefGuncelle(meslekGrubuId: string, formData: FormData) {
  await requireAdmin();
  const hedef_meclis_uyesi = Number(formData.get("hedef_meclis_uyesi") ?? 0);
  const supabase = await createClient();
  const { error } = await supabase
    .from("meslek_gruplari")
    .update({ hedef_meclis_uyesi })
    .eq("id", meslekGrubuId);
  if (error) throw new Error(error.message);
  revalidatePath("/yonetim/ayarlar");
  revalidatePath("/raporlar");
}
