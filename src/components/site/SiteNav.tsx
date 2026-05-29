import { Link } from "@tanstack/react-router";

function RunnerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="white" xmlns="http://www.w3.org/2000/svg">
      <circle cx="15" cy="3.5" r="2" />
      <path d="M9.5 9L13 6.5l3 2.5-2.5 3.5 3 3.5H14l-2.5-3.5L9 15.5H5.5l4-6.5z" />
      <path d="M6.5 20.5l3-5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function SiteNav() {
  const links = [
    { to: "/centri-estivi", label: "Centri Estivi" },
    { to: "/come-funziona", label: "Come funziona" },
    { to: "/area-genitori", label: "Genitori" },
    { to: "/area-staff",    label: "Staff" },
    { to: "/area-admin",    label: "Admin" },
  ];
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-border shadow-card">
      <nav className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="grid place-items-center w-9 h-9 rounded-full bg-primary shadow-sticker group-hover:scale-110 transition-transform">
            <RunnerIcon />
          </div>
          <span className="font-display text-lg font-bold text-foreground">
            Sportivissimo A.S.D.
          </span>
        </Link>

        {/* Nav links */}
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

        {/* CTA */}
        <Link
          to="/area-genitori"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-flame text-white px-5 py-2 text-sm font-bold hover:bg-flame/90 transition-colors shadow-sticker"
        >
          Iscriviti ora →
        </Link>
      </nav>
    </header>
  );
}
