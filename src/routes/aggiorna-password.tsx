import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PasswordInput } from "@/components/site/PasswordInput";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { mapAuthError, type MappedAuthError } from "@/lib/auth/errors";
import {
  passwordRequirements,
  passwordMeetsRequirements,
  passwordStrength,
} from "@/lib/auth/password";
import { KeyRound, Check, Circle } from "lucide-react";

// Pagina di destinazione del link email di recupero password: la sessione di
// recovery viene aperta automaticamente dal client Supabase (?code=... in URL).
export const Route = createFileRoute("/aggiorna-password")({
  head: () => ({
    meta: [
      { title: "Nuova password — Sportivissimo" },
      { name: "description", content: "Imposta una nuova password per il tuo account." },
    ],
  }),
  component: UpdatePasswordPage,
});

const schema = z
  .object({
    password: z
      .string()
      .refine(passwordMeetsRequirements, "La password non rispetta i requisiti indicati."),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Le password non coincidono.",
    path: ["confirm"],
  });

function UpdatePasswordPage() {
  const router = useRouter();
  const { queryClient } = Route.useRouteContext();
  const [error, setError] = useState<MappedAuthError | null>(null);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  });
  const passwordValue = form.watch("password");

  async function onSubmit(values: z.infer<typeof schema>) {
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password: values.password });
      if (updateError) {
        setError(mapAuthError(updateError));
        return;
      }
      queryClient.removeQueries({ queryKey: ["auth-state"] });
      await router.invalidate();
      router.history.push("/area-genitori");
    } catch (e) {
      setError(mapAuthError(e as Error));
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold">Nuova password</h1>
          <p className="text-muted-foreground mt-2">Scegli la nuova password per il tuo account.</p>
        </div>

        <div className="rounded-2xl bg-white border border-border shadow-pop p-6 md:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Nuova password</FormLabel>
                    <FormControl>
                      <PasswordInput autoComplete="new-password" {...field} />
                    </FormControl>
                    <StrengthBar value={passwordValue} />
                    <PasswordChecklist value={passwordValue} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Conferma password</FormLabel>
                    <FormControl>
                      <PasswordInput autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && (
                <div className="bg-flame/10 border border-flame/30 text-flame rounded-xl px-4 py-3 text-sm font-semibold">
                  {error.message}
                  {(error.kind === "session_missing" || error.kind === "unknown") && (
                    <>
                      {" "}
                      <Link to="/password-dimenticata" className="underline">
                        Richiedi un nuovo link
                      </Link>
                    </>
                  )}
                </div>
              )}
              <button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-display font-bold bg-gradient-royal text-primary-foreground shadow-sticker hover:scale-[1.02] transition-transform disabled:opacity-60 disabled:hover:scale-100"
              >
                <KeyRound className="w-4 h-4" />
                {form.formState.isSubmitting ? "Salvataggio…" : "Salva nuova password"}
              </button>
            </form>
          </Form>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function PasswordChecklist({ value }: { value: string }) {
  return (
    <ul className="mt-2 space-y-1 text-sm" aria-live="polite">
      {passwordRequirements.map((r) => {
        const ok = r.test(value);
        return (
          <li
            key={r.id}
            className={ok ? "flex items-center gap-2 text-grass" : "flex items-center gap-2 text-muted-foreground"}
          >
            {ok ? <Check className="w-4 h-4" /> : <Circle className="w-3 h-3" />}
            <span>{r.label}</span>
          </li>
        );
      })}
    </ul>
  );
}

function StrengthBar({ value }: { value: string }) {
  const s = passwordStrength(value);
  if (s.tone === "empty") return null;
  const toneClass =
    s.tone === "strong" ? "bg-grass" : s.tone === "medium" ? "bg-sun" : "bg-flame";
  const toneText =
    s.tone === "strong" ? "text-grass" : s.tone === "medium" ? "text-sun-foreground" : "text-flame";
  return (
    <div className="mt-2">
      <div className="flex gap-1" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= s.score ? toneClass : "bg-muted"}`} />
        ))}
      </div>
      <p className={`mt-1 text-xs font-semibold ${toneText}`}>Robustezza: {s.label}</p>
    </div>
  );
}
