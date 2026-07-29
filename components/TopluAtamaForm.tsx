"use client";

import { useActionState } from "react";
import { topluAta, type AtamaSonucu } from "@/app/(app)/yonetim/atamalar/actions";
import { DESTEK_DURUMLARI } from "@/lib/constants";

const BASLANGIC: AtamaSonucu = { status: "idle", atanan: 0, sorumluAd: "", epostaDurumu: "" };

type Secenek = { id: string; ad: string };

export function TopluAtamaForm({
  sorumlular,
  meslekGruplari,
}: {
  sorumlular: Secenek[];
  meslekGruplari: Secenek[];
}) {
  const [state, action, pending] = useActionState(topluAta, BASLANGIC);

  return (
    <form action={action} className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700">Filtreye Göre Toplu Atama</h2>
      <p className="text-xs text-slate-500">
        Aşağıdaki ölçütlere uyan firmalar seçtiğiniz sorumluya atanır ve sorumluya e-posta gönderilir.
      </p>

      <label className="mt-1 text-xs text-slate-500">Sorumlu *</label>
      <select name="sorumlu_id" required className="h-11 rounded-lg border border-slate-300 px-2 text-sm">
        <option value="">Sorumlu seçin...</option>
        {sorumlular.map((s) => (
          <option key={s.id} value={s.id}>
            {s.ad}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Meslek grubu</label>
          <select name="grup" className="h-11 rounded-lg border border-slate-300 px-2 text-sm">
            <option value="">Fark etmez</option>
            {meslekGruplari.map((g) => (
              <option key={g.id} value={g.id}>
                {g.ad}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Destek durumu</label>
          <select name="durum" className="h-11 rounded-lg border border-slate-300 px-2 text-sm">
            <option value="">Fark etmez</option>
            {Object.entries(DESTEK_DURUMLARI).map(([key, info]) => (
              <option key={key} value={key}>
                {info.dot} {info.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Mahalle içerir</label>
          <input name="mahalle" className="h-11 rounded-lg border border-slate-300 px-3 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Referans içerir</label>
          <input name="referans" className="h-11 rounded-lg border border-slate-300 px-3 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">En fazla kaç firma? (boş = tümü)</label>
          <input
            type="number"
            name="adet"
            min={1}
            placeholder="örn. 50"
            className="h-11 rounded-lg border border-slate-300 px-3 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-600">
          <input type="checkbox" name="sadece_sorumsuz" defaultChecked />
          Sadece sorumlusu olmayanlar
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-1 h-12 rounded-xl bg-slate-900 text-base font-medium text-white disabled:opacity-50"
      >
        {pending ? "Atanıyor..." : "Firmaları Ata"}
      </button>

      {state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}
      {state.status === "ok" && (
        <div className="rounded-lg bg-green-50 p-2 text-sm text-green-800">
          <p>
            <strong>{state.atanan} firma</strong> {state.sorumluAd} adlı sorumluya atandı.
          </p>
          {state.epostaDurumu === "gonderildi" && <p>📧 Bilgilendirme e-postası gönderildi.</p>}
          {state.epostaDurumu === "anahtar_yok" && (
            <p className="text-amber-700">
              E-posta gönderilmedi: RESEND_API_KEY tanımlı değil (Vercel ortam değişkenlerine
              eklenince otomatik devreye girer).
            </p>
          )}
          {state.epostaDurumu === "hata" && (
            <p className="text-amber-700">E-posta gönderilemedi (servis hatası).</p>
          )}
        </div>
      )}
    </form>
  );
}
