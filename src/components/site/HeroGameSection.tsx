import { Link } from "@tanstack/react-router";
import heroImg from "@/assets/hero-home.png";
import { ArrowRight, MapPin, Users, Star } from "lucide-react";

export function HeroGameSection() {
  return (
    <>
      <section className="relative w-full h-[70vh] min-h-[520px] max-h-[720px] overflow-hidden">
        <img
          src={heroImg}
          alt="Bambini che giocano a basket, calcio, corsa e leggono"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-10 h-full max-w-[1400px] mx-auto px-6 lg:px-12 flex items-center">
          <div className="animate-pop w-full max-w-xl">
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl tracking-tight text-slate-900 leading-[1.05]">
              Dove gioco, sport e crescita diventano <br />
              <span className="text-orange-500 relative inline-block">
                avventura
                <span className="absolute -bottom-2 left-0 w-full h-2 bg-orange-200 rounded-full -z-10" />
              </span>
            </h1>
            <p className="mt-6 text-xl md:text-2xl text-slate-700 leading-relaxed font-medium max-w-lg">
              Centri estivi, doposcuola e attività educative per bambini e ragazzi in un ambiente sicuro, professionale e pieno di entusiasmo.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                to="/area-genitori"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 text-white px-8 py-4 text-xl font-medium hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Iscrivi tuo figlio <ArrowRight className="ml-2 w-6 h-6" strokeWidth={1.5} />
              </Link>
              <Link
                to="/centri-estivi"
                className="inline-flex items-center justify-center rounded-full bg-white border-2 border-slate-200 text-slate-900 px-8 py-4 text-xl font-medium hover:border-slate-300 hover:bg-slate-50 transition-all"
              >
                Scopri i centri <MapPin className="ml-2 w-6 h-6" strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <div className="relative z-20 max-w-5xl mx-auto px-6 -mt-24">
        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 flex flex-col md:flex-row justify-around items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-7 h-7" strokeWidth={1.5} />
            </div>
            <div>
              <div className="font-display text-3xl tracking-tight text-blue-600">1.200+</div>
              <div className="text-base font-medium text-slate-500 leading-tight">famiglie che ci scelgono</div>
            </div>
          </div>
          <div className="hidden md:block w-px h-12 bg-slate-100" />
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
              <MapPin className="w-7 h-7" strokeWidth={1.5} />
            </div>
            <div>
              <div className="font-display text-3xl tracking-tight text-green-600">10</div>
              <div className="text-base font-medium text-slate-500 leading-tight">sedi nel Veneto</div>
            </div>
          </div>
          <div className="hidden md:block w-px h-12 bg-slate-100" />
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-yellow-100 text-yellow-500 flex items-center justify-center shrink-0">
              <Star className="w-7 h-7" strokeWidth={1.5} />
            </div>
            <div>
              <div className="font-display text-3xl tracking-tight text-yellow-500">12</div>
              <div className="text-base font-medium text-slate-500 leading-tight">anni di esperienza</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
