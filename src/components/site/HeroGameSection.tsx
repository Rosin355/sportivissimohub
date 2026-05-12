import { Link } from "@tanstack/react-router";
import heroImg from "@/assets/hero-sportivissimo.jpg";
import { Trophy, Rocket, Star, BookOpen } from "lucide-react";

export function HeroGameSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-sky">
      {/* Decorative clouds */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-[10%] w-24 h-10 bg-white rounded-full blur-sm opacity-80" />
        <div className="absolute top-24 right-[12%] w-32 h-12 bg-white rounded-full blur-sm opacity-80" />
        <div className="absolute top-[40%] left-[5%] w-20 h-8 bg-white rounded-full blur-sm opacity-70" />
      </div>

      <div className="container mx-auto px-4 pt-12 pb-20 relative">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="relative animate-pop">
            <div className="inline-flex items-center gap-2 bg-white border-[3px] border-foreground/90 rounded-full px-4 py-1.5 shadow-sticker mb-5">
              <span className="font-pixel text-[10px] text-magic">LEVEL UP</span>
              <span className="text-sm font-bold">stagione 2026 aperta!</span>
            </div>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05]">
              Dove <span className="text-flame">gioco</span>, <span className="text-grass">sport</span>
              <br /> e <span className="text-magic">crescita</span>
              <br /> diventano <span className="text-stroke text-sun">avventura</span>
            </h1>
            <p className="mt-6 text-lg text-foreground/80 max-w-xl">
              Centri estivi, doposcuola e attività educative per bambini e ragazzi.
              Semplice per le famiglie, super organizzato per lo staff.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/area-genitori"
                className="inline-flex items-center gap-2 bg-gradient-sun text-sun-foreground border-[3px] border-foreground/90 rounded-2xl px-6 py-3 font-display text-lg font-bold shadow-pop hover:-translate-y-1 transition-transform"
              >
                <Rocket className="w-5 h-5" /> Iscrivi tuo figlio
              </Link>
              <Link
                to="/centri-estivi"
                className="inline-flex items-center gap-2 bg-white text-foreground border-[3px] border-foreground/90 rounded-2xl px-6 py-3 font-display text-lg font-bold shadow-pop hover:-translate-y-1 transition-transform"
              >
                <Trophy className="w-5 h-5 text-flame" /> Scopri i centri
              </Link>
              <Link
                to="/area-genitori"
                className="inline-flex items-center gap-2 bg-gradient-magic text-magic-foreground border-[3px] border-foreground/90 rounded-2xl px-6 py-3 font-display text-lg font-bold shadow-pop hover:-translate-y-1 transition-transform"
              >
                Area genitori
              </Link>
            </div>

            {/* Mini stats */}
            <div className="mt-10 flex flex-wrap gap-3">
              {[
                { icon: <Star className="w-4 h-4" />, label: "+ 1.200 famiglie" },
                { icon: <Trophy className="w-4 h-4" />, label: "10 sedi nel Veneto" },
                { icon: <BookOpen className="w-4 h-4" />, label: "12 anni di avventure" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2 bg-white/90 sticker px-3 py-1.5 text-sm font-bold">
                  <span className="text-flame">{s.icon}</span> {s.label}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-4 -left-4 w-16 h-16 rounded-2xl bg-sun border-[3px] border-foreground/90 grid place-items-center shadow-sticker animate-wiggle z-10">
              <span className="font-pixel text-[10px]">+100</span>
            </div>
            <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-2xl bg-magic text-magic-foreground border-[3px] border-foreground/90 grid place-items-center shadow-sticker animate-float z-10" style={{["--r" as never]: "8deg"} as never}>
              <Trophy className="w-9 h-9" />
            </div>
            <div className="rounded-[2rem] overflow-hidden border-[4px] border-foreground/90 shadow-pop bg-white">
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

      {/* grass strip */}
      <div className="h-6 bg-gradient-grass border-y-[3px] border-foreground/90" />
    </section>
  );
}
