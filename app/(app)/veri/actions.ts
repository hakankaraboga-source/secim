"use server";

import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import type { DestekDurumuDb } from "@/lib/database.types";
import { eskiFormatMi, unvanTemizle, yetkiliTelAyir, mahalleCikar, durumEsle } from "@/lib/eski-format";

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
  atlanan: number;
  kisiEklenen: number;
  hatalar: SatirSonucu[];
  message?: string;
};

const BOS: IceAktarSonucu = { status: "idle", eklenen: 0, atlanan: 0, kisiEklenen: 0, hatalar: [] };

type FirmaInsert = Record<string, unknown>;
type KisiTaslak = { ad_soyad: string; telefon: string | null; etiket: string };

export async function iceAktar(_prevState: IceAktarSonucu, formData: FormData): Promise<IceAktarSonucu> {
  const admin = await requireAdmin();

  const dosya = formData.get("dosya");
  if (!(dosya instanceof File) || dosya.size === 0) {
    return { ...BOS, status: "error", message: "Bir Excel dosyası seçin." };
  }

  const supabase = await createClient();
  const { data: meslekGruplari } = await supabase.from("meslek_gruplari").select("id, ad, sira");
  const grupAdHaritasi = new Map((meslekGruplari ?? []).map((g) => [g.ad.toLowerCase(), g.id]));
  const grupSiraHaritasi = new Map((meslekGruplari ?? []).map((g) => [g.sira, g.id]));

  const buffer = await dosya.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  // 'Firma Ünvanı' basligi iceren ilk sayfayi bul (Pivot vb. sayfalari atla)
  let satirlar: Record<string, unknown>[] = [];
  for (const sayfaAdi of workbook.SheetNames) {
    const adaylar = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sayfaAdi], {
      defval: "",
    });
    if (
      adaylar.length > 0 &&
      ("Firma Ünvanı" in adaylar[0] || "Firma Unvanı" in adaylar[0] || "firma_unvani" in adaylar[0])
    ) {
      satirlar = adaylar;
      break;
    }
  }

  if (satirlar.length === 0) {
    return {
      ...BOS,
      status: "error",
      message: "Dosyada 'Firma Ünvanı' sütunu olan bir sayfa bulunamadı.",
    };
  }

  const eskiFormat = eskiFormatMi(Object.keys(satirlar[0]));

  // Mukerrer korumasi: mevcut sicil numaralarini getir (sayfalayarak)
  const mevcutSiciller = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data: parca } = await supabase
      .from("firmalar")
      .select("oda_sicil_no")
      .not("oda_sicil_no", "is", null)
      .range(from, from + 999);
    for (const r of parca ?? []) {
      if (r.oda_sicil_no) mevcutSiciller.add(String(r.oda_sicil_no));
    }
    if (!parca || parca.length < 1000) break;
  }

  const eklenecekler: FirmaInsert[] = [];
  const kisiTaslaklari: KisiTaslak[][] = [];
  const hatalar: SatirSonucu[] = [];
  let atlanan = 0;
  const dosyadaGorulen = new Set<string>();

  satirlar.forEach((satir, index) => {
    const satirNo = index + 2;

    if (eskiFormat) {
      const unvan = unvanTemizle(satir["Firma Ünvanı"]);
      if (!unvan) {
        hatalar.push({ satir: satirNo, hata: "Firma Ünvanı boş" });
        return;
      }
      const sicil = String(satir["Sicil No"] ?? "").trim() || null;
      if (sicil && (mevcutSiciller.has(sicil) || dosyadaGorulen.has(sicil))) {
        atlanan++;
        return;
      }
      if (sicil) dosyadaGorulen.add(sicil);

      const { ad, tel, ikinci } = yetkiliTelAyir(satir["Yetkili - Tel"]);
      const grupNo = Number(satir["Meslek Grubu"]);

      eklenecekler.push({
        firma_unvani: unvan,
        yetkili_kisi: ad,
        yetkili_telefon: tel,
        adres: String(satir["Adresi"] ?? "").trim() || null,
        mahalle: mahalleCikar(satir["Adresi"]),
        oda_sicil_no: sicil,
        meslek_grubu_id:
          Number.isInteger(grupNo) && grupSiraHaritasi.has(grupNo)
            ? grupSiraHaritasi.get(grupNo)
            : null,
        destek_durumu: durumEsle(satir["Durumu"]),
        referans: String(satir["Referansı"] ?? "").trim() || null,
        notlar: String(satir["Not"] ?? "").trim() || null,
      });

      const kisiler: KisiTaslak[] = [];
      if (ad) kisiler.push({ ad_soyad: ad, telefon: tel, etiket: "yetkili" });
      if (ikinci && ikinci !== ad) kisiler.push({ ad_soyad: ikinci, telefon: null, etiket: "ilgili kişi" });
      kisiTaslaklari.push(kisiler);
    } else {
      // Sablon formati
      const firmaUnvani = String(satir["Firma Unvanı"] ?? satir["firma_unvani"] ?? "").trim();
      if (!firmaUnvani) {
        hatalar.push({ satir: satirNo, hata: "Firma Unvanı boş olamaz" });
        return;
      }
      const sicil = String(satir["Oda Sicil No"] ?? "").trim() || null;
      if (sicil && (mevcutSiciller.has(sicil) || dosyadaGorulen.has(sicil))) {
        atlanan++;
        return;
      }
      if (sicil) dosyadaGorulen.add(sicil);

      const meslekGrubuAdi = String(satir["Meslek Grubu"] ?? "").trim().toLowerCase();
      const destekEtiketi = String(satir["Destek Durumu"] ?? "").trim().toLowerCase();
      const yetkiliAd = String(satir["Yetkili Kişi"] ?? "").trim() || null;
      const yetkiliTel = String(satir["Yetkili Telefon"] ?? "").trim() || null;

      eklenecekler.push({
        firma_unvani: firmaUnvani,
        yetkili_kisi: yetkiliAd,
        yetkili_telefon: yetkiliTel,
        meslek_grubu_id: grupAdHaritasi.get(meslekGrubuAdi) ?? null,
        vergi_no: String(satir["Vergi No"] ?? "").trim() || null,
        oda_sicil_no: sicil,
        oy_kullanacak_kisi: String(satir["Oy Kullanacak Kişi"] ?? "").trim() || null,
        yetki_belgesi_durumu: String(satir["Yetki Belgesi Durumu"] ?? "").trim() || null,
        aidat_engel_durumu: String(satir["Aidat/Engel Durumu"] ?? "").trim() || null,
        adres: String(satir["Adres"] ?? "").trim() || null,
        mahalle: String(satir["Mahalle"] ?? "").trim() || null,
        referans: String(satir["Referans"] ?? "").trim() || null,
        soyisim_grubu: String(satir["Soyisim Grubu"] ?? "").trim() || null,
        notlar: String(satir["Notlar"] ?? "").trim() || null,
        destek_durumu: DESTEK_ETIKET_TO_KOD[destekEtiketi] ?? "gorusulmedi",
      });

      const kisiler: KisiTaslak[] = [];
      if (yetkiliAd) kisiler.push({ ad_soyad: yetkiliAd, telefon: yetkiliTel, etiket: "yetkili" });
      kisiTaslaklari.push(kisiler);
    }
  });

  if (eklenecekler.length === 0) {
    return {
      status: atlanan > 0 ? "ok" : "error",
      eklenen: 0,
      atlanan,
      kisiEklenen: 0,
      hatalar,
      message:
        atlanan > 0
          ? "Tüm satırlar zaten kayıtlı (sicil no eşleşti), yeni firma eklenmedi."
          : "Eklenecek geçerli satır bulunamadı.",
    };
  }

  const PARCA_BOYUTU = 500;
  let eklenen = 0;
  let kisiEklenen = 0;

  for (let i = 0; i < eklenecekler.length; i += PARCA_BOYUTU) {
    const parca = eklenecekler.slice(i, i + PARCA_BOYUTU);
    const { data: eklenenler, error } = await supabase.from("firmalar").insert(parca).select("id");
    if (error) {
      hatalar.push({ satir: i + 2, hata: error.message });
      continue;
    }
    eklenen += parca.length;

    // Ayni siradaki kisi taslaklarini eklenen firma id'leriyle eslestir
    const kisiSatirlari: Record<string, unknown>[] = [];
    (eklenenler ?? []).forEach((firma, j) => {
      for (const k of kisiTaslaklari[i + j] ?? []) {
        kisiSatirlari.push({ firma_id: firma.id, ...k });
      }
    });
    for (let j = 0; j < kisiSatirlari.length; j += PARCA_BOYUTU) {
      const { error: kisiError } = await supabase
        .from("kisiler")
        .insert(kisiSatirlari.slice(j, j + PARCA_BOYUTU));
      if (!kisiError) kisiEklenen += Math.min(PARCA_BOYUTU, kisiSatirlari.length - j);
    }
  }

  await supabase.from("islem_kayitlari").insert({
    kullanici_id: admin.id,
    eylem: "ice_aktar",
    hedef_tablo: "firmalar",
    detay: { eklenen, atlanan, kisiEklenen, format: eskiFormat ? "eski" : "sablon" },
  });

  return { status: "ok", eklenen, atlanan, kisiEklenen, hatalar };
}
