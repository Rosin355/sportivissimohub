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
import { PasswordInput } from "@/components/site/PasswordInput";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { roleHome } from "@/lib/supabase/auth";
import { mapAuthError, type MappedAuthError } from "@/lib/auth/errors";
import {
  passwordRequirements,
  passwordMeetsRequirements,
  passwordStrength,
} from "@/lib/auth/password";
import { LogIn, UserPlus, MailCheck, Check, Circle } from "lucide-react";

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
    password: z
      .string()
      .refine(passwordMeetsRequirements, "La password non rispetta i requisiti indicati."),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Le password non coincidono.",
    path: ["confirm"],
  });

function LoginPage() {
  const { next } = Route.useSearch();
  const [tab, setTab] = useState<"accesso" | "registrazione">("accesso");

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
          <Tabs value={tab} onValueChange={(v) => setTab(v as "accesso" | "registrazione")}>
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
              <SignUpForm next={next} onGoToLogin={() => setTab("accesso")} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function FormError({
  error,
  onGoToLogin,
}: {
  error: MappedAuthError | null;
  onGoToLogin?: () => void;
}) {
  if (!error) return null;
  return (
    <div className="bg-flame/10 border border-flame/30 text-flame rounded-xl px-4 py-3 text-sm font-semibold">
      {error.message}
      {error.kind === "email_exists" && onGoToLogin && (
        <>
          {" "}
          <button
            type="button"
            onClick={onGoToLogin}
            className="underline font-bold hover:opacity-80"
          >
            Vai ad Accedi
          </button>
        </>
      )}
      {error.kind === "email_exists" && !onGoToLogin && (
        <>
          {" "}
          <Link to="/login" className="underline font-bold">
            Vai ad Accedi
          </Link>
        </>
      )}
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
  const filled = s.score;
  const toneClass =
    s.tone === "strong"
      ? "bg-grass"
      : s.tone === "medium"
        ? "bg-sun"
        : "bg-flame";
  const toneText =
    s.tone === "strong"
      ? "text-grass"
      : s.tone === "medium"
        ? "text-sun-foreground"
        : "text-flame";
  return (
    <div className="mt-2">
      <div className="flex gap-1" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i <= filled ? toneClass : "bg-muted"}`}
          />
        ))}
      </div>
      <p className={`mt-1 text-xs font-semibold ${toneText}`}>Robustezza: {s.label}</p>
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
  const [error, setError] = useState<MappedAuthError | null>(null);
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (signInError) {
        setError(mapAuthError(signInError));
        return;
      }
      await enterApp(router, queryClient, next);
    } catch (e) {
      setError(mapAuthError(e as Error));
    }
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
                <PasswordInput autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormError error={error} />
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

function SignUpForm({ next, onGoToLogin }: { next?: string; onGoToLogin?: () => void }) {
  const router = useRouter();
  const { queryClient } = Route.useRouteContext();
  const [error, setError] = useState<MappedAuthError | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "", confirm: "" },
  });
  const passwordValue = form.watch("password");

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    setError(null);
    try {
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
        setError(mapAuthError(signUpError));
        return;
      }
      if (!data.session) {
        setConfirmationSent(true);
        return;
      }
      await enterApp(router, queryClient, next);
    } catch (e) {
      setError(mapAuthError(e as Error));
    }
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
        <FormError error={error} onGoToLogin={onGoToLogin} />
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
