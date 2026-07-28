import { requireProfile } from "@/lib/auth";
import { BottomNav } from "@/components/BottomNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();

  return (
    <div className="flex flex-1 flex-col pb-16 md:pb-0 md:pl-56">
      {children}
      <BottomNav rol={profile.rol} />
    </div>
  );
}
