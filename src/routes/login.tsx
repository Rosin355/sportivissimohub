import { useState } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { roleHome, translateAuthError } from "@/lib/supabase/auth";
import { LogIn, UserPlus, MailCheck } from "lucide-react";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { next?: string } => ({
    next: typeof search.next === "string" ? search.next : undefined,
  }),
  beforeLoad: ({ context }) => {
    if (context.auth) throw redirect({ href: roleHome(context.auth) });
  },
  head: () => ({
    meta: [
      { title: "Accedi — Sportivissimo" },
      { name: "description", content: "Accedi o registrati al portale Sportivissimo." },
    ],
  }),
  component: LoginPage,
});

const loginSchema = z.object({
  email: z.string().email("Inserisci un'email valida."),
  password: z.string().min(6, "La password deve avere almeno 6 caratteri."),
});

const registerSchema = z
  .object({
    firstName: z.string().min(1, "Inserisci il nome."),
    lastName: z.string().min(1, "Inserisci il cognome."),
    email: z.string().email("Inserisci un'email valida."),
    password: z.string().min(8, "La password deve avere almeno 8 caratteri."),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Le password non coincidono.",
    path: ["confirm"],
  });

function LoginPage() {
  const { next } = Route.useSearch();

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold">Bentornato!</h1>
          <p className="text-muted-foreground mt-2">
            Accedi o crea un account per gestire le iscrizioni.
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-border shadow-pop p-6 md:p-8">
          <Tabs defaultValue="accesso">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="accesso" className="font-display font-bold">
                <LogIn className="w-4 h-4 mr-2" /> Accedi
              </TabsTrigger>
              <TabsTrigger value="registrazione" className="font-display font-bold">
                <UserPlus className="w-4 h-4 mr-2" /> Registrati
              </TabsTrigger>
            </TabsList>
            <TabsContent value="accesso">
              <SignInForm next={next} />
            </TabsContent>
            <TabsContent value="registrazione">
              <SignUpForm next={next} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="bg-flame/10 border border-flame/30 text-flame rounded-xl px-4 py-3 text-sm font-semibold">
      {message}
    </div>
  );
}

// Dopo login/registrazione: azzera la cache auth, fai ripartire i beforeLoad e
// vai alla destinazione richiesta (solo path interni) o all'area del ruolo.
async function enterApp(
  router: ReturnType<typeof useRouter>,
  queryClient: QueryClient,
  next: string | undefined,
) {
  const supabase = getSupabaseBrowserClient();
  const { data: rolesData } = await supabase.from("user_roles").select("role");
  const roles = (rolesData ?? []).map((r) => r.role);
  const fallback = roles.includes("admin")
    ? "/area-admin"
    : roles.includes("staff")
      ? "/area-staff"
      : "/area-genitori";
  const dest = next && next.startsWith("/") ? next : fallback;
  queryClient.removeQueries({ queryKey: ["auth-state"] });
  await router.invalidate();
  router.history.push(dest);
}

function SignInForm({ next }: { next?: string }) {
  const router = useRouter();
  const { queryClient } = Route.useRouteContext();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setError(null);
    const supabase = getSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    if (signInError) {
      setError(translateAuthError(signInError.message));
      return;
    }
    await enterApp(router, queryClient, next);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold">Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" placeholder="nome@esempio.it" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold">Password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormError message={error} />
        <button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-display font-bold bg-gradient-royal text-primary-foreground shadow-sticker hover:scale-[1.02] transition-transform disabled:opacity-60 disabled:hover:scale-100"
        >
          <LogIn className="w-4 h-4" />
          {form.formState.isSubmitting ? "Accesso in corso…" : "Accedi"}
        </button>
        <p className="text-center text-sm">
          <Link
            to="/password-dimenticata"
            className="font-semibold text-muted-foreground hover:text-foreground"
          >
            Password dimenticata?
          </Link>
        </p>
      </form>
    </Form>
  );
}

function SignUpForm({ next }: { next?: string }) {
  const router = useRouter();
  const { queryClient } = Route.useRouteContext();
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "", confirm: "" },
  });

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    setError(null);
    const supabase = getSupabaseBrowserClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        // Letti dal trigger handle_new_user per creare la riga in profiles.
        data: { first_name: values.firstName, last_name: values.lastName },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    if (signUpError) {
      setError(translateAuthError(signUpError.message));
      return;
    }
    if (!data.session) {
      setConfirmationSent(true);
      return;
    }
    await enterApp(router, queryClient, next);
  }

  if (confirmationSent) {
    return (
      <div className="text-center py-6">
        <div className="w-14 h-14 rounded-xl bg-gradient-grass text-grass-foreground grid place-items-center mx-auto mb-4">
          <MailCheck className="w-7 h-7" />
        </div>
        <h2 className="font-display text-2xl font-bold">Controlla la tua email</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Ti abbiamo inviato un link di conferma. Aprilo per attivare l'account, poi torna qui per
          accedere.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">Nome</FormLabel>
                <FormControl>
                  <Input autoComplete="given-name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">Cognome</FormLabel>
                <FormControl>
                  <Input autoComplete="family-name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold">Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" placeholder="nome@esempio.it" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold">Password</FormLabel>
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
        <FormError message={error} />
        <button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-display font-bold bg-gradient-flame text-flame-foreground shadow-sticker hover:scale-[1.02] transition-transform disabled:opacity-60 disabled:hover:scale-100"
        >
          <UserPlus className="w-4 h-4" />
          {form.formState.isSubmitting ? "Registrazione…" : "Crea account"}
        </button>
      </form>
    </Form>
  );
}
