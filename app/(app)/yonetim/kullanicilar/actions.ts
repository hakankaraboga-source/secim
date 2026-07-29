"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import type { UserRole } from "@/lib/database.types";

export type KullaniciEkleState = { status: "idle" | "ok" | "error"; message: string };

export async function kullaniciEkle(
  _prevState: KullaniciEkleState,
  formData: FormData
): Promise<KullaniciEkleState> {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !email.includes("@")) {
    return { status: "error", message: "Geçerli bir e-posta adresi girin." };
  }
  if (password.length < 6) {
    return { status: "error", message: "Şifre en az 6 karakter olmalı." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    return { status: "error", message: `Kullanıcı eklenemedi: ${error.message}` };
  }

  revalidatePath("/yonetim/kullanicilar");
  return { status: "ok", message: `${email} eklendi. Şifreyi kullanıcıya iletin.` };
}

export async function kullaniciGuncelle(userId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const rol = String(formData.get("rol") ?? "saha") as UserRole;
  const meslek_grubu_id = String(formData.get("meslek_grubu_id") ?? "").trim() || null;
  const ad_soyad = String(formData.get("ad_soyad") ?? "").trim() || null;
  const telefon = String(formData.get("telefon") ?? "").trim() || null;
  const aktif = formData.get("aktif") === "on";

  const { error } = await supabase
    .from("profiles")
    .update({ rol, meslek_grubu_id, ad_soyad, telefon, aktif })
    .eq("id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/yonetim/kullanicilar");
}
