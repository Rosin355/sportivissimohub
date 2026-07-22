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
import { Input } from "@/components/ui/input";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/supabase/auth";
import { KeyRound } from "lucide-react";

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
    password: z.string().min(8, "La password deve avere almeno 8 caratteri."),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Le password non coincidono.",
    path: ["confirm"],
  });

function UpdatePasswordPage() {
  const router = useRouter();
  const { queryClient } = Route.useRouteContext();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    setError(null);
    const supabase = getSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({ password: values.password });
    if (updateError) {
      setError(translateAuthError(updateError.message));
      return;
    }
    queryClient.removeQueries({ queryKey: ["auth-state"] });
    await router.invalidate();
    router.history.push("/area-genitori");
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
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
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
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && (
                <div className="bg-flame/10 border border-flame/30 text-flame rounded-xl px-4 py-3 text-sm font-semibold">
                  {error}{" "}
                  <Link to="/password-dimenticata" className="underline">
                    Richiedi un nuovo link
                  </Link>
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
