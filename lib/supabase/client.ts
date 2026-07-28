import { createBrowserClient } from "@supabase/ssr";

// Not: Database generic tipi bilincli olarak kullanilmiyor. Supabase-js'in
// embedded-select tip cikarimi (select-query-parser) tam Relationships
// metadata'si gerektiriyor; onu elle senkronize tutmak yerine satir tipleri
// (lib/database.types.ts) sorgu sonuclarinda elle cast icin kullaniliyor.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
