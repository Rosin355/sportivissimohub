import { MapPin, Users, Calendar } from "lucide-react";

export type Location = {
  name: string;
  age: string;
  weeks: number;
  spots: number;
  total: number;
  tags: { label: string; color: "sun" | "grass" | "magic" | "flame" | "royal" }[];
};

const tagColor: Record<string, string> = {
  sun: "bg-sun text-sun-foreground",
  grass: "bg-grass text-grass-foreground",
  magic: "bg-magic text-magic-foreground",
  flame: "bg-flame text-flame-foreground",
  royal: "bg-primary text-primary-foreground",
};

export function LocationCard({ loc }: { loc: Location }) {
  const pct = Math.round(((loc.total - loc.spots) / loc.total) * 100);
  return (
    <div className="rounded-3xl border-[3px] border-foreground/90 bg-white shadow-pop overflow-hidden flex flex-col">
      <div className="bg-gradient-sky p-4 flex items-center gap-3 border-b-[3px] border-foreground/90">
        <div className="w-12 h-12 rounded-2xl bg-white grid place-items-center border-2 border-foreground/90">
          <MapPin className="w-6 h-6 text-flame" />
        </div>
        <div>
          <div className="font-display text-xl font-bold leading-tight">{loc.name}</div>
          <div className="text-xs text-foreground/70 font-bold">{loc.age}</div>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          {loc.tags.map((t) => (
            <span
              key={t.label}
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full border-2 border-foreground/90 ${tagColor[t.color]}`}
            >
              {t.label}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-3 text-sm font-bold">
          <span className="inline-flex items-center gap-1"><Calendar className="w-4 h-4 text-magic" />{loc.weeks} settimane</span>
          <span className="inline-flex items-center gap-1"><Users className="w-4 h-4 text-grass" />{loc.spots} posti</span>
        </div>

        <div>
          <div className="flex justify-between text-xs font-bold mb-1">
            <span>Riempimento</span><span>{pct}%</span>
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden border-2 border-foreground/90">
            <div className="h-full bg-gradient-sun" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <button className="mt-2 w-full bg-gradient-magic text-magic-foreground rounded-2xl border-[3px] border-foreground/90 py-2.5 font-display font-bold shadow-sticker hover:-translate-y-0.5 transition-transform">
          Iscriviti
        </button>
      </div>
    </div>
  );
}
