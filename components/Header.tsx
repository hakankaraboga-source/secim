import { KULLANICI_ROLLERI } from "@/lib/constants";
import type { ProfileRow } from "@/lib/database.types";
import { cikisYap } from "@/app/(app)/actions";

export function Header({ profile, title }: { profile: ProfileRow; title: string }) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-2xl md:max-w-4xl items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-slate-900">{title}</h1>
          <p className="text-xs text-slate-500">
            {profile.ad_soyad || profile.email} · {KULLANICI_ROLLERI[profile.rol]}
          </p>
        </div>
        <form action={cikisYap}>
          <button type="submit" className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600">
            Çıkış
          </button>
        </form>
      </div>
    </header>
  );
}
