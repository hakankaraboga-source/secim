"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { epostaGonder } from "@/lib/email";
import { smsGonder } from "@/lib/sms";

export type AtamaSonucu = {
  status: "idle" | "ok" | "error";
  atanan: number;
  sorumluAd: string;
  epostaDurumu: "gonderildi" | "anahtar_yok" | "hata" | "";
  message?: string;
};

const BOS: AtamaSonucu = { status: "idle", atanan: 0, sorumluAd: "", epostaDurumu: "" };

export async function topluAta(_prevState: AtamaSonucu, formData: FormData): Promise<AtamaSonucu> {
  await requireAdmin();
  const supabase = await createClient();

  const sorumluId = String(formData.get("sorumlu_id") ?? "").trim();
  if (!sorumluId) {
    return { ...BOS, status: "error", message: "Bir sorumlu seçin." };
  }

  const grupId = String(formData.get("grup") ?? "").trim();
  const durum = String(formData.get("durum") ?? "").trim();
  const mahalle = String(formData.get("mahalle") ?? "").trim();
  const referans = String(formData.get("referans") ?? "").trim();
  const sadeceSorumsuz = formData.get("sadece_sorumsuz") === "on";
  const adet = Math.max(0, Number(formData.get("adet")) || 0);

  if (!grupId && !durum && !mahalle && !referans && !sadeceSorumsuz) {
    return {
      ...BOS,
      status: "error",
      message: "En az bir filtre seçin — tüm listeyi tek kişiye atamak için 'Sorumlusu olmayanlar'ı işaretleyin.",
    };
  }

  // Filtreye uyan firma id'lerini topla (PostgREST 1000 satir siniri icin sayfalayarak)
  const ids: string[] = [];
  const hedefAdet = adet > 0 ? adet : Infinity;
  for (let from = 0; ids.length < hedefAdet; from += 1000) {
    let q = supabase
      .from("firmalar")
      .select("id")
      .order("firma_unvani")
      .range(from, from + 999);
    if (grupId) q = q.eq("meslek_grubu_id", grupId);
    if (durum) q = q.eq("destek_durumu", durum);
    if (mahalle) q = q.ilike("mahalle", `%${mahalle}%`);
    if (referans) q = q.ilike("referans", `%${referans}%`);
    if (sadeceSorumsuz) q = q.is("ana_sorumlu_id", null);

    const { data, error } = await q;
    if (error) return { ...BOS, status: "error", message: error.message };
    for (const r of data ?? []) {
      if (ids.length >= hedefAdet) break;
      ids.push(r.id);
    }
    if (!data || data.length < 1000) break;
  }

  if (ids.length === 0) {
    return { ...BOS, status: "error", message: "Filtreye uyan firma bulunamadı." };
  }

  for (let i = 0; i < ids.length; i += 500) {
    const parca = ids.slice(i, i + 500);
    const { error } = await supabase
      .from("firmalar")
      .update({ ana_sorumlu_id: sorumluId })
      .in("id", parca);
    if (error) return { ...BOS, status: "error", message: error.message };
  }

  const { data: sorumlu } = await supabase
    .from("profiles")
    .select("ad_soyad, email, telefon")
    .eq("id", sorumluId)
    .single();
  const sorumluAd = sorumlu?.ad_soyad || sorumlu?.email || "";

  if (sorumlu?.telefon) {
    await smsGonder(
      sorumlu.telefon,
      `BATSO Kampanya: Size ${ids.length} firma atandi. Liste: batso.app/gorevler`
    );
  }

  let epostaDurumu: AtamaSonucu["epostaDurumu"] = "";
  if (sorumlu?.email) {
    epostaDurumu = await epostaGonder(
      sorumlu.email,
      `BATSO Kampanya: Size ${ids.length} firma atandı`,
      `<h2>Yeni Görev Ataması</h2>
       <p>Merhaba ${sorumluAd},</p>
       <p>Size <strong>${ids.length} firma</strong> atandı. Takip listenizi görmek için uygulamaya girin:</p>
       <p><a href="https://www.batso.app/gorevler">batso.app/gorevler</a></p>
       <p>BATSO Seçim Kampanyası · Ferdi Kurt</p>`
    );
  }

  await supabase.from("islem_kayitlari").insert({
    kullanici_id: (await supabase.auth.getUser()).data.user?.id ?? null,
    eylem: "toplu_atama",
    hedef_tablo: "firmalar",
    detay: { atanan: ids.length, sorumlu_id: sorumluId },
  });

  revalidatePath("/yonetim/atamalar");
  revalidatePath("/");
  revalidatePath("/firmalar");
  revalidatePath("/gorevler");

  return { status: "ok", atanan: ids.length, sorumluAd, epostaDurumu };
}
