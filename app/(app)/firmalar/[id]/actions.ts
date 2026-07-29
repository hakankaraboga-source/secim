"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { DestekDurumuDb, GorusmeTipiDb } from "@/lib/database.types";

export async function destekDurumuGuncelle(firmaId: string, formData: FormData) {
  const durum = String(formData.get("durum") ?? "") as DestekDurumuDb;
  const supabase = await createClient();
  const { error } = await supabase.from("firmalar").update({ destek_durumu: durum }).eq("id", firmaId);
  if (error) throw new Error(error.message);
  revalidatePath(`/firmalar/${firmaId}`);
  revalidatePath("/firmalar");
  revalidatePath("/");
}

export async function gorusmeEkle(firmaId: string, formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const tip = String(formData.get("tip") ?? "telefon") as GorusmeTipiDb;
  const sonuc = String(formData.get("sonuc") ?? "").trim() || null;
  const talep_problem = String(formData.get("talep_problem") ?? "").trim() || null;
  const tekrar_arama_tarihi = String(formData.get("tekrar_arama_tarihi") ?? "").trim() || null;
  const yeniDurum = formData.get("yeni_durum") ? String(formData.get("yeni_durum")) as DestekDurumuDb : null;

  const { error: gorusmeError } = await supabase.from("gorusmeler").insert({
    firma_id: firmaId,
    gorusen_id: profile.id,
    tip,
    sonuc,
    talep_problem,
    tekrar_arama_tarihi,
  });
  if (gorusmeError) throw new Error(gorusmeError.message);

  const guncelleme: Record<string, unknown> = {
    son_gorusme_sonucu: sonuc,
    tekrar_arama_tarihi,
  };
  if (yeniDurum) guncelleme.destek_durumu = yeniDurum;

  const { error: firmaError } = await supabase.from("firmalar").update(guncelleme).eq("id", firmaId);
  if (firmaError) throw new Error(firmaError.message);

  revalidatePath(`/firmalar/${firmaId}`);
  revalidatePath("/firmalar");
  revalidatePath("/");
}

export async function kisiEkle(firmaId: string, formData: FormData) {
  const ad_soyad = String(formData.get("ad_soyad") ?? "").trim();
  if (!ad_soyad) throw new Error("Kişi adı zorunlu.");
  const telefon = String(formData.get("telefon") ?? "").trim() || null;
  const etiket = String(formData.get("etiket") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase.from("kisiler").insert({ firma_id: firmaId, ad_soyad, telefon, etiket });
  if (error) throw new Error(error.message);
  revalidatePath(`/firmalar/${firmaId}`);
  revalidatePath("/kisiler");
}

export async function kisiSil(firmaId: string, kisiId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("kisiler").delete().eq("id", kisiId);
  if (error) throw new Error(error.message);
  revalidatePath(`/firmalar/${firmaId}`);
  revalidatePath("/kisiler");
}

export async function gorevAta(firmaId: string, formData: FormData) {
  const anaSorumluId = String(formData.get("ana_sorumlu_id") ?? "").trim() || null;
  const ikinciBaglantiId = String(formData.get("ikinci_baglanti_id") ?? "").trim() || null;
  const bekleyenGorev = String(formData.get("bekleyen_gorev") ?? "").trim() || null;
  const aileNotu = String(formData.get("aile_dostluk_notu") ?? "").trim() || null;
  const referans = String(formData.get("referans") ?? "").trim() || null;
  const mahalle = String(formData.get("mahalle") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("firmalar")
    .update({
      ana_sorumlu_id: anaSorumluId,
      ikinci_baglanti_id: ikinciBaglantiId,
      bekleyen_gorev: bekleyenGorev,
      aile_dostluk_notu: aileNotu,
      referans,
      mahalle,
    })
    .eq("id", firmaId);
  if (error) throw new Error(error.message);

  revalidatePath(`/firmalar/${firmaId}`);
  revalidatePath("/gorevler");
}
