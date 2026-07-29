import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { DestekBadge } from "@/components/DestekBadge";
import type { DestekDurumu } from "@/lib/constants";

type FirmaOzet = { id: string; firma_unvani: string; destek_durumu: string };
type KisiKaydi = {
  id: string;
  ad_soyad: string;
  telefon: string | null;
  etiket: string | null;
  firmalar: FirmaOzet | null;
};

export default async function KisiDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: kisiData } = await supabase
    .from("kisiler")
    .select("id, ad_soyad, telefon, etiket, firmalar(id, firma_unvani, destek_durumu)")
    .eq("id", id)
    .single();

  const kisi = kisiData as unknown as KisiKaydi | null;
  if (!kisi) notFound();

  // Ayni isimli (veya ayni telefonlu) diger kisi kayitlari -> bagli oldugu diger firmalar
  const baglantiKosullari = [`ad_soyad.eq.${kisi.ad_soyad}`];
  if (kisi.telefon) baglantiKosullari.push(`telefon.eq.${kisi.telefon}`);

  const [{ data: digerKayitlarData }, { data: referansFirmalariData }] = await Promise.all([
    supabase
      .from("kisiler")
      .select("id, ad_soyad, telefon, etiket, firmalar(id, firma_unvani, destek_durumu)")
      .or(baglantiKosullari.join(","))
      .neq("id", id)
      .limit(50),
    supabase
      .from("firmalar")
      .select("id, firma_unvani, destek_durumu")
      .ilike("referans", `%${kisi.ad_soyad}%`)
      .order("firma_unvani")
      .limit(100),
  ]);

  const digerKayitlar = (digerKayitlarData ?? []) as unknown as KisiKaydi[];
  const referansFirmalari = (referansFirmalariData ?? []) as unknown as FirmaOzet[];

  return (
    <div className="flex flex-1 flex-col">
      <Header profile={profile} title={kisi.ad_soyad} />
      <div className="mx-auto w-full max-w-2xl md:max-w-4xl flex-1 space-y-4 p-4">
        <Link href="/kisiler" className="text-sm text-slate-500">
          ← Kişi listesine dön
        </Link>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{kisi.ad_soyad}</h2>
              <p className="text-sm text-slate-500">
                {kisi.etiket ?? "kişi"}
                {kisi.telefon ? ` · ${kisi.telefon}` : ""}
              </p>
            </div>
            {kisi.telefon && (
              <a
                href={`tel:${kisi.telefon}`}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white"
              >
                📞 Ara
              </a>
            )}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Bağlı Olduğu Firmalar</h3>
          <ul className="space-y-2">
            {kisi.firmalar && (
              <li>
                <FirmaSatiri firma={kisi.firmalar} etiket={kisi.etiket} />
              </li>
            )}
            {digerKayitlar
              .filter((d) => d.firmalar)
              .map((d) => (
                <li key={d.id}>
                  <FirmaSatiri firma={d.firmalar!} etiket={d.etiket} />
                </li>
              ))}
            {!kisi.firmalar && digerKayitlar.length === 0 && (
              <li className="text-sm text-slate-500">Firma bağlantısı yok.</li>
            )}
          </ul>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Referansı Olduğu Firmalar</h3>
            {referansFirmalari.length > 0 && (
              <Link
                href={`/firmalar?referans=${encodeURIComponent(kisi.ad_soyad)}`}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Takipte gör →
              </Link>
            )}
          </div>
          {referansFirmalari.length === 0 ? (
            <p className="text-sm text-slate-500">Referansı olduğu firma kaydı yok.</p>
          ) : (
            <>
              <p className="mb-2 text-xs text-slate-400">{referansFirmalari.length} firma</p>
              <ul className="space-y-2">
                {referansFirmalari.slice(0, 20).map((f) => (
                  <li key={f.id}>
                    <FirmaSatiri firma={f} etiket={null} />
                  </li>
                ))}
              </ul>
              {referansFirmalari.length > 20 && (
                <Link
                  href={`/firmalar?referans=${encodeURIComponent(kisi.ad_soyad)}`}
                  className="mt-2 block text-center text-sm text-slate-500 underline"
                >
                  Tümünü Genel Takip&apos;te listele ({referansFirmalari.length})
                </Link>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function FirmaSatiri({ firma, etiket }: { firma: FirmaOzet; etiket: string | null }) {
  return (
    <Link
      href={`/firmalar/${firma.id}`}
      className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 p-2.5 hover:bg-slate-50"
    >
      <p className="min-w-0 truncate text-sm font-medium text-slate-900">
        {firma.firma_unvani}
        {etiket && <span className="ml-1.5 text-xs font-normal text-slate-400">({etiket})</span>}
      </p>
      <DestekBadge durum={firma.destek_durumu as DestekDurumu} />
    </Link>
  );
}
