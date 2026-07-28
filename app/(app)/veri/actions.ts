"use server";

import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import type { DestekDurumuDb } from "@/lib/database.types";

const DESTEK_ETIKET_TO_KOD: Record<string, DestekDurumuDb> = {
  "kesin destekliyor": "kesin_destek",
  kararsız: "kararsiz",
  "rakip adaya yakın": "rakip",
  görüşülmedi: "gorusulmedi",
  "oy kullanamaz / kapalı": "oy_kullanamaz",
};

type SatirSonucu = { satir: number; hata: string };

export type IceAktarSonucu = {
  status: "idle" | "ok" | "error";
  eklenen: number;
  hatalar: SatirSonucu[];
  message?: string;
};

const BOS: IceAktarSonucu = { status: "idle", eklenen: 0, hatalar: [] };

export async function iceAktar(_prevState: IceAktarSonucu, formData: FormData): Promise<IceAktarSonucu> {
  await requireAdmin();

  const dosya = formData.get("dosya");
  if (!(dosya instanceof File) || dosya.size === 0) {
    return { ...BOS, status: "error", message: "Bir Excel dosyası seçin." };
  }

  const supabase = await createClient();
  const { data: meslekGruplari } = await supabase.from("meslek_gruplari").select("id, ad");
  const meslekGrubuHaritasi = new Map((meslekGruplari ?? []).map((g) => [g.ad.toLowerCase(), g.id]));

  const buffer = await dosya.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const ilkSayfa = workbook.SheetNames[0];
  const satirlar = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[ilkSayfa], {
    defval: "",
  });

  const eklenecekler: Record<string, unknown>[] = [];
  const hatalar: SatirSonucu[] = [];

  satirlar.forEach((satir, index) => {
    const firmaUnvani = String(satir["Firma Unvanı"] ?? satir["firma_unvani"] ?? "").trim();
    if (!firmaUnvani) {
      hatalar.push({ satir: index + 2, hata: "Firma Unvanı boş olamaz" });
      return;
    }

    const meslekGrubuAdi = String(satir["Meslek Grubu"] ?? "").trim().toLowerCase();
    const destekEtiketi = String(satir["Destek Durumu"] ?? "").trim().toLowerCase();

    eklenecekler.push({
      firma_unvani: firmaUnvani,
      yetkili_kisi: String(satir["Yetkili Kişi"] ?? "").trim() || null,
      yetkili_telefon: String(satir["Yetkili Telefon"] ?? "").trim() || null,
      meslek_grubu_id: meslekGrubuHaritasi.get(meslekGrubuAdi) ?? null,
      vergi_no: String(satir["Vergi No"] ?? "").trim() || null,
      oda_sicil_no: String(satir["Oda Sicil No"] ?? "").trim() || null,
      oy_kullanacak_kisi: String(satir["Oy Kullanacak Kişi"] ?? "").trim() || null,
      yetki_belgesi_durumu: String(satir["Yetki Belgesi Durumu"] ?? "").trim() || null,
      aidat_engel_durumu: String(satir["Aidat/Engel Durumu"] ?? "").trim() || null,
      adres: String(satir["Adres"] ?? "").trim() || null,
      soyisim_grubu: String(satir["Soyisim Grubu"] ?? "").trim() || null,
      notlar: String(satir["Notlar"] ?? "").trim() || null,
      destek_durumu: DESTEK_ETIKET_TO_KOD[destekEtiketi] ?? "gorusulmedi",
    });
  });

  if (eklenecekler.length === 0) {
    return { status: "error", eklenen: 0, hatalar, message: "Eklenecek geçerli satır bulunamadı." };
  }

  const PARCA_BOYUTU = 500;
  let eklenen = 0;
  for (let i = 0; i < eklenecekler.length; i += PARCA_BOYUTU) {
    const parca = eklenecekler.slice(i, i + PARCA_BOYUTU);
    const { error } = await supabase.from("firmalar").insert(parca);
    if (error) {
      hatalar.push({ satir: i + 2, hata: error.message });
    } else {
      eklenen += parca.length;
    }
  }

  return { status: "ok", eklenen, hatalar };
}
