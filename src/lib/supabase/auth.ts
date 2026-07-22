import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import { getSupabaseEnv } from "./client";
import { getSupabaseServerClient } from "./server";
import type { AppRole } from "./types";
import { mapAuthError } from "@/lib/auth/errors";

export type AuthState = {
  user: { id: string; email: string };
  roles: AppRole[];
  firstName: string;
  lastName: string;
} | null;

// Stato di autenticazione letto dai cookie della richiesta. Se Supabase non è
// ancora configurato il sito pubblico deve comunque funzionare: torna null.
export const fetchAuthState = createServerFn({ method: "GET" }).handler(
  async (): Promise<AuthState> => {
    if (!getSupabaseEnv()) return null;
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const [rolesRes, profileRes] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", user.id),
      supabase.from("profiles").select("first_name, last_name").eq("id", user.id).maybeSingle(),
    ]);

    return {
      user: { id: user.id, email: user.email ?? "" },
      roles: (rolesRes.data ?? []).map((r) => r.role),
      firstName: profileRes.data?.first_name ?? "",
      lastName: profileRes.data?.last_name ?? "",
    };
  },
);

// Guardia per i beforeLoad delle aree riservate.
export function requireRole(auth: AuthState, role: AppRole, currentHref: string) {
  if (!auth) {
    throw redirect({ to: "/login", search: { next: currentHref } });
  }
  if (!auth.roles.includes(role)) {
    throw redirect({ to: "/non-autorizzato" });
  }
  return auth;
}

// Area di destinazione dopo il login, in base al ruolo più alto.
export function roleHome(auth: NonNullable<AuthState>): string {
  if (auth.roles.includes("admin")) return "/area-admin";
  if (auth.roles.includes("staff")) return "/area-staff";
  return "/area-genitori";
}

// Traduzione errori auth: delega a mapAuthError (accetta stringa o oggetto).
export function translateAuthError(message: string): string {
  return mapAuthError(message).message;
}
