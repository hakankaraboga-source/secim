"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import type { UserRole } from "@/lib/database.types";

export async function kullaniciDavetEt(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) throw new Error("Geçerli bir e-posta adresi girin.");

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(email);
  if (error) throw new Error(error.message);

  revalidatePath("/yonetim/kullanicilar");
}

export async function kullaniciGuncelle(userId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const rol = String(formData.get("rol") ?? "saha") as UserRole;
  const meslek_grubu_id = String(formData.get("meslek_grubu_id") ?? "").trim() || null;
  const ad_soyad = String(formData.get("ad_soyad") ?? "").trim() || null;
  const aktif = formData.get("aktif") === "on";

  const { error } = await supabase
    .from("profiles")
    .update({ rol, meslek_grubu_id, ad_soyad, aktif })
    .eq("id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/yonetim/kullanicilar");
}
