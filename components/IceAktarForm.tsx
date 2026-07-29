"use client";

import { useActionState } from "react";
import { iceAktar, type IceAktarSonucu } from "@/app/(app)/veri/actions";

const BASLANGIC: IceAktarSonucu = { status: "idle", eklenen: 0, atlanan: 0, kisiEklenen: 0, hatalar: [] };

export function IceAktarForm() {
  const [state, action, pending] = useActionState(iceAktar, BASLANGIC);

  return (
    <form action={action} className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm">
      <label className="text-sm font-semibold text-slate-700">Excel Dosyası Yükle</label>
      <input
        type="file"
        name="dosya"
        accept=".xlsx,.xls,.csv"
        required
        className="rounded-lg border border-slate-300 p-2 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="h-12 rounded-lg bg-slate-900 text-base font-medium text-white disabled:opacity-50"
      >
        {pending ? "Yükleniyor..." : "İçe Aktar"}
      </button>

      {state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}
      {state.status === "ok" && (
        <div className="text-sm text-slate-700">
          <p className="font-medium text-green-700">
            {state.eklenen} firma eklendi{state.kisiEklenen > 0 && `, ${state.kisiEklenen} kişi kaydı oluşturuldu`}.
          </p>
          {state.atlanan > 0 && (
            <p className="text-slate-500">
              {state.atlanan} satır zaten kayıtlı olduğu için atlandı (sicil no eşleşti).
            </p>
          )}
          {state.message && <p className="text-slate-500">{state.message}</p>}
          {state.hatalar.length > 0 && (
            <ul className="mt-2 list-disc pl-4 text-red-600">
              {state.hatalar.slice(0, 20).map((h, i) => (
                <li key={i}>
                  Satır {h.satir}: {h.hata}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}
