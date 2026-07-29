import * as XLSX from "xlsx";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { DESTEK_DURUMLARI, type DestekDurumu } from "@/lib/constants";
import type { FirmaRow } from "@/lib/database.types";

type FirmaDisaAktar = FirmaRow & {
  meslek_gruplari: { ad: string } | null;
  ana_sorumlu: { ad_soyad: string | null; email: string } | null;
};

export async function GET() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("firmalar")
    .select("*, meslek_gruplari(ad), ana_sorumlu:ana_sorumlu_id(ad_soyad, email)")
    .order("firma_unvani");

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const firmalar = data as unknown as FirmaDisaAktar[];

  const satirlar = (firmalar ?? []).map((f) => ({
    "Firma Unvanı": f.firma_unvani,
    "Yetkili Kişi": f.yetkili_kisi,
    "Yetkili Telefon": f.yetkili_telefon,
    "Meslek Grubu": f.meslek_gruplari?.ad ?? "",
    "Vergi No": f.vergi_no,
    "Oda Sicil No": f.oda_sicil_no,
    "Oy Kullanacak Kişi": f.oy_kullanacak_kisi,
    "Yetki Belgesi Durumu": f.yetki_belgesi_durumu,
    "Aidat/Engel Durumu": f.aidat_engel_durumu,
    Adres: f.adres,
    Mahalle: f.mahalle,
    Referans: f.referans,
    "Soyisim Grubu": f.soyisim_grubu,
    "Destek Durumu": DESTEK_DURUMLARI[f.destek_durumu as DestekDurumu]?.label ?? f.destek_durumu,
    "Ana Sorumlu": f.ana_sorumlu?.ad_soyad || f.ana_sorumlu?.email || "",
    "Bekleyen Görev": f.bekleyen_gorev,
    "Tekrar Arama Tarihi": f.tekrar_arama_tarihi,
    "Seçim Günü Durumu": f.secim_gunu_durumu,
    Notlar: f.notlar,
  }));

  await supabase.from("islem_kayitlari").insert({
    kullanici_id: admin.id,
    eylem: "disa_aktar",
    hedef_tablo: "firmalar",
    detay: { adet: satirlar.length },
  });

  const sheet = XLSX.utils.json_to_sheet(satirlar);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Firmalar");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="batso-firmalar-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
