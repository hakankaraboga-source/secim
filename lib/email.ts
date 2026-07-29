// Resend uzerinden e-posta gonderimi. RESEND_API_KEY tanimli degilse
// sessizce "anahtar_yok" doner - uygulama e-postasiz da calisir.

export type EpostaSonucu = "gonderildi" | "anahtar_yok" | "hata";

export async function epostaGonder(
  to: string,
  subject: string,
  html: string
): Promise<EpostaSonucu> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return "anahtar_yok";

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "BATSO Kampanya <onboarding@resend.dev>",
        to,
        subject,
        html,
      }),
    });
    return r.ok ? "gonderildi" : "hata";
  } catch {
    return "hata";
  }
}
