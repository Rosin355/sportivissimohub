import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Menu, X, ArrowRight } from "lucide-react";

export function SiteNav() {
  const links = [
    { to: "/centri-estivi", label: "Centri Estivi" },
    { to: "/come-funziona", label: "Come funziona" },
    { to: "/area-genitori", label: "Genitori" },
    { to: "/area-staff", label: "Staff" },
    { to: "/area-admin", label: "Admin" },
  ];
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-border">
      <nav className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="grid place-items-center w-10 h-10 rounded-2xl bg-gradient-royal text-primary-foreground shadow-sticker group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-xl font-bold tracking-tight">
              Sportiv<span className="text-flame">issimo</span>
            </div>
            <div className="font-pixel text-[0.6rem] text-muted-foreground -mt-0.5">A.S.D.</div>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="px-3.5 py-2 rounded-full text-sm font-semibold text-foreground/70 hover:bg-secondary hover:text-foreground transition-all"
              activeProps={{ className: "px-3.5 py-2 rounded-full text-sm font-semibold bg-primary/10 text-primary" }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/area-genitori"
            className="hidden sm:inline-flex items-center gap-2 rounded-full bg-gradient-flame text-flame-foreground px-5 py-2.5 text-sm font-bold shadow-pop hover:scale-105 transition-transform"
          >
            Iscriviti ora <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden grid place-items-center w-10 h-10 rounded-full bg-secondary text-foreground hover:bg-secondary/80"
            aria-label="Apri menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>
      {open && (
        <div className="md:hidden border-t border-border bg-white">
          <div className="container mx-auto px-4 py-3 flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-foreground/80 hover:bg-secondary"
                activeProps={{ className: "px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary/10 text-primary" }}
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/area-genitori"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-flame text-flame-foreground px-5 py-3 text-sm font-bold shadow-pop"
            >
              Iscriviti ora <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
