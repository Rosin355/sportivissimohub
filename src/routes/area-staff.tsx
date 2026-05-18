import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { MapPin, AlertTriangle, UserCheck, UserX, NotebookPen, Users } from "lucide-react";

export const Route = createFileRoute("/area-staff")({
  head: () => ({ meta: [{ title: "Area Staff — Sportivissimo" }] }),
  component: AreaStaff,
});

const children = [
  { name: "Marco R.",  age: 9,  in: true,  allergy: "Arachidi" },
  { name: "Sofia B.",  age: 6,  in: true,  allergy: null },
  { name: "Luca P.",   age: 8,  in: false, allergy: null },
  { name: "Anna T.",   age: 7,  in: true,  allergy: "Lattosio" },
  { name: "Davide F.", age: 10, in: false, allergy: null },
];

function AreaStaff() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">

        {/* Sede selector */}
        <div className="rounded-2xl bg-gradient-grass text-grass-foreground p-5 shadow-pop relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-[50px] pointer-events-none" />
          <div className="flex items-center gap-3 relative">
            <div className="w-12 h-12 rounded-xl bg-white/20 grid place-items-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="font-pixel text-white/60 mb-0.5">Sede oggi</div>
              <div className="font-display text-xl font-bold text-white">Galzignano Terme</div>
            </div>
            <button className="bg-white text-foreground rounded-xl px-3 py-2 font-bold text-sm hover:bg-white/90 transition-colors">
              Cambia
            </button>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center relative">
            <Mini label="Iscritti" value="32" />
            <Mini label="Presenti" value="24" />
            <Mini label="Assenti"  value="8" />
          </div>
        </div>

        {/* Lista bambini */}
        <h2 className="font-display text-2xl font-bold mt-8 mb-4 flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" /> Lista bambini · oggi
        </h2>
        <div className="space-y-3">
          {children.map((c) => (
            <div key={c.name} className="rounded-xl border border-border bg-white shadow-card p-4 flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl grid place-items-center font-display font-bold text-lg ${
                  c.in ? "bg-gradient-grass text-grass-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                {c.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="font-bold">
                  {c.name} <span className="text-muted-foreground font-normal">· {c.age}a</span>
                </div>
                {c.allergy && (
                  <div className="text-xs font-semibold text-coral inline-flex items-center gap-1 mt-0.5">
                    <AlertTriangle className="w-3 h-3" /> Allergia: {c.allergy}
                  </div>
                )}
              </div>
              <button
                className={`rounded-xl border px-3 py-2 font-bold text-sm inline-flex items-center gap-1.5 transition-colors ${
                  c.in
                    ? "bg-grass/15 text-grass border-grass/30 hover:bg-grass hover:text-grass-foreground"
                    : "bg-secondary border-border text-muted-foreground hover:bg-secondary/70"
                }`}
              >
                {c.in ? <><UserCheck className="w-4 h-4" /> Check-in</> : <><UserX className="w-4 h-4" /> Assente</>}
              </button>
            </div>
          ))}
        </div>

        {/* Note */}
        <div className="mt-8 rounded-2xl border border-border bg-gradient-sky p-5">
          <div className="flex items-center gap-2 font-display text-lg font-bold mb-3">
            <NotebookPen className="w-5 h-5 text-primary" /> Note giornaliere
          </div>
          <textarea
            className="w-full min-h-[100px] rounded-xl border border-border p-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
            placeholder="Scrivi una nota per il team o per i genitori..."
          />
          <button className="mt-3 bg-gradient-royal text-primary-foreground rounded-xl px-4 py-2.5 font-bold shadow-sticker hover:scale-[1.02] transition-transform">
            Salva nota
          </button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/20 backdrop-blur-sm text-white rounded-xl py-2.5">
      <div className="font-display text-2xl font-bold">{value}</div>
      <div className="font-pixel text-white/70 mt-0.5">{label}</div>
    </div>
  );
}
