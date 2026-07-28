import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { Header } from "@/components/Header";
import { IceAktarForm } from "@/components/IceAktarForm";

export default async function VeriPage() {
  const profile = await requireAdmin();

  return (
    <div className="flex flex-1 flex-col">
      <Header profile={profile} title="Excel İçe / Dışa Aktarma" />
      <div className="mx-auto w-full max-w-2xl flex-1 space-y-3 p-4">
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
          <p className="font-medium">Beklenen sütun başlıkları:</p>
          <p>
            Firma Unvanı, Yetkili Kişi, Yetkili Telefon, Meslek Grubu, Vergi No, Oda Sicil No, Oy
            Kullanacak Kişi, Yetki Belgesi Durumu, Aidat/Engel Durumu, Adres, Soyisim Grubu, Destek
            Durumu, Notlar
          </p>
        </div>
      </div>
    </div>
  );
}
