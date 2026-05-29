import { Link } from "@tanstack/react-router";
import heroImg from "@/assets/hero-home.png";
import { ArrowRight, MapPin, Users, Star } from "lucide-react";

const blobBg =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='%23F0F9FF' d='M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.3,-46.3C90.8,-33.5,96.8,-18,97.6,-2.2C98.4,13.6,94.1,29.7,85.2,43.4C76.3,57.1,62.8,68.4,47.8,75.9C32.8,83.4,16.4,87.1,0.6,86C-15.2,84.9,-30.4,79,-44.1,70.9C-57.8,62.8,-70,52.5,-78.5,39.6C-87,26.7,-91.8,11.2,-91.7,-4.3C-91.6,-19.8,-86.6,-35.3,-77.3,-47.9C-68,-60.5,-54.4,-70.2,-40,-77C-25.6,-83.8,-12.8,-87.7,1.2,-89.6C15.2,-91.5,30.5,-83.6,44.7,-76.4Z' transform='translate(100 100) scale(1.1)' /%3E%3C/svg%3E\")";

export function HeroGameSection() {
  return (
    <>
      <section className="relative pt-8 pb-32 px-6 lg:px-12 max-w-[1600px] mx-auto">
        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-8 items-center relative z-10">
          <div className="max-w-xl animate-pop">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-tight text-slate-900 leading-[1.1]">
              Dove gioco, sport e crescita diventano <br />
              <span className="text-orange-500 relative inline-block">
                avventura
                <span className="absolute -bottom-2 left-0 w-full h-2 bg-orange-200 rounded-full -z-10" />
              </span>
            </h1>
            <p className="mt-5 text-lg text-slate-600 leading-relaxed font-medium max-w-lg">
              Centri estivi, doposcuola e attività educative per bambini e ragazzi in un ambiente sicuro, professionale e pieno di entusiasmo.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                to="/area-genitori"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 text-white px-7 py-3.5 text-lg font-medium hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Iscrivi tuo figlio <ArrowRight className="ml-2 w-5 h-5" strokeWidth={1.5} />
              </Link>
              <Link
                to="/centri-estivi"
                className="inline-flex items-center justify-center rounded-full bg-white border-2 border-slate-200 text-slate-900 px-7 py-3.5 text-lg font-medium hover:border-slate-300 hover:bg-slate-50 transition-all"
              >
                Scopri i centri <MapPin className="ml-2 w-5 h-5" strokeWidth={1.5} />
              </Link>
            </div>
          </div>

          <div className="relative w-full flex items-center justify-center lg:-mr-12 xl:-mr-24">
            <img
              src={heroImg}
              alt="Bambini che giocano a basket, calcio, corsa e leggono"
              className="w-full h-auto max-h-[80vh] object-contain drop-shadow-xl"
            />
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
