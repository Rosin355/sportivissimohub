import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { EnrollmentStatusBadge } from "@/components/site/EnrollmentStatusBadge";
import { GamifiedProgressBar } from "@/components/site/GamifiedProgressBar";
import { Bell, FileCheck2, CreditCard, Plus, User, Heart, Trophy } from "lucide-react";
import { getEnrollments, type Enrollment } from "@/data/enrollments";

export const Route = createFileRoute("/area-genitori")({
  head: () => ({ meta: [{ title: "Area Genitori — Sportivissimo" }] }),
  component: AreaGenitori,
});

function AreaGenitori() {
  const [list, setList] = useState<Enrollment[]>([]);
  useEffect(() => { setList(getEnrollments()); }, []);

  const docOk = list.reduce((acc, e) => acc + e.documents.length, 0);
  const docTotal = list.length * 3;

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
          <Link to="/centri-estivi" className="relative bg-gradient-flame text-flame-foreground border-0 rounded-xl px-5 py-3 font-display font-bold shadow-sticker inline-flex items-center gap-2 hover:scale-105 transition-transform">
            <Plus className="w-4 h-4" /> Nuova iscrizione
          </Link>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <StatCard gradient="bg-gradient-grass" icon={<Heart className="w-5 h-5" />}      label="Figli registrati"  value={String(new Set(list.map((e) => e.child.firstName + e.child.lastName)).size || 0)} />
          <StatCard gradient="bg-gradient-sun"   icon={<Trophy className="w-5 h-5" />}     label="Iscrizioni attive" value={String(list.filter((e) => e.status !== "annullata").length)} />
          <StatCard gradient="bg-gradient-magic" icon={<FileCheck2 className="w-5 h-5" />} label="Documenti caricati" value={`${docOk}/${docTotal || 0}`} />
          <StatCard gradient="bg-gradient-royal" icon={<CreditCard className="w-5 h-5" />} label="Confermate"        value={String(list.filter((e) => e.status === "confermata").length)} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mt-8">
          {/* Iscrizioni */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-display text-2xl font-bold">Le tue iscrizioni</h2>
            {list.length === 0 && (
              <div className="rounded-xl border border-dashed border-border bg-white p-6 text-center">
                <p className="text-muted-foreground mb-3">Non hai ancora iscrizioni. Scegli una sede e parti con la prima missione!</p>
                <Link to="/centri-estivi" className="inline-flex items-center gap-2 bg-gradient-flame text-flame-foreground rounded-xl px-5 py-2.5 font-display font-bold shadow-sticker">
                  <Plus className="w-4 h-4" /> Iscrivi un bambino
                </Link>
              </div>
            )}
            {list.map((e) => {
              const progress =
                e.status === "confermata" ? 100 :
                e.status === "attesa-pagamento" ? 80 :
                e.status === "revisione" ? 60 :
                e.status === "documenti-mancanti" ? 45 :
                e.status === "nuova" ? 30 : 50;
              return (
                <EnrollmentRow
                  key={e.id}
                  child={`${e.child.firstName}, ${e.child.age} anni`}
                  location={`${e.session.locationName} · ${e.session.weekLabels.join(", ") || "—"}`}
                  status={e.status}
                  progress={progress}
                />
              );
            })}
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

function StatCard({ gradient, icon, label, value }: { gradient: string; icon: ReactNode; label: string; value: string }) {
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
