import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/lib/database.types";

export const requireProfile = cache(async (): Promise<ProfileRow> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  return profile;
});

export async function requireAdmin(): Promise<ProfileRow> {
  const profile = await requireProfile();
  if (profile.rol !== "admin") {
    redirect("/");
  }
  return profile;
}
