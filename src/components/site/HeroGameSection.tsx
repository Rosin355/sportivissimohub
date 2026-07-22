import { Link } from "@tanstack/react-router";
import heroImg from "@/assets/hero-home.png";
import { ArrowRight, MapPin, Users, Star } from "lucide-react";

export function HeroGameSection() {
  return (
    <>
      <section className="relative w-full h-auto md:h-[70vh] md:min-h-[520px] md:max-h-[720px] overflow-hidden">
        {/* Mobile: image on top with natural aspect, content below over light bg */}
        <div className="md:hidden">
          <img
            src={heroImg}
            alt="Bambini che giocano a basket, calcio, corsa e leggono"
            className="w-full h-auto object-cover"
          />
          <div className="bg-sky-50 px-5 py-8">
            <div className="animate-pop">
              <h1 className="font-display text-4xl sm:text-5xl tracking-tight text-slate-900 leading-[1.1]">
                Dove gioco, sport e crescita diventano{" "}
                <span className="text-orange-500 relative inline-block">
                  avventura
                  <span className="absolute -bottom-1 left-0 w-full h-1.5 bg-orange-200 rounded-full -z-10" />
                </span>
              </h1>
              <p className="mt-4 text-base sm:text-lg text-slate-700 leading-relaxed font-medium">
                Centri estivi, doposcuola e attività educative per bambini e ragazzi in un ambiente
                sicuro, professionale e pieno di entusiasmo.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <Link
                  to="/area-genitori"
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 text-white px-6 py-3.5 text-base font-medium hover:bg-slate-800 transition-all shadow-lg"
                >
                  Iscrivi tuo figlio <ArrowRight className="ml-2 w-5 h-5" strokeWidth={1.5} />
                </Link>
                <Link
                  to="/centri-estivi"
                  className="inline-flex items-center justify-center rounded-full bg-white border-2 border-slate-200 text-slate-900 px-6 py-3.5 text-base font-medium hover:border-slate-300 hover:bg-slate-50 transition-all"
                >
                  Scopri i centri <MapPin className="ml-2 w-5 h-5" strokeWidth={1.5} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop / tablet: full-bleed image with overlaid text */}
        <img
          src={heroImg}
          alt="Bambini che giocano a basket, calcio, corsa e leggono"
          className="hidden md:block absolute inset-0 w-full h-full object-cover"
        />
        <div className="hidden md:flex relative z-10 h-full max-w-[1400px] mx-auto px-6 lg:px-12 items-center">
          <div className="animate-pop w-full max-w-xl">
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl tracking-tight text-slate-900 leading-[1.05]">
              Dove gioco, sport e crescita diventano <br />
              <span className="text-orange-500 relative inline-block">
                avventura
                <span className="absolute -bottom-2 left-0 w-full h-2 bg-orange-200 rounded-full -z-10" />
              </span>
            </h1>
            <p className="mt-6 text-xl md:text-2xl text-slate-700 leading-relaxed font-medium max-w-lg">
              Centri estivi, doposcuola e attività educative per bambini e ragazzi in un ambiente
              sicuro, professionale e pieno di entusiasmo.
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
      <div className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 mt-8 md:mt-16 mb-10 md:mb-12">
        <div className="bg-white rounded-2xl md:rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-5 md:p-8 grid grid-cols-1 md:flex md:flex-row md:justify-around items-center gap-5 md:gap-8">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 md:w-7 md:h-7" strokeWidth={1.5} />
            </div>
            <div>
              <div className="font-display text-2xl md:text-3xl tracking-tight text-blue-600">
                1.200+
              </div>
              <div className="text-sm md:text-base font-medium text-slate-500 leading-tight">
                famiglie che ci scelgono
              </div>
            </div>
          </div>
          <div className="hidden md:block w-px h-12 bg-slate-100" />
          <div className="h-px w-full bg-slate-100 md:hidden" />
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6 md:w-7 md:h-7" strokeWidth={1.5} />
            </div>
            <div>
              <div className="font-display text-2xl md:text-3xl tracking-tight text-green-600">
                10
              </div>
              <div className="text-sm md:text-base font-medium text-slate-500 leading-tight">
                sedi nel Veneto
              </div>
            </div>
          </div>
          <div className="hidden md:block w-px h-12 bg-slate-100" />
          <div className="h-px w-full bg-slate-100 md:hidden" />
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-yellow-100 text-yellow-500 flex items-center justify-center shrink-0">
              <Star className="w-6 h-6 md:w-7 md:h-7" strokeWidth={1.5} />
            </div>
            <div>
              <div className="font-display text-2xl md:text-3xl tracking-tight text-yellow-500">
                12
              </div>
              <div className="text-sm md:text-base font-medium text-slate-500 leading-tight">
                anni di esperienza
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
