import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { epostaGonder } from "@/lib/email";
import { smsGonder } from "@/lib/sms";
import { DESTEK_DURUMLARI, type DestekDurumu } from "@/lib/constants";

export const maxDuration = 60;

type TakipFirma = {
  id: string;
  firma_unvani: string;
  yetkili_kisi: string | null;
  yetkili_telefon: string | null;
  destek_durumu: string;
  tekrar_arama_tarihi: string | null;
  bekleyen_gorev: string | null;
};

// Kararsizlar once, sonra tarihe gore (kampanya onceligi)
function oncelikSirala(firmalar: TakipFirma[]): TakipFirma[] {
  return [...firmalar].sort((a, b) => {
    const aK = a.destek_durumu === "kararsiz" ? 0 : 1;
    const bK = b.destek_durumu === "kararsiz" ? 0 : 1;
    if (aK !== bK) return aK - bK;
    return (a.tekrar_arama_tarihi ?? "9999").localeCompare(b.tekrar_arama_tarihi ?? "9999");
  });
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ message: "Yetkisiz" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const bugun = new Date().toISOString().slice(0, 10);
  const dun = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: profiller } = await supabase
    .from("profiles")
    .select("id, ad_soyad, email, telefon, rol")
    .eq("aktif", true)
    .neq("rol", "secim_gunu");

  let epostaSayisi = 0;
  let smsSayisi = 0;

  // --- Sorumlulara gunluk gorev ozeti ---
  for (const p of profiller ?? []) {
    const { data, count } = await supabase
      .from("firmalar")
      .select(
        "id, firma_unvani, yetkili_kisi, yetkili_telefon, destek_durumu, tekrar_arama_tarihi, bekleyen_gorev",
        { count: "exact" }
      )
      .eq("ana_sorumlu_id", p.id)
      .or(`tekrar_arama_tarihi.lte.${bugun},bekleyen_gorev.not.is.null`)
      .limit(50);

    const toplam = count ?? 0;
    if (toplam === 0) continue;

    const liste = oncelikSirala((data ?? []) as TakipFirma[]).slice(0, 10);
    const ad = p.ad_soyad?.split(" ")[0] || "";

    const satirlar = liste
      .map((f) => {
        const durum = DESTEK_DURUMLARI[f.destek_durumu as DestekDurumu];
        return `<li><strong>${f.firma_unvani}</strong> — ${f.yetkili_kisi ?? "-"} ${
          f.yetkili_telefon ?? ""
        } <em>(${durum?.label ?? f.destek_durumu})</em>${
          f.bekleyen_gorev ? `<br/>📌 ${f.bekleyen_gorev}` : ""
        }</li>`;
      })
      .join("");

    const sonuc = await epostaGonder(
      p.email,
      `Bugün ${toplam} takip göreviniz var — BATSO Kampanya`,
      `<h2>Günaydın${ad ? ` ${ad}` : ""} 👋</h2>
       <p>Bugün <strong>${toplam} firma</strong> sizi bekliyor. Öncelikli ilk ${liste.length}:</p>
       <ol>${satirlar}</ol>
       <p><a href="https://www.batso.app/gorevler">Tüm listeyi uygulamada aç →</a></p>
       <p style="color:#64748b;font-size:12px">BATSO Seçim Kampanyası · Ferdi Kurt</p>`
    );
    if (sonuc === "gonderildi") epostaSayisi++;

    if (p.telefon) {
      const smsSonuc = await smsGonder(
        p.telefon,
        `BATSO Kampanya: Bugun ${toplam} takip goreviniz var. Liste: batso.app/gorevler`
      );
      if (smsSonuc === "gonderildi") smsSayisi++;
    }
  }

  // --- Yoneticilere gunluk rapor ---
  const [{ count: dunGorusme }, { data: aksiyon }, { data: genel }, { data: degisimler }] =
    await Promise.all([
      supabase.from("gorusmeler").select("id", { count: "exact", head: true }).gte("created_at", dun),
      supabase.from("aksiyon_ozet").select("*").single(),
      supabase.from("genel_ozet").select("*").single(),
      supabase.from("destek_durumu_gecmisi").select("yeni_durum").gte("created_at", dun),
    ]);

  const degisimSayilari = new Map<string, number>();
  for (const d of degisimler ?? []) {
    degisimSayilari.set(d.yeni_durum, (degisimSayilari.get(d.yeni_durum) ?? 0) + 1);
  }
  const degisimHtml =
    degisimSayilari.size === 0
      ? "<p>Son 24 saatte durum değişikliği yok.</p>"
      : `<ul>${[...degisimSayilari.entries()]
          .map(([durum, sayi]) => {
            const info = DESTEK_DURUMLARI[durum as DestekDurumu];
            return `<li>${info?.dot ?? ""} ${info?.label ?? durum}: <strong>+${sayi}</strong></li>`;
          })
          .join("")}</ul>`;

  const adminler = (profiller ?? []).filter((p) => p.rol === "admin" || p.rol === "yonetici");
  for (const a of adminler) {
    const sonuc = await epostaGonder(
      a.email,
      `Günlük Kampanya Raporu — ${new Date().toLocaleDateString("tr-TR")}`,
      `<h2>Günlük Kampanya Raporu</h2>
       <ul>
         <li>Son 24 saatte yapılan görüşme: <strong>${dunGorusme ?? 0}</strong></li>
         <li>🟢 Toplam kesin destek: <strong>${genel?.kesin_destek ?? 0}</strong></li>
         <li>🟡 Kararsız: <strong>${aksiyon?.kararsiz ?? 0}</strong></li>
         <li>⏰ Geciken takip: <strong>${aksiyon?.geciken ?? 0}</strong></li>
         <li>👤 Sorumlusu olmayan firma: <strong>${aksiyon?.sorumsuz ?? 0}</strong></li>
       </ul>
       <h3>Son 24 saatteki durum değişimleri</h3>
       ${degisimHtml}
       <p><a href="https://www.batso.app">Panoyu aç →</a></p>
       <p style="color:#64748b;font-size:12px">BATSO Seçim Kampanyası · Ferdi Kurt</p>`
    );
    if (sonuc === "gonderildi") epostaSayisi++;
  }

  return NextResponse.json({ ok: true, eposta: epostaSayisi, sms: smsSayisi });
}
