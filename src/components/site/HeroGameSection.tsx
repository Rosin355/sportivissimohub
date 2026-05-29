import { Link } from "@tanstack/react-router";
import heroImg from "@/assets/hero-home.png";
import type { LucideIcon } from "lucide-react";
import { MapPin, Users, Star } from "lucide-react";

type StatVariant = "primary" | "grass" | "sun";

const statIconCls: Record<StatVariant, string> = {
  primary: "bg-primary text-primary-foreground",
  grass:   "bg-grass text-grass-foreground",
  sun:     "bg-sun text-sun-foreground",
};

function StatBadge({
  icon: Icon,
  variant,
  value,
  label,
}: {
  icon: LucideIcon;
  variant: StatVariant;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-4 px-6 py-2 flex-1 justify-center">
      <div className={`w-12 h-12 rounded-full grid place-items-center shrink-0 ${statIconCls[variant]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="font-display text-2xl font-bold text-foreground">{value}</span>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

export function HeroGameSection() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="container mx-auto px-4 pt-10 pb-4 relative">
        <div className="grid lg:grid-cols-[1fr_1.25fr] gap-8 items-center">

          {/* Left: copy */}
          <div className="animate-pop py-8 relative z-10">
            {/* Headline */}
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] text-foreground">
              Dove gioco, sport e crescita diventano{" "}
              <span className="text-flame relative inline-block">
                avventura
                {/* Wavy yellow underline */}
                <svg
                  className="absolute -bottom-2 left-0 w-full h-3 text-sun"
                  preserveAspectRatio="none"
                  viewBox="0 0 200 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M0 8 Q25 2 50 8 Q75 12 100 6 Q125 0 150 8 Q175 12 200 6"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className="mt-8 text-lg text-muted-foreground max-w-xl leading-relaxed">
              Centri estivi, doposcuola e attività educative per bambini e ragazzi
              in un ambiente sicuro, professionale e pieno di entusiasmo.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/area-genitori"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-7 py-3.5 font-display text-lg font-bold shadow-pop hover:scale-105 transition-transform"
              >
                Iscrivi tuo figlio →
              </Link>
              <Link
                to="/centri-estivi"
                className="inline-flex items-center gap-2 bg-white border-2 border-primary text-primary rounded-full px-7 py-3.5 font-display text-lg font-bold hover:bg-primary/5 transition-colors"
              >
                Scopri i centri <MapPin className="w-5 h-5 text-flame" />
              </Link>
            </div>
          </div>

          {/* Right: hero illustration — blob shape already integrated in the asset */}
          <div className="relative w-full lg:-mr-[max(1rem,calc((100vw-1280px)/2))]">
            <img
              src={heroImg}
              alt="Bambini che giocano a sport all'aperto"
              width={1536}
              height={1024}
              className="w-full h-auto"
            />
          </div>
        </div>

        {/* Full-width stats card — overlaps section bottom */}
        <div className="relative z-10 -mb-10">
          <div className="bg-white rounded-3xl shadow-pop border border-border px-4 md:px-8 py-5 flex flex-col sm:flex-row sm:items-stretch sm:divide-x divide-border">
            <StatBadge icon={Users}  variant="primary" value="1.200+" label="famiglie che ci scelgono" />
            <StatBadge icon={MapPin} variant="grass"   value="10"     label="sedi nel Veneto" />
            <StatBadge icon={Star}   variant="sun"     value="12"     label="anni di esperienza" />
          </div>
        </div>
      </div>
    </section>
  );
}
