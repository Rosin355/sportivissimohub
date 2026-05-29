import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { EnrollmentStatusBadge } from "@/components/site/EnrollmentStatusBadge";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  getEnrollments, updateEnrollmentStatus,
  type Enrollment, type EnrollmentStatus,
} from "@/data/enrollments";
import { LOCATIONS } from "@/data/locations";
import { Users, FileWarning, CreditCard, ClipboardList, Eye, FileText } from "lucide-react";

export const Route = createFileRoute("/area-admin")({
  head: () => ({ meta: [{ title: "Area Admin — Sportivissimo" }] }),
  component: AreaAdmin,
});

const STATUSES: EnrollmentStatus[] = [
  "nuova", "revisione", "documenti-mancanti", "attesa-pagamento", "confermata", "lista-attesa", "annullata",
];

function AreaAdmin() {
  const [list, setList] = useState<Enrollment[]>([]);
  const [filterStatus, setFilterStatus] = useState<EnrollmentStatus | "all">("all");
  const [filterLocation, setFilterLocation] = useState<string>("all");
  const [selected, setSelected] = useState<Enrollment | null>(null);

  useEffect(() => { setList(getEnrollments()); }, []);
  function refresh() { setList(getEnrollments()); }

  const filtered = useMemo(() => list.filter((e) =>
    (filterStatus === "all" || e.status === filterStatus) &&
    (filterLocation === "all" || e.session.locationSlug === filterLocation)
  ), [list, filterStatus, filterLocation]);

  const stats = useMemo(() => ({
    total: list.length,
    nuove: list.filter((e) => e.status === "nuova" || e.status === "revisione").length,
    docMissing: list.filter((e) => e.status === "documenti-mancanti").length,
    payment: list.filter((e) => e.status === "attesa-pagamento").length,
  }), [list]);

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
          <button onClick={refresh} className="inline-flex items-center gap-2 bg-gradient-magic text-magic-foreground rounded-xl px-5 py-3 font-display font-bold shadow-sticker hover:scale-[1.02] transition-transform">
            Aggiorna lista
          </button>
        </div>

        {/* KPI grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI gradient="bg-gradient-royal" icon={<Users className="w-5 h-5" />}        label="Iscrizioni totali" value={String(stats.total)} trend="Tutte le sedi" />
          <KPI gradient="bg-gradient-sun"   icon={<ClipboardList className="w-5 h-5" />} label="Da approvare"     value={String(stats.nuove)} trend="Nuove + in revisione" />
          <KPI gradient="bg-gradient-magic" icon={<FileWarning className="w-5 h-5" />}   label="Doc. mancanti"    value={String(stats.docMissing)} trend="Da sollecitare" />
          <KPI gradient="bg-gradient-flame" icon={<CreditCard className="w-5 h-5" />}    label="Attesa pagamento" value={String(stats.payment)} trend="Da contattare" />
        </div>

        {/* Filtri */}
        <div className="mt-8 rounded-2xl border border-border bg-white shadow-pop p-5">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
            <div>
              <h2 className="font-display text-2xl font-bold">Iscrizioni</h2>
              <p className="text-sm text-muted-foreground">{filtered.length} su {list.length}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} className="rounded-xl border border-border bg-white px-3 py-2 text-sm font-semibold">
                <option value="all">Tutte le sedi</option>
                {LOCATIONS.map((l) => <option key={l.slug} value={l.slug}>{l.name}</option>)}
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as EnrollmentStatus | "all")} className="rounded-xl border border-border bg-white px-3 py-2 text-sm font-semibold">
                <option value="all">Tutti gli stati</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left font-pixel text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3">Bambino</th>
                  <th className="py-2 pr-3">Genitore</th>
                  <th className="py-2 pr-3">Sede</th>
                  <th className="py-2 pr-3">Settimane</th>
                  <th className="py-2 pr-3">Stato</th>
                  <th className="py-2 pr-3">Data</th>
                  <th className="py-2 pr-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-3 font-semibold">{e.child.firstName} {e.child.lastName}</td>
                    <td className="py-3 pr-3">{e.guardian.firstName} {e.guardian.lastName}</td>
                    <td className="py-3 pr-3">{e.session.locationName}</td>
                    <td className="py-3 pr-3">{e.session.weekLabels.length} sett.</td>
                    <td className="py-3 pr-3"><EnrollmentStatusBadge status={e.status} /></td>
                    <td className="py-3 pr-3 text-muted-foreground">{new Date(e.createdAt).toLocaleDateString("it-IT")}</td>
                    <td className="py-3 pr-3 text-right">
                      <button onClick={() => setSelected(e)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border border-border hover:bg-secondary">
                        <Eye className="w-3.5 h-3.5" /> Dettagli
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Nessuna iscrizione con questi filtri.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <EnrollmentSheet enrollment={selected} onClose={() => setSelected(null)} onUpdate={refresh} />
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

function EnrollmentSheet({ enrollment, onClose, onUpdate }: { enrollment: Enrollment | null; onClose: () => void; onUpdate: () => void }) {
  const [notes, setNotes] = useState("");
  useEffect(() => { setNotes(enrollment?.adminNotes ?? ""); }, [enrollment]);
  if (!enrollment) return null;

  function setStatus(s: EnrollmentStatus) {
    updateEnrollmentStatus(enrollment!.id, s, notes);
    onUpdate();
  }

  return (
    <Sheet open={!!enrollment} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">Iscrizione {enrollment.id}</SheetTitle>
          <SheetDescription>Creata il {new Date(enrollment.createdAt).toLocaleString("it-IT")}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <Section title="Stato">
            <div className="flex items-center gap-3 flex-wrap">
              <EnrollmentStatusBadge status={enrollment.status} />
              <select
                value={enrollment.status}
                onChange={(e) => setStatus(e.target.value as EnrollmentStatus)}
                className="rounded-xl border border-border bg-white px-3 py-1.5 text-sm font-semibold"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </Section>

          <Section title="Genitore">
            <KV k="Nome" v={`${enrollment.guardian.firstName} ${enrollment.guardian.lastName}`} />
            <KV k="Email" v={enrollment.guardian.email} />
            <KV k="Telefono" v={enrollment.guardian.phone} />
            <KV k="Codice fiscale" v={enrollment.guardian.fiscalCode} />
            <KV k="Indirizzo" v={`${enrollment.guardian.address}, ${enrollment.guardian.zip} ${enrollment.guardian.city} (${enrollment.guardian.province})`} />
          </Section>

          <Section title="Bambino">
            <KV k="Nome" v={`${enrollment.child.firstName} ${enrollment.child.lastName}`} />
            <KV k="Data nascita" v={enrollment.child.birthDate} />
            <KV k="Età" v={`${enrollment.child.age} anni`} />
            <KV k="Scuola / classe" v={`${enrollment.child.school} · ${enrollment.child.grade}`} />
            <KV k="Allergie" v={enrollment.child.allergies || "—"} />
            <KV k="Note mediche" v={enrollment.child.medicalNotes || "—"} />
          </Section>

          <Section title="Sede & settimane">
            <KV k="Sede" v={enrollment.session.locationName} />
            <KV k="Settimane" v={enrollment.session.weekLabels.join(", ") || "—"} />
            <KV k="Orario" v={enrollment.session.timeSlot} />
            <KV k="Servizi extra" v={enrollment.session.extras.join(", ") || "Nessuno"} />
          </Section>

          <Section title="Consensi">
            <KV k="Privacy" v={enrollment.consents.privacy ? "Sì" : "No"} />
            <KV k="Foto/video" v={enrollment.consents.photos ? "Sì" : "No"} />
            <KV k="Uscite" v={enrollment.consents.outings ? "Sì" : "No"} />
            <KV k="Regolamento" v={enrollment.consents.rules ? "Sì" : "No"} />
          </Section>

          <Section title="Delegati al ritiro">
            {enrollment.delegates.length === 0
              ? <div className="text-sm text-muted-foreground">Nessun delegato.</div>
              : enrollment.delegates.map((d, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-semibold">{d.firstName} {d.lastName}</span> · {d.phone} · {d.document}
                  </div>
                ))}
          </Section>

          <Section title="Documenti">
            {enrollment.documents.length === 0
              ? <div className="text-sm text-muted-foreground">Nessun documento.</div>
              : enrollment.documents.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-magic" />
                    <span className="text-muted-foreground">{d.type}:</span>
                    <span className="font-semibold">{d.fileName}</span>
                    <span className="text-xs text-muted-foreground">({(d.size / 1024).toFixed(0)} KB)</span>
                  </div>
                ))}
          </Section>

          <Section title="Note admin (interne)">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Note visibili solo allo staff." rows={3} />
            <button
              onClick={() => { updateEnrollmentStatus(enrollment.id, enrollment.status, notes); onUpdate(); }}
              className="mt-2 inline-flex items-center gap-2 rounded-xl px-4 py-2 font-display font-bold bg-gradient-royal text-primary-foreground shadow-sticker"
            >
              Salva note
            </button>
          </Section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-secondary/40 p-4">
      <div className="font-display text-lg font-bold mb-2">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-semibold text-right">{v}</span>
    </div>
  );
}
