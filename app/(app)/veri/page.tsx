import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { Header } from "@/components/Header";
import { IceAktarForm } from "@/components/IceAktarForm";

// Buyuk Excel dosyalarinin (8k+ satir) islenmesi icin sure siniri yukseltildi
export const maxDuration = 60;

export default async function VeriPage() {
  const profile = await requireAdmin();

  return (
    <div className="flex flex-1 flex-col">
      <Header profile={profile} title="Excel İçe / Dışa Aktarma" />
      <div className="mx-auto w-full max-w-2xl md:max-w-4xl flex-1 space-y-3 p-4">
        <Link href="/yonetim" className="text-sm text-slate-500">
          ← Yönetim paneline dön
        </Link>

        <a
          href="/veri/export"
          className="block rounded-xl bg-slate-900 p-4 text-center text-base font-medium text-white shadow-sm"
        >
          📥 Tüm Firmaları Excel Olarak İndir
        </a>

        <IceAktarForm />

        <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
          <p className="mb-1 font-medium">Desteklenen iki dosya biçimi:</p>
          <p className="mb-2">
            <strong>1) Eski kampanya listesi</strong> (Firma Ünvanı, Adresi, Yetkili - Tel, Sicil No,
            Meslek Grubu, Durumu, Referansı, Not): olduğu gibi yükleyin — firma ünvanı temizlenir,
            yetkili adı ile telefonu ayrıştırılıp kişi kaydı açılır, adresten mahalle çıkarılır,
            durumlar eşlenir.
          </p>
          <p className="mb-2">
            <strong>2) Şablon biçimi</strong>: Firma Unvanı, Yetkili Kişi, Yetkili Telefon, Meslek
            Grubu, Vergi No, Oda Sicil No, Oy Kullanacak Kişi, Yetki Belgesi Durumu, Aidat/Engel
            Durumu, Adres, Mahalle, Referans, Soyisim Grubu, Destek Durumu, Notlar
          </p>
          <p>
            Sicil numarası zaten kayıtlı olan satırlar atlanır — aynı dosyayı iki kez yüklemek
            mükerrer kayıt oluşturmaz.
          </p>
        </div>
      </div>
    </div>
  );
}
