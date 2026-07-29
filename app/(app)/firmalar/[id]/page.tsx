import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { DestekDurumuForm } from "@/components/DestekDurumuForm";
import { GORUSME_TIPI, DESTEK_DURUMLARI, type DestekDurumu } from "@/lib/constants";
import type { FirmaRow, GorusmeRow } from "@/lib/database.types";
import { destekDurumuGuncelle, gorusmeEkle, gorevAta } from "./actions";

type KisiOzet = { ad_soyad: string | null; email: string } | null;
type FirmaKisi = { id: string; ad_soyad: string; telefon: string | null; etiket: string | null };
type FirmaDetay = FirmaRow & {
  meslek_gruplari: { ad: string } | null;
  ana_sorumlu: KisiOzet;
  ikinci_baglanti: KisiOzet;
};
type GorusmeDetay = GorusmeRow & { gorusen: KisiOzet };
type IliskiliKisi = { id: string; firma_unvani: string; yetkili_kisi: string | null; destek_durumu: string };

export default async function FirmaDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: firmaData } = await supabase
    .from("firmalar")
    .select(
      "*, meslek_gruplari(ad), ana_sorumlu:ana_sorumlu_id(ad_soyad, email), ikinci_baglanti:ikinci_baglanti_id(ad_soyad, email)"
    )
    .eq("id", id)
    .single();

  const firma = firmaData as unknown as FirmaDetay | null;
  if (!firma) notFound();

  const [{ data: gorusmelerData }, { data: iliskiliKisilerData }, { data: kisilerData }] =
    await Promise.all([
      supabase
        .from("gorusmeler")
        .select("*, gorusen:gorusen_id(ad_soyad, email)")
        .eq("firma_id", id)
        .order("created_at", { ascending: false }),
      firma.soyisim_grubu
        ? supabase
            .from("firmalar")
            .select("id, firma_unvani, yetkili_kisi, destek_durumu")
            .eq("soyisim_grubu", firma.soyisim_grubu)
            .neq("id", id)
        : Promise.resolve({ data: [] as IliskiliKisi[] }),
      supabase
        .from("kisiler")
        .select("id, ad_soyad, telefon, etiket")
        .eq("firma_id", id)
        .order("created_at"),
    ]);

  const gorusmeler = gorusmelerData as unknown as GorusmeDetay[] | null;
  const iliskiliKisiler = iliskiliKisilerData as unknown as IliskiliKisi[] | null;
  const kisiler = (kisilerData ?? []) as unknown as FirmaKisi[];

  let profiller: { id: string; ad_soyad: string | null; email: string }[] = [];
  if (profile.rol === "admin") {
    const { data } = await supabase
      .from("profiles")
      .select("id, ad_soyad, email")
      .eq("aktif", true)
      .order("ad_soyad");
    profiller = data ?? [];
  }

  const destekDurumuAction = destekDurumuGuncelle.bind(null, id);
  const gorusmeEkleAction = gorusmeEkle.bind(null, id);
  const gorevAtaAction = gorevAta.bind(null, id);

  return (
    <div className="flex flex-1 flex-col">
      <Header profile={profile} title={firma.firma_unvani} />
      <div className="mx-auto w-full max-w-2xl md:max-w-4xl flex-1 space-y-4 p-4">
        <Link href="/firmalar" className="text-sm text-slate-500">
          ← Firma listesine dön
        </Link>

        <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{firma.firma_unvani}</h2>
            <p className="text-sm text-slate-500">{firma.meslek_gruplari?.ad ?? "Meslek grubu atanmamış"}</p>
          </div>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
            <Info label="Yetkili Kişi" value={firma.yetkili_kisi} />
            <Info label="Yetkili Telefon" value={firma.yetkili_telefon} />
            <Info label="Oy Kullanacak Kişi" value={firma.oy_kullanacak_kisi} />
            <Info label="Yetki Belgesi Durumu" value={firma.yetki_belgesi_durumu} />
            <Info label="Vergi No" value={firma.vergi_no} />
            <Info label="Oda Sicil No" value={firma.oda_sicil_no} />
            <Info label="Aidat/Engel Durumu" value={firma.aidat_engel_durumu} />
            <Info label="Mahalle" value={firma.mahalle} />
            <Info label="Referans" value={firma.referans} />
            <Info label="Adres" value={firma.adres} />
          </dl>
          {kisiler.length > 0 && (
            <div className="rounded-lg bg-slate-50 p-2">
              <p className="mb-1 text-xs font-medium text-slate-500">Kişiler</p>
              <ul className="space-y-1">
                {kisiler.map((k) => (
                  <li key={k.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-800">
                      {k.ad_soyad}
                      {k.etiket && <span className="ml-1 text-xs text-slate-400">({k.etiket})</span>}
                    </span>
                    {k.telefon && (
                      <a href={`tel:${k.telefon}`} className="text-slate-600 underline">
                        {k.telefon}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {firma.notlar && (
            <p className="rounded-lg bg-slate-50 p-2 text-sm text-slate-600">📝 {firma.notlar}</p>
          )}
        </section>

        <section className="rounded-xl bg-white p-4 shadow-sm">
          <DestekDurumuForm action={destekDurumuAction} mevcutDurum={firma.destek_durumu as DestekDurumu} />
        </section>

        {iliskiliKisiler && iliskiliKisiler.length > 0 && (
          <section className="rounded-xl bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">
              Aynı soyisimden bağlantılı kişiler
            </h3>
            <ul className="space-y-1">
              {iliskiliKisiler.map((k) => (
                <li key={k.id}>
                  <Link href={`/firmalar/${k.id}`} className="text-sm text-slate-700 underline">
                    {k.firma_unvani} {k.yetkili_kisi ? `(${k.yetkili_kisi})` : ""} —{" "}
                    {DESTEK_DURUMLARI[k.destek_durumu as DestekDurumu].label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700">Görev / Sorumlu</h3>
          {profile.rol === "admin" ? (
            <form action={gorevAtaAction} className="flex flex-col gap-2">
              <label className="text-xs text-slate-500">Ana Sorumlu</label>
              <select
                name="ana_sorumlu_id"
                defaultValue={firma.ana_sorumlu_id ?? ""}
                className="h-11 rounded-lg border border-slate-300 px-2 text-sm"
              >
                <option value="">Seçilmedi</option>
                {profiller.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.ad_soyad || p.email}
                  </option>
                ))}
              </select>
              <label className="text-xs text-slate-500">İkinci Bağlantı</label>
              <select
                name="ikinci_baglanti_id"
                defaultValue={firma.ikinci_baglanti_id ?? ""}
                className="h-11 rounded-lg border border-slate-300 px-2 text-sm"
              >
                <option value="">Seçilmedi</option>
                {profiller.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.ad_soyad || p.email}
                  </option>
                ))}
              </select>
              <label className="text-xs text-slate-500">Referans</label>
              <input
                name="referans"
                defaultValue={firma.referans ?? ""}
                className="h-11 rounded-lg border border-slate-300 px-2 text-sm"
              />
              <label className="text-xs text-slate-500">Mahalle</label>
              <input
                name="mahalle"
                defaultValue={firma.mahalle ?? ""}
                className="h-11 rounded-lg border border-slate-300 px-2 text-sm"
              />
              <label className="text-xs text-slate-500">Aile / Dostluk İlişkisi Notu</label>
              <input
                name="aile_dostluk_notu"
                defaultValue={firma.aile_dostluk_notu ?? ""}
                className="h-11 rounded-lg border border-slate-300 px-2 text-sm"
              />
              <label className="text-xs text-slate-500">Bekleyen Görev</label>
              <input
                name="bekleyen_gorev"
                defaultValue={firma.bekleyen_gorev ?? ""}
                className="h-11 rounded-lg border border-slate-300 px-2 text-sm"
              />
              <button type="submit" className="h-11 rounded-lg bg-slate-900 text-sm font-medium text-white">
                Kaydet
              </button>
            </form>
          ) : (
            <div className="text-sm text-slate-600">
              <p>Ana sorumlu: {firma.ana_sorumlu?.ad_soyad || firma.ana_sorumlu?.email || "Atanmamış"}</p>
              <p>İkinci bağlantı: {firma.ikinci_baglanti?.ad_soyad || firma.ikinci_baglanti?.email || "-"}</p>
              {firma.aile_dostluk_notu && <p>Not: {firma.aile_dostluk_notu}</p>}
              {firma.bekleyen_gorev && <p className="text-amber-700">📌 {firma.bekleyen_gorev}</p>}
            </div>
          )}
        </section>

        <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700">Yeni Görüşme Ekle</h3>
          <form action={gorusmeEkleAction} className="flex flex-col gap-2">
            <select name="tip" defaultValue="telefon" className="h-11 rounded-lg border border-slate-300 px-2 text-sm">
              {Object.entries(GORUSME_TIPI).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <textarea
              name="sonuc"
              placeholder="Görüşme sonucu"
              className="min-h-20 rounded-lg border border-slate-300 p-2 text-sm"
            />
            <textarea
              name="talep_problem"
              placeholder="Talep / problem"
              className="min-h-16 rounded-lg border border-slate-300 p-2 text-sm"
            />
            <label className="text-xs text-slate-500">Tekrar arama tarihi</label>
            <input
              type="date"
              name="tekrar_arama_tarihi"
              className="h-11 rounded-lg border border-slate-300 px-2 text-sm"
            />
            <label className="text-xs text-slate-500">Destek durumunu güncelle (opsiyonel)</label>
            <select name="yeni_durum" defaultValue="" className="h-11 rounded-lg border border-slate-300 px-2 text-sm">
              <option value="">Değiştirme</option>
              {Object.entries(DESTEK_DURUMLARI).map(([key, info]) => (
                <option key={key} value={key}>
                  {info.dot} {info.label}
                </option>
              ))}
            </select>
            <button type="submit" className="h-12 rounded-lg bg-slate-900 text-base font-medium text-white">
              Görüşmeyi Kaydet
            </button>
          </form>
        </section>

        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Görüşme Geçmişi</h3>
          {(gorusmeler ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">Henüz görüşme kaydı yok.</p>
          ) : (
            <ul className="space-y-3">
              {gorusmeler!.map((g) => (
                <li key={g.id} className="border-b border-slate-100 pb-2 last:border-0">
                  <p className="text-xs text-slate-400">
                    {new Date(g.created_at).toLocaleString("tr-TR")} ·{" "}
                    {g.tip === "telefon" ? "Telefon" : "Yüz yüze"} ·{" "}
                    {g.gorusen?.ad_soyad || g.gorusen?.email || "-"}
                  </p>
                  {g.sonuc && <p className="text-sm text-slate-700">{g.sonuc}</p>}
                  {g.talep_problem && <p className="text-sm text-amber-700">Talep: {g.talep_problem}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="text-slate-800">{value || "-"}</dd>
    </div>
  );
}
