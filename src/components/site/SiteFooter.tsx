import { Link } from "@tanstack/react-router";
import { Heart, Sparkles } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-foreground text-background">
      <div className="container mx-auto px-4 py-12 grid gap-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="grid place-items-center w-8 h-8 rounded-xl bg-gradient-flame">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="font-display text-lg font-bold text-background">Sportivissimo A.S.D.</div>
          </div>
          <p className="text-sm text-background/55 max-w-xs leading-relaxed">
            Centri estivi, doposcuola e progetti educativi per bambini e ragazzi nel Veneto.
          </p>
        </div>

        <div>
          <div className="font-pixel mb-3 text-background/50">Esplora</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/centri-estivi" className="text-background/60 hover:text-background transition-colors">Centri Estivi</Link></li>
            <li><Link to="/come-funziona" className="text-background/60 hover:text-background transition-colors">Come funziona</Link></li>
          </ul>
        </div>

        <div>
          <div className="font-pixel mb-3 text-background/50">Aree riservate</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/area-genitori" className="text-background/60 hover:text-background transition-colors">Area Genitori</Link></li>
            <li><Link to="/area-staff" className="text-background/60 hover:text-background transition-colors">Area Staff</Link></li>
            <li><Link to="/area-admin" className="text-background/60 hover:text-background transition-colors">Area Admin</Link></li>
          </ul>
        </div>

        <div>
          <div className="font-pixel mb-3 text-background/50">Contatti</div>
          <p className="text-sm text-background/60">info@sportivissimo.it</p>
          <p className="text-sm text-background/60 mt-1">Veneto, Italia</p>
        </div>
      </div>

      <div className="border-t border-background/10 py-5 text-center text-sm text-background/35 flex items-center justify-center gap-1.5">
        Fatto con <Heart className="w-3.5 h-3.5 text-coral fill-coral" /> per le famiglie · © {new Date().getFullYear()} Sportivissimo
      </div>
    </footer>
  );
}
