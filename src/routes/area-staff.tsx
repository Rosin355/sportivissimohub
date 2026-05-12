import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { MapPin, AlertTriangle, UserCheck, UserX, NotebookPen, Users } from "lucide-react";

export const Route = createFileRoute("/area-staff")({
  head: () => ({ meta: [{ title: "Area Staff — Sportivissimo" }] }),
  component: AreaStaff,
});

const children = [
  { name: "Marco R.",  age: 9, in: true, allergy: "Arachidi" },
  { name: "Sofia B.",  age: 6, in: true, allergy: null },
  { name: "Luca P.",   age: 8, in: false, allergy: null },
  { name: "Anna T.",   age: 7, in: true, allergy: "Lattosio" },
  { name: "Davide F.", age: 10, in: false, allergy: null },
];

function AreaStaff() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        {/* Sede selector */}
        <div className="rounded-3xl border-[3px] border-foreground/90 bg-gradient-grass text-grass-foreground p-5 shadow-pop">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white text-foreground grid place-items-center border-2 border-foreground/90">
              <MapPin className="w-6 h-6 text-flame" />
            </div>
            <div className="flex-1">
              <div className="font-pixel text-[10px]">SEDE OGGI</div>
              <div className="font-display text-xl font-bold">Galzignano Terme</div>
            </div>
            <button className="bg-white text-foreground border-2 border-foreground/90 rounded-xl px-3 py-2 font-bold text-sm">Cambia</button>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <Mini label="Iscritti" value="32" />
            <Mini label="Presenti" value="24" />
            <Mini label="Assenti"  value="8" />
          </div>
        </div>

        {/* Lista bambini */}
        <h2 className="font-display text-2xl font-bold mt-8 mb-3 flex items-center gap-2">
          <Users className="w-6 h-6 text-magic" /> Lista bambini · oggi
        </h2>
        <div className="space-y-3">
          {children.map((c) => (
            <div key={c.name} className="rounded-2xl border-[3px] border-foreground/90 bg-white shadow-card p-4 flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl border-2 border-foreground/90 grid place-items-center font-display font-bold text-lg ${c.in ? "bg-grass text-grass-foreground" : "bg-secondary"}`}>
                {c.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="font-bold">{c.name} <span className="text-foreground/60 font-normal">· {c.age}a</span></div>
                {c.allergy && (
                  <div className="text-xs font-bold text-coral inline-flex items-center gap-1 mt-0.5">
                    <AlertTriangle className="w-3 h-3" /> Allergia: {c.allergy}
                  </div>
                )}
              </div>
              <button className={`rounded-xl border-2 border-foreground/90 px-3 py-2 font-bold text-sm inline-flex items-center gap-1 ${c.in ? "bg-grass text-grass-foreground" : "bg-white"}`}>
                {c.in ? <><UserCheck className="w-4 h-4" /> Check-in</> : <><UserX className="w-4 h-4" /> Assente</>}
              </button>
            </div>
          ))}
        </div>

        {/* Note */}
        <div className="mt-8 rounded-2xl border-[3px] border-foreground/90 bg-gradient-sky p-4">
          <div className="flex items-center gap-2 font-display text-lg font-bold">
            <NotebookPen className="w-5 h-5" /> Note giornaliere
          </div>
          <textarea
            className="mt-2 w-full min-h-[100px] rounded-xl border-2 border-foreground/90 p-3 bg-white focus:outline-none focus:ring-2 focus:ring-magic"
            placeholder="Scrivi una nota per il team o per i genitori..."
          />
          <button className="mt-2 bg-gradient-sun text-sun-foreground border-[3px] border-foreground/90 rounded-2xl px-4 py-2 font-bold shadow-sticker">Salva nota</button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white text-foreground rounded-xl border-2 border-foreground/90 py-2">
      <div className="font-display text-xl font-bold">{value}</div>
      <div className="text-[11px] font-bold uppercase tracking-wide">{label}</div>
    </div>
  );
}
