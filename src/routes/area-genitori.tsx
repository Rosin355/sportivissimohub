import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { EnrollmentStatusBadge } from "@/components/site/EnrollmentStatusBadge";
import { GamifiedProgressBar } from "@/components/site/GamifiedProgressBar";
import { Bell, FileCheck2, CreditCard, Plus, User, Heart, Trophy } from "lucide-react";

export const Route = createFileRoute("/area-genitori")({
  head: () => ({ meta: [{ title: "Area Genitori — Sportivissimo" }] }),
  component: AreaGenitori,
});

function AreaGenitori() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1 container mx-auto px-4 py-10">
        {/* Header genitore */}
        <div className="rounded-3xl border-[3px] border-foreground/90 bg-gradient-sky p-6 shadow-pop flex items-center gap-4 flex-wrap">
          <div className="w-16 h-16 rounded-2xl bg-white border-2 border-foreground/90 grid place-items-center">
            <User className="w-8 h-8 text-magic" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="font-pixel text-[10px]">CIAO, GENITORE</div>
            <h1 className="font-display text-3xl font-bold">Bentornata, Giulia!</h1>
            <p className="text-sm text-foreground/75">Hai sbloccato il livello "Famiglia Esperta" 🏆</p>
          </div>
          <button className="bg-gradient-sun text-sun-foreground border-[3px] border-foreground/90 rounded-2xl px-5 py-3 font-display font-bold shadow-sticker inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nuova iscrizione
          </button>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <StatCard color="bg-gradient-grass text-grass-foreground" icon={<Heart className="w-6 h-6" />} label="Figli registrati" value="2" />
          <StatCard color="bg-gradient-sun text-sun-foreground"     icon={<Trophy className="w-6 h-6" />} label="Iscrizioni attive" value="3" />
          <StatCard color="bg-gradient-magic text-magic-foreground" icon={<FileCheck2 className="w-6 h-6" />} label="Documenti OK" value="6/7" />
          <StatCard color="bg-gradient-royal text-primary-foreground" icon={<CreditCard className="w-6 h-6" />} label="Pagamenti in regola" value="100%" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mt-8">
          {/* Iscrizioni */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-display text-2xl font-bold">Iscrizioni in corso</h2>

            <EnrollmentRow child="Marco, 9 anni" location="Galzignano Terme · sett. 24-28 giu" status="confermata" progress={100} />
            <EnrollmentRow child="Marco, 9 anni" location="Galzignano Terme · sett. 1-5 lug"  status="attesa-pagamento" progress={75} />
            <EnrollmentRow child="Sofia, 6 anni" location="Vo' Euganeo · sett. 8-12 lug"     status="revisione" progress={60} />
          </div>

          {/* Comunicazioni */}
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-bold">Comunicazioni</h2>
            {[
              { c: "bg-sun text-sun-foreground", t: "Foto della settimana!", d: "Nuove foto del centro di Galzignano." },
              { c: "bg-magic text-magic-foreground", t: "Documento da firmare", d: "Patto educativo per Sofia." },
              { c: "bg-grass text-grass-foreground", t: "Iscrizione confermata", d: "Marco è in squadra! 🎉" },
            ].map((a, i) => (
              <div key={i} className="rounded-2xl border-[3px] border-foreground/90 bg-white shadow-card p-4 flex gap-3">
                <div className={`w-10 h-10 rounded-xl grid place-items-center border-2 border-foreground/90 ${a.c}`}>
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold">{a.t}</div>
                  <p className="text-sm text-foreground/75">{a.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function StatCard({ color, icon, label, value }: { color: string; icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-3xl border-[3px] border-foreground/90 bg-white shadow-pop overflow-hidden">
      <div className={`p-4 ${color} flex items-center justify-between`}>
        <div className="w-12 h-12 rounded-2xl bg-white/95 text-foreground grid place-items-center border-2 border-foreground/90">{icon}</div>
        <div className="font-display text-3xl font-bold">{value}</div>
      </div>
      <div className="p-3 text-sm font-bold text-center">{label}</div>
    </div>
  );
}

function EnrollmentRow({ child, location, status, progress }: { child: string; location: string; status: Parameters<typeof EnrollmentStatusBadge>[0]["status"]; progress: number }) {
  return (
    <div className="rounded-2xl border-[3px] border-foreground/90 bg-white shadow-card p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="font-display text-lg font-bold">{child}</div>
          <div className="text-sm text-foreground/70">{location}</div>
        </div>
        <EnrollmentStatusBadge status={status} />
      </div>
      <div className="mt-3">
        <GamifiedProgressBar value={progress} label="Avanzamento iscrizione" />
      </div>
    </div>
  );
}
