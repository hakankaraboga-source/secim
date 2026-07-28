"use server";

import { createClient } from "@/lib/supabase/server";

export type GirisState = {
  status: "idle" | "error" | "kod_bekleniyor" | "ok";
  message: string;
  email: string;
};

// Iki adimli giris (sifre sonrasi e-posta kodu) anahtari.
// Ozel SMTP baglanmadan acilmamali: Supabase'in yerlesik e-posta servisi
// saatte birkac e-postayla sinirli, ekip girisleri hemen tikanir.
const OTP_AKTIF = false;

export async function girisYap(_prevState: GirisState, formData: FormData): Promise<GirisState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !email.includes("@")) {
    return { status: "error", message: "Geçerli bir e-posta adresi girin.", email: "" };
  }
  if (!password) {
    return { status: "error", message: "Şifrenizi girin.", email: "" };
  }

  const supabase = await createClient();

  // 1. adim: sifreyi dogrula
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { status: "error", message: "E-posta veya şifre hatalı.", email: "" };
  }

  if (!OTP_AKTIF) {
    // OTP kapali: sifre yeterli, oturum acildi
    return { status: "ok", message: "", email };
  }

  // Sifre dogru, ama kod dogrulanana kadar oturum acik kalmasin
  await supabase.auth.signOut();

  // 2. adim: e-postaya tek kullanimlik kod gonder
  const { error: otpError } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
  if (otpError) {
    return {
      status: "error",
      message:
        "Şifre doğru ancak doğrulama kodu gönderilemedi (e-posta gönderim sınırına takılmış olabilirsiniz). Birkaç dakika sonra tekrar deneyin.",
      email: "",
    };
  }

  return { status: "kod_bekleniyor", message: "", email };
}

export async function kodDogrula(_prevState: GirisState, formData: FormData): Promise<GirisState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const token = String(formData.get("token") ?? "").trim();

  if (!token) {
    return { status: "error", message: "E-postanıza gelen kodu girin.", email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });

  if (error) {
    return { status: "error", message: "Kod hatalı veya süresi dolmuş.", email };
  }

  return { status: "ok", message: "", email };
}
