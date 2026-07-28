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
  { href: "/", label: "Ana Sayfa", icon: "🏠", roller: ["admin", "saha", "telefon", "grup_sorumlusu", "secim_gunu"] },
  { href: "/firmalar", label: "Firmalar", icon: "🏢", roller: ["admin", "saha", "telefon", "grup_sorumlusu"] },
  { href: "/gorevler", label: "Görevler", icon: "✅", roller: ["admin", "saha", "telefon"] },
  { href: "/raporlar", label: "Raporlar", icon: "📊", roller: ["admin", "grup_sorumlusu"] },
  { href: "/secim-gunu", label: "Seçim Günü", icon: "🗳️", roller: ["admin", "secim_gunu"] },
  { href: "/yonetim", label: "Yönetim", icon: "⚙️", roller: ["admin"] },
];

export function BottomNav({ rol }: { rol: UserRole }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roller.includes(rol));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-2xl">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
                  active ? "text-slate-900" : "text-slate-400"
                }`}
              >
                <span className="text-xl leading-none">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
