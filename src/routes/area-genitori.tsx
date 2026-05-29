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
        <div className="rounded-2xl bg-gradient-cta-banner text-white p-6 shadow-pop flex items-center gap-4 flex-wrap relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-magic/25 blur-[60px]" />
          </div>
          <div className="relative w-14 h-14 rounded-xl bg-white/15 border border-white/20 grid place-items-center">
            <User className="w-7 h-7 text-white" />
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <div className="font-pixel text-white/60 mb-0.5">Ciao, genitore</div>
            <h1 className="font-display text-3xl font-bold text-white">Bentornata, Giulia!</h1>
            <p className="text-sm text-white/65 mt-0.5">Hai sbloccato il livello "Famiglia Esperta" 🏆</p>
          </div>
          <button className="relative bg-gradient-flame text-flame-foreground border-0 rounded-xl px-5 py-3 font-display font-bold shadow-sticker inline-flex items-center gap-2 hover:scale-105 transition-transform">
            <Plus className="w-4 h-4" /> Nuova iscrizione
          </button>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <StatCard gradient="bg-gradient-grass" icon={<Heart className="w-5 h-5" />}        label="Figli registrati"    value="2" />
          <StatCard gradient="bg-gradient-sun"   icon={<Trophy className="w-5 h-5" />}       label="Iscrizioni attive"   value="3" />
          <StatCard gradient="bg-gradient-magic" icon={<FileCheck2 className="w-5 h-5" />}   label="Documenti OK"        value="6/7" />
          <StatCard gradient="bg-gradient-royal" icon={<CreditCard className="w-5 h-5" />}   label="Pagamenti in regola" value="100%" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mt-8">
          {/* Iscrizioni */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-display text-2xl font-bold">Iscrizioni in corso</h2>
            <EnrollmentRow child="Marco, 9 anni" location="Galzignano Terme · sett. 24-28 giu" status="confermata"        progress={100} />
            <EnrollmentRow child="Marco, 9 anni" location="Galzignano Terme · sett. 1-5 lug"  status="attesa-pagamento"  progress={75} />
            <EnrollmentRow child="Sofia, 6 anni" location="Vo' Euganeo · sett. 8-12 lug"      status="revisione"         progress={60} />
          </div>

          {/* Comunicazioni */}
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-bold">Comunicazioni</h2>
            {[
              { grad: "bg-gradient-sun",   t: "Foto della settimana!",   d: "Nuove foto del centro di Galzignano." },
              { grad: "bg-gradient-magic", t: "Documento da firmare",    d: "Patto educativo per Sofia." },
              { grad: "bg-gradient-grass", t: "Iscrizione confermata",   d: "Marco è in squadra! 🎉" },
            ].map((a, i) => (
              <div key={i} className="rounded-xl border border-border bg-white shadow-card p-4 flex gap-3">
                <div className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${a.grad}`}>
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-bold">{a.t}</div>
                  <p className="text-sm text-muted-foreground">{a.d}</p>
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

function StatCard({ gradient, icon, label, value }: { gradient: string; icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white shadow-pop border border-border overflow-hidden">
      <div className={`p-4 ${gradient} flex items-center justify-between`}>
        <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm grid place-items-center">
          <span className="text-white">{icon}</span>
        </div>
        <div className="font-display text-3xl font-bold text-white">{value}</div>
      </div>
      <div className="p-3 text-sm font-bold text-center text-foreground">{label}</div>
    </div>
  );
}

function EnrollmentRow({
  child,
  location,
  status,
  progress,
}: {
  child: string;
  location: string;
  status: Parameters<typeof EnrollmentStatusBadge>[0]["status"];
  progress: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-white shadow-card p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="font-display text-lg font-bold">{child}</div>
          <div className="text-sm text-muted-foreground">{location}</div>
        </div>
        <EnrollmentStatusBadge status={status} />
      </div>
      <div className="mt-3">
        <GamifiedProgressBar value={progress} label="Avanzamento iscrizione" />
      </div>
    </div>
  );
}
