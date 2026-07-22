import { Link } from "@tanstack/react-router";
import {
  MapPin,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Youtube,
  PersonStanding,
  ArrowRight,
} from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="bg-[#0A2540] text-slate-300 pt-20 pb-10 px-6 lg:px-12 border-t border-slate-800 mt-12">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-6 text-white">
            <PersonStanding className="w-8 h-8" strokeWidth={1.5} />
            <div>
              <h2 className="font-display text-xl tracking-tight leading-none">Sportivissimo</h2>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                A.S.D.
              </p>
            </div>
          </div>
          <p className="text-base font-medium text-slate-400 mb-6">
            Sport, educazione e crescita per bambini e ragazzi.
          </p>
          <div className="flex gap-4">
            {[
              { Icon: Facebook, label: "Facebook" },
              { Icon: Instagram, label: "Instagram" },
              { Icon: Youtube, label: "YouTube" },
            ].map(({ Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="w-10 h-10 rounded-full border border-slate-700 flex items-center justify-center hover:bg-slate-800 hover:text-white transition-colors"
              >
                <Icon className="w-5 h-5" strokeWidth={1.5} />
              </a>
            ))}
          </div>
        </div>

        {/* Contatti */}
        <div>
          <h3 className="font-display text-xl text-white mb-6">Contatti</h3>
          <ul className="space-y-4 font-medium">
            <li className="flex gap-3 items-start">
              <MapPin className="w-5 h-5 shrink-0 mt-0.5 text-slate-500" strokeWidth={1.5} />
              <span>
                Via Roma, 23
                <br />
                35010 Limena (PD)
              </span>
            </li>
            <li className="flex gap-3 items-center">
              <Phone className="w-5 h-5 shrink-0 text-slate-500" strokeWidth={1.5} />
              <span>049 1234567</span>
            </li>
            <li className="flex gap-3 items-center">
              <Mail className="w-5 h-5 shrink-0 text-slate-500" strokeWidth={1.5} />
              <span>info@sportivissimoasd.it</span>
            </li>
          </ul>
        </div>

        {/* Link utili */}
        <div>
          <h3 className="font-display text-xl text-white mb-6">Link utili</h3>
          <ul className="space-y-3 font-medium">
            <li>
              <Link to="/centri-estivi" className="hover:text-white transition-colors">
                Centri Estivi
              </Link>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Doposcuola
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Progetti per le Scuole
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Corsi e Attività
              </a>
            </li>
          </ul>
        </div>

        {/* Informazioni */}
        <div>
          <h3 className="font-display text-xl text-white mb-6">Informazioni</h3>
          <ul className="space-y-3 font-medium">
            <li>
              <Link to="/come-funziona" className="hover:text-white transition-colors">
                Come funziona
              </Link>
            </li>
            <li>
              <Link to="/area-genitori" className="hover:text-white transition-colors">
                Genitori
              </Link>
            </li>
            <li>
              <Link to="/area-staff" className="hover:text-white transition-colors">
                Staff
              </Link>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Lavora con noi
              </a>
            </li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h3 className="font-display text-xl text-white mb-6">Newsletter</h3>
          <p className="text-base font-medium text-slate-400 mb-4">
            Iscriviti per ricevere aggiornamenti e novità sulle attività.
          </p>
          <form
            className="flex w-full max-w-sm items-center space-x-2"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              placeholder="La tua email"
              className="flex h-12 w-full rounded-full border border-slate-700 bg-slate-800 px-4 py-2 text-base font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <button
              type="submit"
              aria-label="Iscriviti"
              className="inline-flex items-center justify-center rounded-full bg-orange-500 text-white w-12 h-12 shrink-0 hover:bg-orange-600 transition-colors"
            >
              <ArrowRight className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-sm font-medium text-slate-500">
        <p>© {new Date().getFullYear()} Sportivissimo A.S.D. - P.IVA 01234567890</p>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-white transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Cookie Policy
          </a>
        </div>
      </div>
    </footer>
  );
}
