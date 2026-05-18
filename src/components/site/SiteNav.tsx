import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function SiteNav() {
  const links = [
    { to: "/centri-estivi", label: "Centri Estivi" },
    { to: "/come-funziona", label: "Come funziona" },
    { to: "/area-genitori", label: "Genitori" },
    { to: "/area-staff", label: "Staff" },
    { to: "/area-admin", label: "Admin" },
  ];
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-border shadow-card">
      <nav className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-royal text-primary-foreground shadow-sticker group-hover:scale-110 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">
            Sportiv<span className="text-flame">issimo</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-0.5">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="px-3.5 py-2 rounded-xl text-sm font-semibold text-foreground/60 hover:bg-secondary hover:text-foreground transition-all"
              activeProps={{ className: "px-3.5 py-2 rounded-xl text-sm font-semibold bg-primary/10 text-primary" }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <Link
          to="/area-genitori"
          className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-gradient-flame text-flame-foreground px-4 py-2 text-sm font-bold shadow-sticker hover:scale-105 transition-transform"
        >
          Iscriviti ora
        </Link>
      </nav>
    </header>
  );
}
