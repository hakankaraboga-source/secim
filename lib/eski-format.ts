// Kampanya oncesi tutulan orijinal Excel formatinin (Data_23.07 sayfali dosya)
// ayristirma yardimcilari. Sutunlar: Firma Ünvanı, Adresi, Yetkili - Tel,
// Sicil No, Y Sicil No, Meslek Grubu, Durumu, Referansı, Not

import type { DestekDurumuDb } from "@/lib/database.types";

const DURUM_ESLEME: Record<string, DestekDurumuDb> = {
  bizde: "kesin_destek",
  "kararsız": "kararsiz",
  kararsiz: "kararsiz",
  rakipte: "rakip",
  "görüşülmedi": "gorusulmedi",
  gorusulmedi: "gorusulmedi",
};

export function eskiFormatMi(basliklar: string[]): boolean {
  return basliklar.includes("Yetkili - Tel") && basliklar.includes("Firma Ünvanı");
}

export function unvanTemizle(raw: unknown): string {
  return String(raw ?? "").split("<Y:")[0].trim();
}

function parantezKisi(raw: string): string | null {
  const m = raw.match(/\(([^)]+)\)/);
  return m ? m[1].trim() : null;
}

export function yetkiliTelAyir(raw: unknown): {
  ad: string | null;
  tel: string | null;
  ikinci: string | null;
} {
  let s = String(raw ?? "").trim();
  const ikinci = parantezKisi(s);
  s = s.replace(/\([^)]*\)/g, "").trim();
  if (!s || s === "0" || s === "-") return { ad: null, tel: null, ikinci };

  const m = s.match(/\d/);
  if (!m || m.index === undefined) {
    return { ad: s.replace(/-\s*$/, "").trim() || null, tel: null, ikinci };
  }
  let ad = s.slice(0, m.index).replace(/[-–]\s*$/, "").trim();
  let tel: string | null = s
    .slice(m.index)
    .replace(/[^\d,]/g, "")
    .split(",")
    .filter(Boolean)
    .map((t) => (t.length === 10 && t.startsWith("5") ? "0" + t : t))
    .join(", ");
  if (!tel || tel === "0") tel = null;
  if (!ad && ikinci) ad = ikinci;
  return { ad: ad || null, tel, ikinci };
}

export function mahalleCikar(adres: unknown): string | null {
  const s = String(adres ?? "");
  const m = s.match(
    /([A-Za-zÇĞİÖŞÜÂÎÛçğıöşüâîû0-9.\- ]+?)\s*(Mahallesi|Mah\.|Mh\.|MAH\.|MAHALLESİ|Mah\b)/i
  );
  if (!m) return null;
  let ad = m[1].trim();
  // cadde/sokak/bulvar adi mahalleden once geliyorsa sadece son parcayi al
  const parcalar = ad.split(/(?:Cad\.|Caddesi|Cd\.|Sok\.|Sokak|Sk\.|Blv\.|Bulvar[ıi]?|Bul\.)/i);
  ad = parcalar[parcalar.length - 1].trim();
  ad = ad.replace(/^[,.\-\d\s/]+/, "").trim();
  if (!ad) return null;
  return ad
    .toLocaleLowerCase("tr-TR")
    .split(/\s+/)
    .map((k) => k.charAt(0).toLocaleUpperCase("tr-TR") + k.slice(1))
    .join(" ");
}

export function durumEsle(raw: unknown): DestekDurumuDb {
  const key = String(raw ?? "").trim().toLocaleLowerCase("tr-TR");
  return DURUM_ESLEME[key] ?? "gorusulmedi";
}
