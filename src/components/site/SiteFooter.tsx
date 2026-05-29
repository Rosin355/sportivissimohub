import { Link } from "@tanstack/react-router";
import { MapPin, Phone, Mail, Instagram } from "lucide-react";

function RunnerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="white" xmlns="http://www.w3.org/2000/svg">
      <circle cx="15" cy="3.5" r="2" />
      <path d="M9.5 9L13 6.5l3 2.5-2.5 3.5 3 3.5H14l-2.5-3.5L9 15.5H5.5l4-6.5z" />
      <path d="M6.5 20.5l3-5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.4a2.78 2.78 0 0 0 1.95-1.97A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#1a1a2e" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-foreground text-background">
      <div className="container mx-auto px-4 py-14 grid gap-8 sm:grid-cols-2 md:grid-cols-5">

        {/* Col 1: Brand */}
        <div className="sm:col-span-2 md:col-span-1">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="grid place-items-center w-8 h-8 rounded-full bg-primary shrink-0">
              <RunnerIcon />
            </div>
            <div className="font-display text-base font-bold text-background leading-tight">
              Sportivissimo A.S.D.
            </div>
          </div>
          <p className="text-sm text-background/55 leading-relaxed mb-5">
            Sport, educazione e crescita per bambini e ragazzi nel Veneto.
          </p>
          {/* Social icons */}
          <div className="flex gap-2">
            {[
              { icon: <Instagram className="w-4 h-4" />, label: "Instagram" },
              { icon: <FacebookIcon />,                  label: "Facebook" },
              { icon: <YoutubeIcon />,                   label: "YouTube" },
            ].map((s) => (
              <a
                key={s.label}
                href="#"
                aria-label={s.label}
                className="w-9 h-9 rounded-lg bg-background/10 hover:bg-background/20 grid place-items-center transition-colors"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Col 2: Contatti */}
        <div>
          <div className="font-pixel text-background/50 mb-4">Contatti</div>
          <ul className="space-y-2.5 text-sm text-background/65">
            <li className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-background/35" />
              Via Roma, 23 · 35010 Limena (PD)
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 shrink-0 text-background/35" />
              049 1234567
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 shrink-0 text-background/35" />
              info@sportivissimoasd.it
            </li>
          </ul>
        </div>

        {/* Col 3: Link utili */}
        <div>
          <div className="font-pixel text-background/50 mb-4">Link utili</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/centri-estivi" className="text-background/60 hover:text-background transition-colors">Centri Estivi</Link></li>
            <li><a href="#" className="text-background/60 hover:text-background transition-colors">Doposcuola</a></li>
            <li><a href="#" className="text-background/60 hover:text-background transition-colors">Progetti per le Scuole</a></li>
            <li><a href="#" className="text-background/60 hover:text-background transition-colors">Corsi e Attività</a></li>
          </ul>
        </div>

        {/* Col 4: Informazioni */}
        <div>
          <div className="font-pixel text-background/50 mb-4">Informazioni</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/come-funziona"  className="text-background/60 hover:text-background transition-colors">Come funziona</Link></li>
            <li><Link to="/area-genitori"  className="text-background/60 hover:text-background transition-colors">Genitori</Link></li>
            <li><Link to="/area-staff"     className="text-background/60 hover:text-background transition-colors">Staff</Link></li>
            <li><a href="#" className="text-background/60 hover:text-background transition-colors">Lavora con noi</a></li>
          </ul>
        </div>

        {/* Col 5: Newsletter */}
        <div>
          <div className="font-pixel text-background/50 mb-4">Newsletter</div>
          <p className="text-sm text-background/55 mb-3 leading-relaxed">
            Rimani aggiornato sulle novità e le offerte.
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="La tua email"
              className="flex-1 min-w-0 rounded-xl bg-background/10 border border-background/15 px-3 py-2 text-sm text-background placeholder:text-background/35 focus:outline-none focus:ring-1 focus:ring-flame"
            />
            <button
              type="button"
              className="bg-flame text-white rounded-xl px-3 py-2 font-bold text-sm hover:bg-flame/90 transition-colors shrink-0"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-background/10 py-4 px-4">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 text-sm text-background/35">
          <span>© {new Date().getFullYear()} Sportivissimo A.S.D. – P.IVA 01234567890</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-background/60 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-background/60 transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
