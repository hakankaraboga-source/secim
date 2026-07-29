// Netgsm uzerinden SMS gonderimi. NETGSM_USERCODE / NETGSM_PASSWORD /
// NETGSM_HEADER tanimli degilse sessizce "ayar_yok" doner - uygulama
// SMS'siz de calisir.

export type SmsSonucu = "gonderildi" | "ayar_yok" | "hata";

export async function smsGonder(telefon: string, mesaj: string): Promise<SmsSonucu> {
  const usercode = process.env.NETGSM_USERCODE;
  const password = process.env.NETGSM_PASSWORD;
  const header = process.env.NETGSM_HEADER;
  if (!usercode || !password || !header) return "ayar_yok";

  const no = telefon.replace(/\D/g, "").replace(/^90/, "").replace(/^0/, "");
  if (no.length !== 10) return "hata";

  try {
    const r = await fetch("https://api.netgsm.com.tr/sms/rest/v2/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + Buffer.from(`${usercode}:${password}`).toString("base64"),
      },
      body: JSON.stringify({
        msgheader: header,
        encoding: "TR",
        messages: [{ msg: mesaj, no }],
      }),
    });
    if (!r.ok) return "hata";
    const j = (await r.json().catch(() => null)) as { code?: string; jobid?: string } | null;
    return j && (j.code === "00" || j.jobid) ? "gonderildi" : "hata";
  } catch {
    return "hata";
  }
}
