import { Link } from "@tanstack/react-router";
import heroImg from "@/assets/hero-sportivissimo.jpg";
import { Rocket, Star, Heart, BookOpen, Sun } from "lucide-react";

export function HeroGameSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-sky paper-grain">
      {/* Decorative soft clouds */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-[10%] w-28 h-12 bg-white/80 rounded-full blur-md" />
        <div className="absolute top-24 right-[12%] w-36 h-14 bg-white/80 rounded-full blur-md" />
        <div className="absolute top-[45%] left-[5%] w-24 h-10 bg-white/70 rounded-full blur-md" />
      </div>

      <div className="container mx-auto px-4 pt-12 pb-20 relative">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="relative animate-pop">
            <div className="inline-flex items-center gap-2 bg-white/90 rounded-full px-4 py-1.5 shadow-sticker mb-5 border border-flame/30">
              <Sun className="w-4 h-4 text-flame" />
              <span className="font-hand text-base text-foreground/80">Stagione 2026 aperta!</span>
            </div>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05]">
              Dove <span className="text-flame">gioco</span>, <span className="text-grass-foreground">sport</span>
              <br /> e <span className="text-magic-foreground">crescita</span>
              <br /> diventano{" "}
              <span className="relative inline-block text-flame">
                avventura
                <svg className="absolute -bottom-2 left-0 w-full h-3 text-flame/60" preserveAspectRatio="none" viewBox="0 0 100 10" fill="none">
                  <path d="M1 8 C 25 2, 60 2, 99 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className="mt-8 text-lg text-foreground/75 max-w-xl font-hand text-xl">
              Centri estivi, doposcuola e attività educative per bambini e ragazzi.
              Semplice per le famiglie, super organizzato per lo staff.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/area-genitori"
                className="inline-flex items-center gap-2 bg-flame text-flame-foreground rounded-doodle px-6 py-3 font-display text-lg font-bold shadow-pop hover:rotate-1 transition-transform"
              >
                <Rocket className="w-5 h-5" /> Iscrivi tuo figlio
              </Link>
              <Link
                to="/centri-estivi"
                className="inline-flex items-center gap-2 bg-white text-foreground rounded-doodle px-6 py-3 font-display text-lg font-bold shadow-card border border-foreground/15 hover:-rotate-1 transition-transform"
              >
                <Star className="w-5 h-5 text-sun-foreground" /> Scopri i centri
              </Link>
              <Link
                to="/area-genitori"
                className="inline-flex items-center gap-2 bg-grass text-grass-foreground rounded-doodle px-6 py-3 font-display text-lg font-bold shadow-card hover:rotate-1 transition-transform"
              >
                Area genitori
              </Link>
            </div>

            {/* Mini stats */}
            <div className="mt-10 flex flex-wrap gap-3">
              {[
                { icon: <Star className="w-4 h-4" />, label: "+ 1.200 famiglie" },
                { icon: <Heart className="w-4 h-4" />, label: "10 sedi nel Veneto" },
                { icon: <BookOpen className="w-4 h-4" />, label: "12 anni di avventure" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2 bg-white/90 sticker px-3 py-1.5 text-sm font-hand text-base">
                  <span className="text-flame">{s.icon}</span> {s.label}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-4 -left-4 w-16 h-16 rounded-blob bg-sun grid place-items-center shadow-sticker animate-wiggle z-10">
              <Sun className="w-7 h-7 text-flame" />
            </div>
            <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-blob bg-grass text-grass-foreground grid place-items-center shadow-sticker animate-float z-10" style={{["--r" as never]: "8deg"} as never}>
              <Heart className="w-9 h-9" />
            </div>
            <div className="rounded-doodle-lg overflow-hidden shadow-pop bg-white border border-foreground/10">
              <img
                src={heroImg}
                alt="Bambini felici giocano in un mondo educativo gamificato"
                width={1536}
                height={1024}
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>

      {/* soft grass strip */}
      <div className="h-4 bg-gradient-grass" />
    </section>
  );
}
