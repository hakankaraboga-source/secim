"use server";

import { createClient } from "@/lib/supabase/server";

export type GonderState = { status: "idle" | "error" | "sent"; message: string; email: string };
export type DogrulaState = { status: "idle" | "error" | "ok"; message: string; email: string };

export async function kodGonder(_prevState: GonderState, formData: FormData): Promise<GonderState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return { status: "error" as const, message: "Geçerli bir e-posta adresi girin.", email: "" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });

  if (error) {
    return {
      status: "error" as const,
      message: "Kod gönderilemedi. E-posta adresinizin sisteme kayıtlı olduğundan emin olun.",
      email: "",
    };
  }

  return { status: "sent" as const, message: "", email };
}

export async function koduDogrula(_prevState: DogrulaState, formData: FormData): Promise<DogrulaState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const token = String(formData.get("token") ?? "").trim();

  if (!token) {
    return { status: "error" as const, message: "Kodu girin.", email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    return { status: "error" as const, message: "Kod hatalı veya süresi dolmuş.", email };
  }

  return { status: "ok" as const, message: "", email };
}
