import { DESTEK_DURUMLARI, type DestekDurumu } from "@/lib/constants";

export function DestekBadge({ durum }: { durum: DestekDurumu }) {
  const info = DESTEK_DURUMLARI[durum];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: info.bg, color: info.color }}
    >
      <span>{info.dot}</span>
      {info.label}
    </span>
  );
}
