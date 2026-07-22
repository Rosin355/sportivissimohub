import { createServerClient } from "@supabase/ssr";
import { getCookies, setCookie } from "@tanstack/react-start/server";
import { getSupabaseEnv } from "./client";
import type { Database } from "./types";

// Client per SSR e server function: legge/scrive la sessione nei cookie della
// richiesta corrente. Usa sempre la anon key: la sicurezza sta nelle RLS.
export function getSupabaseServerClient() {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error(
      "Supabase non configurato: imposta VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (vedi .env.example).",
    );
  }
  return createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return Object.entries(getCookies()).map(([name, value]) => ({ name, value }));
      },
      setAll(cookies) {
        for (const cookie of cookies) {
          setCookie(cookie.name, cookie.value, cookie.options);
        }
      },
    },
  });
}
