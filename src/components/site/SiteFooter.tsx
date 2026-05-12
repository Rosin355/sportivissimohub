import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t-2 border-border/60 bg-gradient-sky">
      <div className="container mx-auto px-4 py-10 grid gap-8 md:grid-cols-4">
        <div>
          <div className="font-display text-2xl font-bold">Sportivissimo A.S.D.</div>
          <p className="text-sm mt-2 text-foreground/80 max-w-xs">
            Centri estivi, doposcuola e progetti educativi per bambini e ragazzi nel Veneto.
          </p>
        </div>
        <div>
          <div className="font-display font-bold mb-2">Esplora</div>
          <ul className="space-y-1 text-sm">
            <li><Link to="/centri-estivi" className="hover:text-magic">Centri Estivi</Link></li>
            <li><Link to="/come-funziona" className="hover:text-magic">Come funziona</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-display font-bold mb-2">Aree riservate</div>
          <ul className="space-y-1 text-sm">
            <li><Link to="/area-genitori" className="hover:text-magic">Area Genitori</Link></li>
            <li><Link to="/area-staff" className="hover:text-magic">Area Staff</Link></li>
            <li><Link to="/area-admin" className="hover:text-magic">Area Admin</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-display font-bold mb-2">Contatti</div>
          <p className="text-sm">info@sportivissimo.it</p>
          <p className="text-sm">Veneto, Italia</p>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-sm text-foreground/70 flex items-center justify-center gap-1">
        Fatto con <Heart className="w-4 h-4 text-coral fill-coral" /> per le famiglie · © {new Date().getFullYear()} Sportivissimo
      </div>
    </footer>
  );
}
