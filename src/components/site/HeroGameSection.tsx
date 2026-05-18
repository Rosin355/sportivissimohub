import { Link } from "@tanstack/react-router";
import heroImg from "@/assets/hero-sportivissimo.jpg";
import { Rocket, Star, Heart, BookOpen, Sun, ArrowRight } from "lucide-react";

export function HeroGameSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero">
      {/* Ambient glow blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-magic/25 blur-[120px]" />
        <div className="absolute top-[55%] -left-20 w-72 h-72 rounded-full bg-primary/25 blur-[100px]" />
        <div className="absolute -bottom-20 right-1/3 w-96 h-96 rounded-full bg-flame/15 blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 pt-14 pb-24 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left: copy */}
          <div className="animate-pop">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <Sun className="w-3.5 h-3.5 text-sun" />
              <span className="text-sm font-semibold text-white/90">Stagione 2026 aperta!</span>
            </div>

            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] text-white">
              Dove <span className="text-flame">gioco</span>,{" "}
              <span className="text-grass">sport</span>
              <br />e{" "}
              <span className="text-magic-foreground">crescita</span>
              <br />diventano{" "}
              <span className="text-sun">avventura</span>
            </h1>

            <p className="mt-7 text-lg text-white/65 max-w-xl leading-relaxed">
              Centri estivi, doposcuola e attività educative per bambini e ragazzi.
              Semplice per le famiglie, super organizzato per lo staff.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/area-genitori"
                className="inline-flex items-center gap-2 bg-gradient-flame text-flame-foreground rounded-xl px-6 py-3.5 font-display text-lg font-bold shadow-pop hover:scale-105 transition-transform"
              >
                <Rocket className="w-5 h-5" /> Iscrivi tuo figlio
              </Link>
              <Link
                to="/centri-estivi"
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/25 text-white rounded-xl px-6 py-3.5 font-display text-lg font-bold hover:bg-white/20 transition-colors"
              >
                <Star className="w-5 h-5 text-sun" /> Scopri i centri
              </Link>
              <Link
                to="/area-genitori"
                className="inline-flex items-center gap-2 bg-gradient-grass text-grass-foreground rounded-xl px-6 py-3.5 font-display text-lg font-bold shadow-sticker hover:scale-105 transition-transform"
              >
                Area genitori <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Mini stats */}
            <div className="mt-10 flex flex-wrap gap-3">
              {[
                { icon: <Star className="w-4 h-4" />, label: "+ 1.200 famiglie" },
                { icon: <Heart className="w-4 h-4" />, label: "10 sedi nel Veneto" },
                { icon: <BookOpen className="w-4 h-4" />, label: "12 anni di avventure" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3.5 py-2 text-sm font-semibold text-white"
                >
                  <span className="text-sun">{s.icon}</span> {s.label}
                </div>
              ))}
            </div>
          </div>

          {/* Right: hero image */}
          <div className="relative">
            <div className="absolute -top-5 -left-5 w-14 h-14 rounded-xl bg-gradient-sun grid place-items-center shadow-pop animate-wiggle z-10">
              <Sun className="w-6 h-6 text-sun-foreground" />
            </div>
            <div
              className="absolute -bottom-5 -right-5 w-16 h-16 rounded-xl bg-gradient-grass text-grass-foreground grid place-items-center shadow-pop animate-float z-10"
              style={{ ["--r" as never]: "8deg" } as never}
            >
              <Heart className="w-7 h-7" />
            </div>
            <div className="rounded-2xl overflow-hidden shadow-pop ring-1 ring-white/10">
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

      {/* Smooth transition to page background */}
      <div className="h-6 bg-gradient-to-b from-transparent to-background" />
    </section>
  );
}
