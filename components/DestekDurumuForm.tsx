"use client";

import { useRef } from "react";
import { DESTEK_DURUMLARI, type DestekDurumu } from "@/lib/constants";

export function DestekDurumuForm({
  action,
  mevcutDurum,
}: {
  action: (formData: FormData) => void;
  mevcutDurum: DestekDurumu;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-2">
      <label className="text-xs font-medium text-slate-500">Destek Durumu</label>
      <select
        name="durum"
        defaultValue={mevcutDurum}
        onChange={() => formRef.current?.requestSubmit()}
        className="h-12 w-full rounded-lg border border-slate-300 px-3 text-base"
      >
        {Object.entries(DESTEK_DURUMLARI).map(([key, info]) => (
          <option key={key} value={key}>
            {info.dot} {info.label}
          </option>
        ))}
      </select>
    </form>
  );
}
