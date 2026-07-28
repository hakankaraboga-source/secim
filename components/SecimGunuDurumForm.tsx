"use client";

import { useRef } from "react";
import { SECIM_GUNU_DURUMLARI, type SecimGunuDurumu } from "@/lib/constants";

export function SecimGunuDurumForm({
  action,
  mevcutDurum,
}: {
  action: (formData: FormData) => void;
  mevcutDurum: SecimGunuDurumu;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action}>
      <select
        name="durum"
        defaultValue={mevcutDurum}
        onChange={(e) => {
          e.stopPropagation();
          formRef.current?.requestSubmit();
        }}
        onClick={(e) => e.stopPropagation()}
        style={{ color: SECIM_GUNU_DURUMLARI[mevcutDurum].color }}
        className="h-10 rounded-lg border border-slate-300 px-2 text-sm font-medium"
      >
        {Object.entries(SECIM_GUNU_DURUMLARI).map(([key, info]) => (
          <option key={key} value={key}>
            {info.label}
          </option>
        ))}
      </select>
    </form>
  );
}
