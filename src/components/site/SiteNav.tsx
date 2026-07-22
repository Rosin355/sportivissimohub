import { Link, useRouteContext, useRouter } from "@tanstack/react-router";
import { ArrowRight, LogIn, LogOut, Menu, PersonStanding } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function SiteNav() {
  const { auth, queryClient } = useRouteContext({ from: "__root__" });
  const router = useRouter();

  const links = [
    { to: "/centri-estivi", label: "Centri Estivi" },
    { to: "/come-funziona", label: "Come funziona" },
    ...(auth?.roles.includes("genitore") ? [{ to: "/area-genitori", label: "Genitori" }] : []),
    ...(auth?.roles.includes("staff") ? [{ to: "/area-staff", label: "Staff" }] : []),
    ...(auth?.roles.includes("admin") ? [{ to: "/area-admin", label: "Admin" }] : []),
  ];

  async function logout() {
    await getSupabaseBrowserClient().auth.signOut();
    queryClient.removeQueries({ queryKey: ["auth-state"] });
    await router.invalidate();
    router.history.push("/");
  }

  return (
    <header className="relative z-50 bg-white">
      <nav className="relative flex items-center justify-between py-6 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="text-orange-500">
            <PersonStanding className="w-10 h-10" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="font-display text-2xl tracking-tight text-slate-900 leading-none">
              Sportivissimo
            </h1>
            <p className="text-xs font-medium text-slate-500 tracking-widest uppercase">A.S.D.</p>
          </div>
        </Link>

        <div className="hidden lg:flex items-center gap-8 text-lg font-medium text-slate-700">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="hover:text-orange-500 transition-colors"
              activeProps={{ className: "text-orange-500" }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-4">
          {auth ? (
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 text-lg font-medium text-slate-700 hover:text-orange-500 transition-colors"
            >
              <LogOut className="w-5 h-5" strokeWidth={1.5} /> Esci
            </button>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-lg font-medium text-slate-700 hover:text-orange-500 transition-colors"
            >
              <LogIn className="w-5 h-5" strokeWidth={1.5} /> Accedi
            </Link>
          )}
          <Link
            to="/area-genitori"
            className="inline-flex items-center justify-center rounded-full bg-orange-500 text-white px-6 py-3 text-lg font-medium hover:bg-orange-600 transition-colors shadow-[0_4px_14px_0_rgba(249,115,22,0.39)]"
          >
            Iscriviti ora <ArrowRight className="ml-2 w-5 h-5" strokeWidth={1.5} />
          </Link>
        </div>

        <button className="lg:hidden text-slate-900" aria-label="Menu">
          <Menu className="w-8 h-8" strokeWidth={1.5} />
        </button>
      </nav>
    </header>
  );
}
