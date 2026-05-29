import { Link } from "@tanstack/react-router";
import heroImg from "@/assets/hero-sportivissimo.jpg";
import { MapPin, ArrowRight, Users, Star } from "lucide-react";

export function HeroGameSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-sky">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute bottom-0 -left-20 w-72 h-72 rounded-full bg-flame/10 blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 pt-12 pb-20 lg:pt-20 lg:pb-28 relative">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          {/* Left: copy */}
          <div className="animate-pop">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] text-foreground">
              Dove gioco, sport e<br />
              crescita diventano<br />
              <span className="relative inline-block text-flame">
                avventura
                <svg className="absolute left-0 -bottom-2 w-full" viewBox="0 0 220 12" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M2 8 Q 55 2, 110 7 T 218 6" stroke="oklch(0.88 0.17 88)" strokeWidth="6" strokeLinecap="round" fill="none" />
                </svg>
              </span>
            </h1>

            <p className="mt-7 text-lg text-muted-foreground max-w-xl leading-relaxed">
              Centri estivi, doposcuola e attività educative per bambini e ragazzi
              in un ambiente sicuro, professionale e pieno di entusiasmo.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/centri-estivi"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-6 py-3.5 font-display font-bold shadow-pop hover:scale-105 transition-transform"
              >
                Iscrivi tuo figlio <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/centri-estivi"
                className="inline-flex items-center gap-2 bg-white border border-border text-foreground rounded-full px-6 py-3.5 font-display font-bold shadow-card hover:-translate-y-0.5 transition-transform"
              >
                <MapPin className="w-4 h-4 text-grass" /> Scopri i centri
              </Link>
            </div>
          </div>

          {/* Right: hero image inside organic shape */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-grass rounded-[42%_58%_55%_45%/55%_45%_55%_45%] blur-2xl opacity-30 -z-10" />
            <div className="relative overflow-hidden rounded-[42%_58%_55%_45%/55%_45%_55%_45%] shadow-pop">
              <img
                src={heroImg}
                alt="Bambini felici giocano insieme sport e attività"
                width={1280}
                height={960}
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>

        {/* Floating stats card */}
        <div className="mt-12 lg:mt-16 bg-white rounded-3xl shadow-pop border border-border p-5 sm:p-7 grid sm:grid-cols-3 gap-5 sm:gap-3">
          {[
            { icon: Users, color: "bg-primary text-primary-foreground", num: "1.200+", label: "famiglie che ci scelgono" },
            { icon: MapPin, color: "bg-grass text-grass-foreground", num: "10", label: "sedi nel Veneto" },
            { icon: Star, color: "bg-sun text-sun-foreground", num: "12", label: "anni di esperienza" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-4 justify-center sm:justify-start">
              <div className={`grid place-items-center w-12 h-12 rounded-full shrink-0 ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="font-display text-2xl font-bold text-foreground leading-none">{s.num}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
