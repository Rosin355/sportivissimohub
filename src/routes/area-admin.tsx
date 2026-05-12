import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Users, FileWarning, CreditCard, MapPin, Calendar, Download, UserCheck, ClipboardList } from "lucide-react";

export const Route = createFileRoute("/area-admin")({
  head: () => ({ meta: [{ title: "Area Admin — Sportivissimo" }] }),
  component: AreaAdmin,
});

function AreaAdmin() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <span className="inline-block bg-white border-[3px] border-foreground/90 rounded-full px-3 py-1 font-pixel text-[10px] shadow-sticker">CONTROL ROOM</span>
            <h1 className="font-display text-4xl font-bold mt-3">Dashboard Admin</h1>
            <p className="text-sm text-foreground/70">Stagione 2026 · 9 sedi attive</p>
          </div>
          <button className="inline-flex items-center gap-2 bg-gradient-magic text-magic-foreground border-[3px] border-foreground/90 rounded-2xl px-5 py-3 font-display font-bold shadow-sticker">
            <Download className="w-4 h-4" /> Esporta CSV
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <KPI color="bg-gradient-royal text-primary-foreground" icon={<Users className="w-6 h-6" />} label="Iscrizioni totali" value="487" trend="+38 settimana" />
          <KPI color="bg-gradient-sun text-sun-foreground"       icon={<ClipboardList className="w-6 h-6" />} label="Da approvare" value="24" trend="2 urgenti" />
          <KPI color="bg-gradient-magic text-magic-foreground"   icon={<FileWarning className="w-6 h-6" />} label="Doc. mancanti" value="17" trend="-5 oggi" />
          <KPI color="bg-gradient-grass text-grass-foreground"   icon={<CreditCard className="w-6 h-6" />} label="Pagamenti aperti" value="9" trend="€ 2.140" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2 rounded-3xl border-[3px] border-foreground/90 bg-white shadow-pop p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold">Posti per sede</h2>
              <span className="text-sm font-bold text-foreground/70">aggiornato ora</span>
            </div>
            <div className="mt-4 space-y-3">
              {[
                { name: "Galzignano Terme", pct: 76, col: "bg-gradient-sun" },
                { name: "Castegnero", pct: 56, col: "bg-gradient-grass" },
                { name: "Vo' Euganeo", pct: 88, col: "bg-gradient-magic" },
                { name: "Noventa Vicentina", pct: 62, col: "bg-gradient-royal" },
                { name: "Sossano", pct: 92, col: "bg-gradient-sun" },
              ].map((s) => (
                <div key={s.name} className="grid grid-cols-[1fr_auto] gap-2 items-center">
                  <div>
                    <div className="flex justify-between text-sm font-bold">
                      <span className="inline-flex items-center gap-1"><MapPin className="w-4 h-4 text-flame" /> {s.name}</span>
                      <span className="font-pixel text-[10px]">{s.pct}%</span>
                    </div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden border-2 border-foreground/90 mt-1">
                      <div className={`h-full ${s.col}`} style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border-[3px] border-foreground/90 bg-white shadow-pop p-5">
            <h2 className="font-display text-2xl font-bold">Oggi</h2>
            <div className="mt-4 space-y-3">
              <TodayItem icon={<UserCheck className="w-5 h-5" />} color="bg-grass text-grass-foreground" label="Presenze" value="312" />
              <TodayItem icon={<Calendar className="w-5 h-5" />} color="bg-sun text-sun-foreground" label="Settimane attive" value="6" />
              <TodayItem icon={<Users className="w-5 h-5" />} color="bg-magic text-magic-foreground" label="Staff in turno" value="48" />
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function KPI({ color, icon, label, value, trend }: { color: string; icon: React.ReactNode; label: string; value: string; trend: string }) {
  return (
    <div className="rounded-3xl border-[3px] border-foreground/90 bg-white shadow-pop overflow-hidden">
      <div className={`p-4 ${color} flex items-center justify-between`}>
        <div className="w-12 h-12 rounded-2xl bg-white/95 text-foreground grid place-items-center border-2 border-foreground/90">{icon}</div>
        <div className="font-display text-3xl font-bold">{value}</div>
      </div>
      <div className="p-3">
        <div className="font-bold">{label}</div>
        <div className="text-xs text-foreground/70">{trend}</div>
      </div>
    </div>
  );
}

function TodayItem({ icon, color, label, value }: { icon: React.ReactNode; color: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border-2 border-foreground/90 bg-secondary/40 p-3">
      <div className={`w-10 h-10 rounded-xl grid place-items-center border-2 border-foreground/90 ${color}`}>{icon}</div>
      <div className="flex-1 font-bold">{label}</div>
      <div className="font-display text-2xl font-bold">{value}</div>
    </div>
  );
}
