"use server";

import { createClient } from "@/lib/supabase/server";

export type GirisState = { status: "idle" | "error" | "ok"; message: string };

export async function girisYap(_prevState: GirisState, formData: FormData): Promise<GirisState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !email.includes("@")) {
    return { status: "error", message: "Geçerli bir e-posta adresi girin." };
  }
  if (!password) {
    return { status: "error", message: "Şifrenizi girin." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { status: "error", message: "E-posta veya şifre hatalı." };
  }

  return { status: "ok", message: "" };
}
