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
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b-2 border-border/60">
      <nav className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="grid place-items-center w-10 h-10 rounded-2xl bg-gradient-magic text-magic-foreground shadow-sticker border-[3px] border-foreground/90 group-hover:rotate-[-6deg] transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">
            Sportiv<span className="text-flame">issimo</span>
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="px-3 py-2 rounded-xl text-sm font-bold text-foreground/80 hover:bg-secondary hover:text-foreground transition-colors"
              activeProps={{ className: "px-3 py-2 rounded-xl text-sm font-bold bg-secondary text-foreground" }}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <Link
          to="/area-genitori"
          className="hidden sm:inline-flex items-center gap-2 rounded-2xl bg-gradient-sun text-sun-foreground px-4 py-2 text-sm font-bold border-[3px] border-foreground/90 shadow-sticker hover:-translate-y-0.5 transition-transform"
        >
          Iscriviti ora
        </Link>
      </nav>
    </header>
  );
}
