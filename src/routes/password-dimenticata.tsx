import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
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
import { KeyRound, MailCheck } from "lucide-react";

export const Route = createFileRoute("/password-dimenticata")({
  head: () => ({
    meta: [
      { title: "Password dimenticata — Sportivissimo" },
      { name: "description", content: "Recupera la password del tuo account Sportivissimo." },
    ],
  }),
  component: ForgotPasswordPage,
});

const schema = z.object({
  email: z.string().email("Inserisci un'email valida."),
});

function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    setError(null);
    const supabase = getSupabaseBrowserClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/aggiorna-password`,
    });
    if (resetError) {
      setError(translateAuthError(resetError.message));
      return;
    }
    setSent(true);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold">Password dimenticata</h1>
          <p className="text-muted-foreground mt-2">
            Ti invieremo un link per impostare una nuova password.
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-border shadow-pop p-6 md:p-8">
          {sent ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-xl bg-gradient-grass text-grass-foreground grid place-items-center mx-auto mb-4">
                <MailCheck className="w-7 h-7" />
              </div>
              <h2 className="font-display text-2xl font-bold">Email inviata</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Se l'indirizzo è registrato riceverai un link per reimpostare la password. Controlla
                anche la cartella spam.
              </p>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          autoComplete="email"
                          placeholder="nome@esempio.it"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {error && (
                  <div className="bg-flame/10 border border-flame/30 text-flame rounded-xl px-4 py-3 text-sm font-semibold">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-display font-bold bg-gradient-royal text-primary-foreground shadow-sticker hover:scale-[1.02] transition-transform disabled:opacity-60 disabled:hover:scale-100"
                >
                  <KeyRound className="w-4 h-4" />
                  {form.formState.isSubmitting ? "Invio in corso…" : "Invia link di recupero"}
                </button>
              </form>
            </Form>
          )}
          <p className="text-center text-sm mt-4">
            <Link to="/login" className="font-semibold text-muted-foreground hover:text-foreground">
              ← Torna all'accesso
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
