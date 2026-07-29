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
  const ad_soyad = String(formData.get("ad_soyad") ?? "").trim() || null;
  const telefon = String(formData.get("telefon") ?? "").trim() || null;
  const rol = String(formData.get("rol") ?? "temsilci") as UserRole;

  if (!email || !email.includes("@")) {
    return { status: "error", message: "Geçerli bir e-posta adresi girin." };
  }
  if (password.length < 6) {
    return { status: "error", message: "Şifre en az 6 karakter olmalı." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    return { status: "error", message: `Kullanıcı eklenemedi: ${error.message}` };
  }

  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ ad_soyad, telefon, rol })
    .eq("id", data.user.id);

  revalidatePath("/yonetim/kullanicilar");
  return { status: "ok", message: `${email} eklendi. Şifreyi kullanıcıya iletin.` };
}

export async function kullaniciGuncelle(userId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const rol = String(formData.get("rol") ?? "temsilci") as UserRole;
  const ad_soyad = String(formData.get("ad_soyad") ?? "").trim() || null;
  const telefon = String(formData.get("telefon") ?? "").trim() || null;
  const aktif = formData.get("aktif") === "on";
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const mevcutEmail = String(formData.get("mevcut_email") ?? "").trim().toLowerCase();

  const yetki_meslek_gruplari = formData
    .getAll("yetki_gruplar")
    .map(String)
    .filter(Boolean);
  const yetki_mahalleler = String(formData.get("yetki_mahalleler") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const guncelleme: Record<string, unknown> = {
    rol,
    ad_soyad,
    telefon,
    aktif,
    yetki_meslek_gruplari,
    yetki_mahalleler,
  };

  // E-posta degistiyse auth kaydini da guncelle
  if (email && email !== mevcutEmail && email.includes("@")) {
    const admin = createAdminClient();
    const { error: authError } = await admin.auth.admin.updateUserById(userId, {
      email,
      email_confirm: true,
    });
    if (authError) throw new Error(`E-posta değiştirilemedi: ${authError.message}`);
    guncelleme.email = email;
  }

  const { error } = await supabase.from("profiles").update(guncelleme).eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/yonetim/kullanicilar");
}

export type SanalTemsilciState = {
  status: "idle" | "ok" | "error";
  message: string;
  olusturulan: string[];
};

const SANAL_SIFRE = "Batso2026!";

export async function sanalTemsilcileriOlustur(
  _prevState: SanalTemsilciState,
  _formData: FormData
): Promise<SanalTemsilciState> {
  await requireAdmin();
  const supabase = await createClient();
  const admin = createAdminClient();

  const [{ data: gruplar }, { data: mevcutlar }] = await Promise.all([
    supabase.from("meslek_gruplari").select("id, ad, sira").order("sira"),
    supabase.from("profiles").select("email"),
  ]);

  const mevcutEmailler = new Set((mevcutlar ?? []).map((p) => p.email.toLowerCase()));
  const olusturulan: string[] = [];

  for (const grup of gruplar ?? []) {
    const email = `grup${grup.sira}.temsilci@batso.app`;
    if (mevcutEmailler.has(email)) continue;

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: SANAL_SIFRE,
      email_confirm: true,
    });
    if (error || !data.user) continue;

    await supabase
      .from("profiles")
      .update({
        ad_soyad: `${grup.ad} Temsilcisi`,
        rol: "temsilci",
        yetki_meslek_gruplari: [grup.id],
      })
      .eq("id", data.user.id);

    olusturulan.push(email);
  }

  revalidatePath("/yonetim/kullanicilar");

  if (olusturulan.length === 0) {
    return {
      status: "ok",
      message: "Tüm grup temsilcileri zaten mevcut, yeni kayıt oluşturulmadı.",
      olusturulan: [],
    };
  }
  return {
    status: "ok",
    message: `${olusturulan.length} sanal temsilci oluşturuldu (şifreleri: ${SANAL_SIFRE}). Gerçek kişiler belli olunca ad, e-posta ve telefonlarını bu ekrandan değiştirin.`,
    olusturulan,
  };
}
