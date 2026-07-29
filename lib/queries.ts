import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const FIRMA_LISTE_SELECT =
  "id, firma_unvani, yetkili_kisi, yetkili_telefon, destek_durumu, bekleyen_gorev, tekrar_arama_tarihi, meslek_gruplari(ad)";

export async function getBekleyenGorevler(supabase: SupabaseServerClient, limit = 20) {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("firmalar")
    .select(FIRMA_LISTE_SELECT)
    .lte("tekrar_arama_tarihi", today)
    .order("tekrar_arama_tarihi", { ascending: true })
    .limit(limit * 3);

  // Kampanya onceligi: kararsizlar en uste, sonra tarihe gore
  const sirali = (data ?? []).sort((a, b) => {
    const aK = a.destek_durumu === "kararsiz" ? 0 : 1;
    const bK = b.destek_durumu === "kararsiz" ? 0 : 1;
    if (aK !== bK) return aK - bK;
    return String(a.tekrar_arama_tarihi ?? "").localeCompare(String(b.tekrar_arama_tarihi ?? ""));
  });
  return sirali.slice(0, limit);
}

export async function getGunlukGorusmeSayisi(supabase: SupabaseServerClient) {
  const baslangic = new Date();
  baslangic.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("gorusmeler")
    .select("id", { count: "exact", head: true })
    .gte("created_at", baslangic.toISOString());
  return count ?? 0;
}
