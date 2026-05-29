import { Link } from "@tanstack/react-router";
import { Heart, Sparkles, MapPin, Phone, Mail, Facebook, Instagram, Youtube, ArrowRight } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-[oklch(0.18_0.06_262)] text-background">
      <div className="container mx-auto px-4 py-14 grid gap-10 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="grid place-items-center w-9 h-9 rounded-2xl bg-gradient-flame">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="font-display text-lg font-bold text-background">Sportivissimo<br /><span className="font-pixel text-[0.6rem] text-background/50">A.S.D.</span></div>
          </div>
          <p className="text-sm text-background/60 max-w-xs leading-relaxed">
            Sport, educazione e crescita per bambini e ragazzi.
          </p>
          <div className="flex items-center gap-2 mt-4">
            {[Facebook, Instagram, Youtube].map((Icon, i) => (
              <a key={i} href="#" className="grid place-items-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition-colors" aria-label="social">
                <Icon className="w-4 h-4 text-background" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <div className="font-display font-bold mb-4 text-background">Contatti</div>
          <ul className="space-y-2.5 text-sm text-background/65">
            <li className="flex gap-2"><MapPin className="w-4 h-4 mt-0.5 text-flame shrink-0" /><span>Via Roma, 23<br />35010 Limena (PD)</span></li>
            <li className="flex gap-2"><Phone className="w-4 h-4 mt-0.5 text-flame shrink-0" />049 1234567</li>
            <li className="flex gap-2"><Mail className="w-4 h-4 mt-0.5 text-flame shrink-0" />info@sportivissimoasd.it</li>
          </ul>
        </div>

        <div>
          <div className="font-display font-bold mb-4 text-background">Link utili</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/centri-estivi" className="text-background/65 hover:text-background transition-colors">Centri Estivi</Link></li>
            <li><Link to="/centri-estivi" className="text-background/65 hover:text-background transition-colors">Doposcuola</Link></li>
            <li><Link to="/centri-estivi" className="text-background/65 hover:text-background transition-colors">Progetti per le Scuole</Link></li>
            <li><Link to="/centri-estivi" className="text-background/65 hover:text-background transition-colors">Corsi e Attività</Link></li>
          </ul>
        </div>

        <div>
          <div className="font-display font-bold mb-4 text-background">Informazioni</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/come-funziona" className="text-background/65 hover:text-background transition-colors">Come funziona</Link></li>
            <li><Link to="/area-genitori" className="text-background/65 hover:text-background transition-colors">Genitori</Link></li>
            <li><Link to="/area-staff" className="text-background/65 hover:text-background transition-colors">Staff</Link></li>
            <li><a href="#" className="text-background/65 hover:text-background transition-colors">Lavora con noi</a></li>
          </ul>
        </div>

        <div>
          <div className="font-display font-bold mb-4 text-background">Newsletter</div>
          <p className="text-sm text-background/65 mb-3">Iscriviti per ricevere aggiornamenti e novità sulle attività.</p>
          <form className="flex items-center bg-white/10 rounded-full p-1 pr-1" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              required
              placeholder="La tua email"
              className="flex-1 bg-transparent px-4 py-2 text-sm text-background placeholder:text-background/40 outline-none min-w-0"
            />
            <button type="submit" className="grid place-items-center w-9 h-9 rounded-full bg-gradient-flame text-flame-foreground shrink-0" aria-label="Iscriviti alla newsletter">
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-background/10 py-5">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-background/50">
          <div>© {new Date().getFullYear()} Sportivissimo A.S.D. — P.IVA 01234567890</div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-background">Privacy Policy</a>
            <a href="#" className="hover:text-background">Cookie Policy</a>
            <span className="flex items-center gap-1.5">Fatto con <Heart className="w-3 h-3 text-coral fill-coral" /></span>
          </div>
        </div>
      </div>
    </footer>
  );
}
