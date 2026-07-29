"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/lib/database.types";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  roller: UserRole[];
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Ana Sayfa", icon: "🏠", roller: ["admin", "yonetici", "temsilci", "saha", "telefon", "grup_sorumlusu", "secim_gunu"] },
  { href: "/firmalar", label: "Firmalar", icon: "🏢", roller: ["admin", "yonetici", "temsilci", "saha", "telefon", "grup_sorumlusu"] },
  { href: "/kisiler", label: "Kişiler", icon: "👤", roller: ["admin", "yonetici", "temsilci", "saha", "telefon", "grup_sorumlusu"] },
  { href: "/gorevler", label: "Görevler", icon: "✅", roller: ["admin", "yonetici", "temsilci", "saha", "telefon", "grup_sorumlusu"] },
  { href: "/raporlar", label: "Raporlar", icon: "📊", roller: ["admin", "yonetici", "grup_sorumlusu"] },
  { href: "/secim-gunu", label: "Seçim Günü", icon: "🗳️", roller: ["admin", "yonetici", "secim_gunu"] },
  { href: "/yonetim", label: "Yönetim", icon: "⚙️", roller: ["admin"] },
];

export function BottomNav({ rol }: { rol: UserRole }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roller.includes(rol));

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Mobil: alt menu */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        <ul className="mx-auto flex max-w-2xl">
          {items.map((item) => (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
                  isActive(item.href) ? "text-slate-900" : "text-slate-400"
                }`}
              >
                <span className="text-xl leading-none">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Masaustu: sol kenar menu */}
      <nav className="fixed inset-y-0 left-0 z-20 hidden w-56 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="border-b border-slate-100 px-4 py-4">
          <p className="text-sm font-semibold text-slate-900">BATSO Kampanya</p>
          <p className="text-sm font-medium text-slate-700">Ferdi Kurt</p>
          <p className="text-xs text-slate-400">Başkan Adayımız</p>
        </div>
        <ul className="flex-1 space-y-1 p-3">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isActive(item.href)
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span className="text-lg leading-none">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
