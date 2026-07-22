import { Link } from "@tanstack/react-router";
import { MapPin, Users, Calendar, ArrowRight } from "lucide-react";

export type Location = {
  slug: string;
  name: string;
  age: string;
  weeks: number;
  spots: number;
  total: number;
  tags: { label: string; color: "sun" | "grass" | "magic" | "flame" | "royal" }[];
};

const tagStyle: Record<string, string> = {
  sun: "bg-sun/15 text-sun-foreground border-sun/30",
  grass: "bg-grass/15 text-grass border-grass/30",
  magic: "bg-magic/15 text-magic border-magic/30",
  flame: "bg-flame/15 text-flame border-flame/30",
  royal: "bg-primary/15 text-primary border-primary/30",
};

export function LocationCard({ loc }: { loc: Location }) {
  const pct = Math.round(((loc.total - loc.spots) / loc.total) * 100);
  const isHot = pct >= 80;
  return (
    <Link
      to="/centri-estivi/$slug"
      params={{ slug: loc.slug }}
      className="group rounded-2xl bg-white shadow-pop border border-border overflow-hidden flex flex-col hover:-translate-y-1 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {/* Gradient header */}
      <div className="bg-gradient-royal p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 grid place-items-center shrink-0">
          <MapPin className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display text-lg font-bold leading-tight text-white truncate">
            {loc.name}
          </div>
          <div className="text-xs text-white/70 font-semibold">{loc.age}</div>
        </div>
        {isHot && (
          <span className="shrink-0 bg-coral text-coral-foreground font-pixel px-2 py-0.5 rounded-lg">
            Quasi pieno
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          {loc.tags.map((t) => (
            <span
              key={t.label}
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-lg border ${tagStyle[t.color]}`}
            >
              {t.label}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-4 text-sm font-semibold">
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="w-4 h-4 text-magic" />
            {loc.weeks} settimane
          </span>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Users className="w-4 h-4 text-grass" />
            {loc.spots} posti
          </span>
        </div>

        <div>
          <div className="flex justify-between text-xs font-semibold mb-1.5">
            <span className="text-muted-foreground">Disponibilità</span>
            <span className={isHot ? "text-coral font-bold" : "text-muted-foreground"}>
              {pct}% prenotato
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isHot ? "bg-gradient-flame" : "bg-gradient-royal"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <span className="mt-1 w-full bg-gradient-magic text-magic-foreground rounded-xl py-2.5 font-display font-bold shadow-sticker group-hover:scale-[1.02] transition-transform inline-flex items-center justify-center gap-2">
          Scopri & iscriviti <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  );
}
