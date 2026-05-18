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

        {/* Page header */}
        <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
          <div>
            <span className="inline-flex items-center bg-primary/10 text-primary border border-primary/20 rounded-xl px-3 py-1 font-pixel mb-3">
              Control Room
            </span>
            <h1 className="font-display text-4xl font-bold">Dashboard Admin</h1>
            <p className="text-sm text-muted-foreground mt-1">Stagione 2026 · 9 sedi attive</p>
          </div>
          <button className="inline-flex items-center gap-2 bg-gradient-magic text-magic-foreground rounded-xl px-5 py-3 font-display font-bold shadow-sticker hover:scale-[1.02] transition-transform">
            <Download className="w-4 h-4" /> Esporta CSV
          </button>
        </div>

        {/* KPI grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI gradient="bg-gradient-royal" icon={<Users className="w-5 h-5" />}       label="Iscrizioni totali" value="487" trend="+38 settimana" />
          <KPI gradient="bg-gradient-sun"   icon={<ClipboardList className="w-5 h-5" />} label="Da approvare"    value="24"  trend="2 urgenti" />
          <KPI gradient="bg-gradient-magic" icon={<FileWarning className="w-5 h-5" />}  label="Doc. mancanti"   value="17"  trend="-5 oggi" />
          <KPI gradient="bg-gradient-flame" icon={<CreditCard className="w-5 h-5" />}   label="Pagamenti aperti" value="9"  trend="€ 2.140" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mt-8">
          {/* Posti per sede */}
          <div className="lg:col-span-2 rounded-2xl border border-border bg-white shadow-pop p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-2xl font-bold">Posti per sede</h2>
              <span className="font-pixel text-muted-foreground">aggiornato ora</span>
            </div>
            <div className="space-y-4">
              {[
                { name: "Galzignano Terme",    pct: 76, bar: "bg-gradient-sun" },
                { name: "Castegnero",          pct: 56, bar: "bg-gradient-grass" },
                { name: "Vo' Euganeo",         pct: 88, bar: "bg-gradient-flame" },
                { name: "Noventa Vicentina",   pct: 62, bar: "bg-gradient-royal" },
                { name: "Sossano",             pct: 92, bar: "bg-gradient-magic" },
              ].map((s) => (
                <div key={s.name}>
                  <div className="flex justify-between text-sm font-semibold mb-1.5">
                    <span className="inline-flex items-center gap-1.5 text-foreground">
                      <MapPin className="w-4 h-4 text-flame" /> {s.name}
                    </span>
                    <span className="font-pixel text-muted-foreground">{s.pct}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${s.bar}`} style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Oggi */}
          <div className="rounded-2xl border border-border bg-white shadow-pop p-6">
            <h2 className="font-display text-2xl font-bold mb-5">Oggi</h2>
            <div className="space-y-3">
              <TodayItem icon={<UserCheck className="w-5 h-5" />} gradient="bg-gradient-grass" label="Presenze"        value="312" />
              <TodayItem icon={<Calendar className="w-5 h-5" />}  gradient="bg-gradient-sun"   label="Settimane attive" value="6" />
              <TodayItem icon={<Users className="w-5 h-5" />}     gradient="bg-gradient-magic" label="Staff in turno"  value="48" />
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function KPI({ gradient, icon, label, value, trend }: { gradient: string; icon: React.ReactNode; label: string; value: string; trend: string }) {
  return (
    <div className="rounded-2xl bg-white shadow-pop border border-border overflow-hidden">
      <div className={`p-4 ${gradient} flex items-center justify-between`}>
        <div className="w-11 h-11 rounded-xl bg-white/20 grid place-items-center">
          <span className="text-white">{icon}</span>
        </div>
        <div className="font-display text-3xl font-bold text-white">{value}</div>
      </div>
      <div className="p-3">
        <div className="font-bold">{label}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{trend}</div>
      </div>
    </div>
  );
}

function TodayItem({ icon, gradient, label, value }: { icon: React.ReactNode; gradient: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/50 p-3">
      <div className={`w-10 h-10 rounded-xl grid place-items-center ${gradient}`}>
        <span className="text-white">{icon}</span>
      </div>
      <div className="flex-1 font-bold">{label}</div>
      <div className="font-display text-2xl font-bold">{value}</div>
    </div>
  );
}
