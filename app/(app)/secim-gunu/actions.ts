"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SecimGunuDurumuDb } from "@/lib/database.types";

export async function secimGunuDurumuGuncelle(firmaId: string, formData: FormData) {
  const durum = String(formData.get("durum") ?? "") as SecimGunuDurumuDb;
  const supabase = await createClient();
  const { error } = await supabase.from("firmalar").update({ secim_gunu_durumu: durum }).eq("id", firmaId);
  if (error) throw new Error(error.message);
  revalidatePath("/secim-gunu");
}
