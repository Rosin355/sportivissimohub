import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

export function getSupabaseEnv() {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  // Lovable Cloud committa la publishable key con questo nome; in setup
  // manuali si usa la classica anon key. Sono equivalenti per il client.
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ??
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) as string | undefined;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

// Client per il browser: la sessione vive nei cookie (via @supabase/ssr), così
// anche l'SSR e le server function la vedono.
export function getSupabaseBrowserClient() {
  if (!browserClient) {
    const env = getSupabaseEnv();
    if (!env) {
      throw new Error(
        "Supabase non configurato: imposta VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (vedi .env.example).",
      );
    }
    browserClient = createBrowserClient<Database>(env.url, env.anonKey);
  }
  return browserClient;
}
