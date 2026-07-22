import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { EnrollmentStatusBadge } from "@/components/site/EnrollmentStatusBadge";
import { GamifiedProgressBar } from "@/components/site/GamifiedProgressBar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Bell,
  FileCheck2,
  CreditCard,
  Plus,
  User,
  Heart,
  Trophy,
  Upload,
  Download,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  getEnrollments,
  getChildren,
  addChild,
  type Enrollment,
  type ChildRecord,
  type DocumentMeta,
} from "@/data/enrollments";
import { getLocationBySlug } from "@/data/locations";
import { requireRole } from "@/lib/supabase/auth";
import {
  uploadEnrollmentDocument,
  deleteEnrollmentDocument,
  requiredDocTypesForLocation,
} from "@/lib/enrollments/documents";
import { getDocumentDownloadUrl } from "@/lib/enrollments/server-fns";
import { childSchema } from "@/lib/enrollments/validation";
import { PdfDownloadButton } from "@/components/site/PdfDownloadButton";

export const Route = createFileRoute("/area-genitori")({
  beforeLoad: ({ context, location }) => ({
    auth: requireRole(context.auth, "genitore", location.href),
  }),
  head: () => ({ meta: [{ title: "Area Genitori — Sportivissimo" }] }),
  component: AreaGenitori,
});

function AreaGenitori() {
  const { auth } = Route.useRouteContext();
  const [list, setList] = useState<Enrollment[]>([]);
  const [children, setChildren] = useState<ChildRecord[]>([]);

  const refresh = useCallback(() => {
    getEnrollments()
      .then(setList)
      .catch(() => toast.error("Impossibile caricare le iscrizioni."));
    getChildren()
      .then(setChildren)
      .catch(() => toast.error("Impossibile caricare i figli registrati."));
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Documenti richiesti dalla sede vs caricati (i rifiutati non contano).
  const docTotals = list.reduce(
    (acc, e) => {
      const loc = getLocationBySlug(e.session.locationSlug);
      const required = loc ? requiredDocTypesForLocation(loc) : [];
      const ok = required.filter((type) =>
        e.documents.some((d) => d.type === type && d.status !== "rifiutato"),
      ).length;
      return { ok: acc.ok + ok, total: acc.total + required.length };
    },
    { ok: 0, total: 0 },
  );

  const greetingName = auth.firstName || auth.user.email.split("@")[0];

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
            <div className="font-pixel text-white/60 mb-0.5">Area genitori</div>
            <h1 className="font-display text-3xl font-bold text-white">Ciao, {greetingName}!</h1>
            <p className="text-sm text-white/65 mt-0.5">
              Da qui gestisci iscrizioni, figli e documenti.
            </p>
          </div>
          <Link
            to="/centri-estivi"
            className="relative bg-gradient-flame text-flame-foreground border-0 rounded-xl px-5 py-3 font-display font-bold shadow-sticker inline-flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <Plus className="w-4 h-4" /> Nuova iscrizione
          </Link>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <StatCard
            gradient="bg-gradient-grass"
            icon={<Heart className="w-5 h-5" />}
            label="Figli registrati"
            value={String(children.length)}
          />
          <StatCard
            gradient="bg-gradient-sun"
            icon={<Trophy className="w-5 h-5" />}
            label="Iscrizioni attive"
            value={String(list.filter((e) => e.status !== "annullata").length)}
          />
          <StatCard
            gradient="bg-gradient-magic"
            icon={<FileCheck2 className="w-5 h-5" />}
            label="Documenti caricati"
            value={`${docTotals.ok}/${docTotals.total}`}
          />
          <StatCard
            gradient="bg-gradient-royal"
            icon={<CreditCard className="w-5 h-5" />}
            label="Confermate"
            value={String(list.filter((e) => e.status === "confermata").length)}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mt-8">
          {/* Iscrizioni */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-display text-2xl font-bold">Le tue iscrizioni</h2>
            {list.length === 0 && (
              <div className="rounded-xl border border-dashed border-border bg-white p-6 text-center">
                <p className="text-muted-foreground mb-3">
                  Non hai ancora iscrizioni. Scegli una sede e parti con la prima missione!
                </p>
                <Link
                  to="/centri-estivi"
                  className="inline-flex items-center gap-2 bg-gradient-flame text-flame-foreground rounded-xl px-5 py-2.5 font-display font-bold shadow-sticker"
                >
                  <Plus className="w-4 h-4" /> Iscrivi un bambino
                </Link>
              </div>
            )}
            {list.map((e) => (
              <EnrollmentCard key={e.id} enrollment={e} userId={auth.user.id} onChange={refresh} />
            ))}
          </div>

          {/* Colonna destra: figli + comunicazioni */}
          <div className="space-y-4">
            <ChildrenPanel childrenList={children} onChange={refresh} />
            <Communications list={list} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function StatCard({
  gradient,
  icon,
  label,
  value,
}: {
  gradient: string;
  icon: ReactNode;
  label: string;
  value: string;
}) {
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

/* ---------- iscrizione con documenti ---------- */

function EnrollmentCard({
  enrollment,
  userId,
  onChange,
}: {
  enrollment: Enrollment;
  userId: string;
  onChange: () => void;
}) {
  const loc = getLocationBySlug(enrollment.session.locationSlug);
  const required = loc ? requiredDocTypesForLocation(loc) : [];
  const okCount = required.filter((type) =>
    enrollment.documents.some((d) => d.type === type && d.status !== "rifiutato"),
  ).length;
  const progress = required.length === 0 ? 100 : Math.round((okCount / required.length) * 100);
  const extraDocs = enrollment.documents.filter((d) => !required.includes(d.type));

  return (
    <div className="rounded-xl border border-border bg-white shadow-card p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="font-display text-lg font-bold">
            {enrollment.child.firstName}, {enrollment.child.age} anni
          </div>
          <div className="text-sm text-muted-foreground">
            {enrollment.session.locationName} · {enrollment.session.weekLabels.join(", ") || "—"}
          </div>
          <div className="font-pixel text-xs text-muted-foreground mt-0.5">{enrollment.code}</div>
        </div>
        <EnrollmentStatusBadge status={enrollment.status} />
      </div>

      <div className="mt-3">
        <GamifiedProgressBar
          value={progress}
          label={`Documenti richiesti ${okCount}/${required.length}`}
        />
      </div>

      <div className="mt-3 space-y-2">
        {required.map((type) => {
          const doc = enrollment.documents.find((d) => d.type === type);
          return (
            <DocumentRow
              key={type}
              type={type}
              doc={doc}
              userId={userId}
              enrollmentId={enrollment.id}
              onChange={onChange}
            />
          );
        })}
        {extraDocs.map((doc) => (
          <DocumentRow
            key={doc.id ?? doc.type}
            type={doc.type}
            doc={doc}
            userId={userId}
            enrollmentId={enrollment.id}
            onChange={onChange}
          />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <PdfDownloadButton
          enrollmentId={enrollment.id}
          template="tesseramento-acsi"
          label="Scarica modulo tesseramento"
        />
        <PdfDownloadButton
          enrollmentId={enrollment.id}
          template="iscrizione"
          label="Scarica modulo iscrizione"
        />
      </div>
    </div>
  );
}

const DOC_STATUS_CHIP: Record<string, { label: string; cls: string }> = {
  caricato: { label: "caricato", cls: "bg-sky/15 text-sky border-sky/30" },
  verificato: { label: "verificato", cls: "bg-grass/15 text-grass border-grass/30" },
  rifiutato: { label: "rifiutato", cls: "bg-flame/15 text-flame border-flame/30" },
};

function DocumentRow({
  type,
  doc,
  userId,
  enrollmentId,
  onChange,
}: {
  type: string;
  doc: DocumentMeta | undefined;
  userId: string;
  enrollmentId: string;
  onChange: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleUpload(file: File | null) {
    if (!file) return;
    setBusy(true);
    const res = await uploadEnrollmentDocument({ userId, enrollmentId, docType: type, file });
    setBusy(false);
    if (!res.ok) {
      toast.error(`${type}: ${res.error}`);
      return;
    }
    toast.success(`${type} caricato.`);
    onChange();
  }

  async function handleDownload() {
    if (!doc?.id) return;
    const res = await getDocumentDownloadUrl({ data: { documentId: doc.id } });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    window.open(res.url, "_blank", "noopener");
  }

  async function handleDelete() {
    if (!doc?.id || !doc.storagePath) return;
    setBusy(true);
    const res = await deleteEnrollmentDocument({ id: doc.id, storagePath: doc.storagePath });
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`${type} eliminato.`);
    onChange();
  }

  const chip = doc?.status ? DOC_STATUS_CHIP[doc.status] : null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/40 px-3 py-2">
      <div className="min-w-0">
        <div className="text-sm font-semibold truncate">{type}</div>
        {doc ? (
          <button
            onClick={handleDownload}
            className="text-xs text-muted-foreground hover:text-foreground underline truncate block max-w-full text-left"
            title="Scarica il documento"
          >
            {doc.fileName}
          </button>
        ) : (
          <div className="text-xs text-muted-foreground">Non ancora caricato</div>
        )}
        {doc?.status === "rifiutato" && doc.rejectionReason && (
          <div className="text-xs font-semibold text-flame mt-0.5 inline-flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> {doc.rejectionReason}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {chip && (
          <span className={`font-pixel border rounded-lg px-2 py-0.5 ${chip.cls}`}>
            {chip.label}
          </span>
        )}
        {doc && doc.status !== "verificato" && (
          <button
            onClick={handleDelete}
            disabled={busy}
            className="text-flame hover:text-flame/80 disabled:opacity-50"
            aria-label={`Elimina ${type}`}
            title="Elimina"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        {(!doc || doc.status === "rifiutato") && (
          <>
            <button
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold border border-primary text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" /> {busy ? "Caricamento…" : "Carica"}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="sr-only"
              onChange={(ev) => {
                handleUpload(ev.target.files?.[0] ?? null);
                ev.target.value = "";
              }}
            />
          </>
        )}
        {doc && doc.status !== "rifiutato" && (
          <button
            onClick={handleDownload}
            className="text-muted-foreground hover:text-foreground"
            aria-label={`Scarica ${type}`}
            title="Scarica"
          >
            <Download className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- figli ---------- */

function ChildrenPanel({
  childrenList,
  onChange,
}: {
  childrenList: ChildRecord[];
  onChange: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-2xl font-bold">I tuoi figli</h2>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-bold border border-dashed border-primary text-primary hover:bg-primary/10 transition-colors"
        >
          <Plus className="w-4 h-4" /> Aggiungi
        </button>
      </div>
      <div className="space-y-3">
        {childrenList.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-white p-4 text-sm text-muted-foreground">
            Nessun figlio registrato: verrà creato con la prima iscrizione, oppure aggiungilo da
            qui.
          </div>
        )}
        {childrenList.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-border bg-white shadow-card p-4 flex items-center gap-3"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-grass text-grass-foreground grid place-items-center font-display font-bold text-lg">
              {c.firstName.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="font-bold truncate">
                {c.firstName} {c.lastName}
                <span className="text-muted-foreground font-normal"> · {c.age} anni</span>
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {c.school ? `${c.school} · ${c.grade}` : "Scuola non indicata"}
              </div>
              {c.allergies && (
                <div className="text-xs font-semibold text-flame inline-flex items-center gap-1 mt-0.5">
                  <AlertTriangle className="w-3 h-3" /> {c.allergies}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <AddChildDialog
        open={open}
        onOpenChange={setOpen}
        onSaved={() => {
          setOpen(false);
          onChange();
        }}
      />
    </div>
  );
}

function AddChildDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: () => void;
}) {
  const form = useForm<z.infer<typeof childSchema>>({
    resolver: zodResolver(childSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      birthDate: "",
      fiscalCode: "",
      school: "",
      grade: "",
      allergies: "",
      medicalNotes: "",
      specialNeeds: "",
    },
  });

  async function onSubmit(values: z.infer<typeof childSchema>) {
    const res = await addChild(values);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Figlio aggiunto.");
    form.reset();
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Aggiungi un figlio</DialogTitle>
          <DialogDescription>
            I dati saranno riutilizzabili per le prossime iscrizioni.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Nome</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Cognome</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Data di nascita</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fiscalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Codice fiscale</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="school"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Scuola</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Classe</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="allergies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Allergie o intolleranze</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="medicalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Note mediche</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="specialNeeds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Bisogni specifici</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 font-display font-bold bg-gradient-royal text-primary-foreground shadow-sticker hover:scale-[1.01] transition-transform disabled:opacity-60"
            >
              <Plus className="w-4 h-4" />
              {form.formState.isSubmitting ? "Salvataggio…" : "Salva"}
            </button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- comunicazioni derivate dai dati reali ---------- */

function Communications({ list }: { list: Enrollment[] }) {
  const items: Array<{ grad: string; t: string; d: string }> = [];
  for (const e of list) {
    for (const doc of e.documents) {
      if (doc.status === "rifiutato") {
        items.push({
          grad: "bg-gradient-flame",
          t: `Documento rifiutato · ${e.child.firstName}`,
          d: doc.rejectionReason
            ? `${doc.type}: ${doc.rejectionReason}`
            : `${doc.type}: da ricaricare.`,
        });
      }
    }
    if (e.status === "documenti-mancanti") {
      items.push({
        grad: "bg-gradient-sun",
        t: "Documenti mancanti",
        d: `Completa i documenti per l'iscrizione di ${e.child.firstName} (${e.session.locationName}).`,
      });
    }
    if (e.status === "attesa-pagamento") {
      items.push({
        grad: "bg-gradient-magic",
        t: "In attesa di pagamento",
        d: `L'iscrizione di ${e.child.firstName} sarà confermata dopo il pagamento.`,
      });
    }
    if (e.status === "confermata") {
      items.push({
        grad: "bg-gradient-grass",
        t: "Iscrizione confermata",
        d: `${e.child.firstName} è in squadra! 🎉`,
      });
    }
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-bold mb-4">Comunicazioni</h2>
      <div className="space-y-4">
        {items.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-white p-4 text-sm text-muted-foreground">
            Nessuna comunicazione al momento.
          </div>
        )}
        {items.slice(0, 6).map((a, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-white shadow-card p-4 flex gap-3"
          >
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
  );
}
