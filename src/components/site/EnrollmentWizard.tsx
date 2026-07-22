import type { ReactNode, Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useRouteContext } from "@tanstack/react-router";
import {
  readDraft,
  writeDraft,
  clearDraft,
  type GuardianData,
  type ChildData,
  type SessionData,
  type PickupDelegate,
  type ConsentsData,
  type DocumentMeta,
} from "@/data/enrollments";
import { submitEnrollment } from "@/lib/enrollments/server-fns";
import { enrollmentSubmissionSchema } from "@/lib/enrollments/validation";
import { uploadEnrollmentDocument, validateDocumentFile } from "@/lib/enrollments/documents";
import { toast } from "sonner";
import type { Location } from "@/data/locations";
import { WizardProgress } from "@/components/site/WizardProgress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Upload,
  FileText,
  PartyPopper,
  MapPin,
} from "lucide-react";

const STEP_LABELS = ["Genitore", "Bambino", "Sede", "Deleghe", "Documenti", "Riepilogo"];

type WizardState = {
  guardian: GuardianData;
  child: ChildData;
  session: SessionData;
  delegates: PickupDelegate[];
  consents: ConsentsData;
  documents: DocumentMeta[];
};

const emptyGuardian: GuardianData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  fiscalCode: "",
  address: "",
  city: "",
  province: "",
  zip: "",
};
const emptyChild: ChildData = {
  firstName: "",
  lastName: "",
  birthDate: "",
  fiscalCode: "",
  age: 0,
  school: "",
  grade: "",
  allergies: "",
  medicalNotes: "",
  specialNeeds: "",
};

function calcAge(birth: string) {
  if (!birth) return 0;
  const d = new Date(birth);
  if (isNaN(d.getTime())) return 0;
  const diff = Date.now() - d.getTime();
  return Math.max(0, Math.floor(diff / (365.25 * 24 * 3600 * 1000)));
}

const DOC_TYPES = [
  "Documento genitore",
  "Tessera sanitaria bambino/a",
  "Certificato medico",
  "Altro",
];

export function EnrollmentWizard({ location }: { location: Location }) {
  const navigate = useNavigate();
  const { auth } = useRouteContext({ from: "__root__" });
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // File reali selezionati nello StepDocuments, per doc_type. Non finiscono
  // nella bozza localStorage: dopo un reload vanno riselezionati.
  const docFilesRef = useRef(new Map<string, File>());

  const [state, setState] = useState<WizardState>(() => ({
    guardian: emptyGuardian,
    child: emptyChild,
    session: {
      locationSlug: location.slug,
      locationName: location.name,
      weekIds: [],
      weekLabels: [],
      timeSlot: location.timeSlots[0] ?? "",
      extras: [],
    },
    delegates: [],
    consents: {
      privacy: false,
      photos: false,
      outings: false,
      rules: false,
      dataProcessing: false,
    },
    documents: [],
  }));

  // hydrate draft once
  const hydrated = useRef(false);
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const draft = readDraft<WizardState>(location.slug);
    if (draft) {
      setState({
        ...draft,
        session: { ...draft.session, locationSlug: location.slug, locationName: location.name },
      });
    }
  }, [location.slug, location.name]);

  // persist draft on change
  useEffect(() => {
    if (!hydrated.current) return;
    writeDraft(location.slug, state);
  }, [state, location.slug]);

  const total = STEP_LABELS.length;

  function next() {
    const err = validateStep(step, state, location);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => Math.min(total, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function back() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    const err = validateStep(6, state, location);
    if (err) {
      setError(err);
      return;
    }
    // Validazione zod speculare a validateStep (regex CF reale inclusa); la
    // stessa schema viene rieseguita nella server function.
    const parsed = enrollmentSubmissionSchema.safeParse({
      guardian: state.guardian,
      child: state.child,
      session: state.session,
      delegates: state.delegates,
      consents: state.consents,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Controlla i dati inseriti.");
      return;
    }
    if (!auth) {
      // La bozza resta in localStorage: al ritorno dal login si riparte da qui.
      navigate({
        to: "/login",
        search: { next: `/centri-estivi/${location.slug}/iscrizione` },
      });
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const result = await submitEnrollment({ data: parsed.data });
      if (!result.ok) {
        setError(result.error);
        return;
      }

      // Upload dei documenti selezionati nel bucket privato, ora che esiste
      // l'iscrizione. Un errore qui non blocca la conferma: si può ricaricare
      // dall'area genitori.
      const toUpload = state.documents.filter((d) => docFilesRef.current.has(d.type));
      let failed = 0;
      for (const doc of toUpload) {
        const file = docFilesRef.current.get(doc.type);
        if (!file) continue;
        const upload = await uploadEnrollmentDocument({
          userId: auth.user.id,
          enrollmentId: result.id,
          docType: doc.type,
          file,
        });
        if (!upload.ok) {
          failed++;
          toast.error(`${doc.type}: ${upload.error}`);
        }
      }
      if (toUpload.length > 0 && failed === 0) {
        toast.success("Documenti caricati.");
      } else if (failed > 0) {
        toast.warning("Potrai ricaricare i documenti mancanti dall'area genitori.");
      }
      if (state.documents.length > toUpload.length) {
        toast.info("Alcuni documenti della bozza vanno ricaricati dall'area genitori.");
      }

      clearDraft(location.slug);
      setSubmitted(result.code);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Errore durante l'invio. Controlla la connessione e riprova.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <SuccessScreen
        id={submitted}
        location={location}
        onParents={() => navigate({ to: "/area-genitori" })}
      />
    );
  }

  return (
    <div className="space-y-6">
      <WizardProgress current={step} total={total} labels={STEP_LABELS} />

      <div className="rounded-2xl bg-white border border-border shadow-pop p-6 md:p-8">
        {step === 1 && <StepGuardian state={state} setState={setState} />}
        {step === 2 && <StepChild state={state} setState={setState} />}
        {step === 3 && <StepSession state={state} setState={setState} location={location} />}
        {step === 4 && <StepDelegates state={state} setState={setState} />}
        {step === 5 && (
          <StepDocuments state={state} setState={setState} files={docFilesRef.current} />
        )}
        {step === 6 && <StepSummary state={state} location={location} />}

        {step === total && !auth && (
          <div className="mt-5 bg-sky/10 border border-sky/30 rounded-xl px-4 py-3 text-sm font-semibold">
            Per inviare l'iscrizione devi accedere o creare un account. La bozza resta salvata su
            questo dispositivo.
          </div>
        )}

        {error && (
          <div className="mt-5 bg-flame/10 border border-flame/30 text-flame rounded-xl px-4 py-3 text-sm font-semibold">
            {error}
          </div>
        )}

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={back}
            disabled={step === 1}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-display font-bold border border-border bg-white text-foreground disabled:opacity-40 hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Indietro
          </button>
          <Link
            to="/centri-estivi/$slug"
            params={{ slug: location.slug }}
            className="text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Esci e salva bozza
          </Link>
          {step < total ? (
            <button
              onClick={next}
              className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 font-display font-bold bg-gradient-royal text-primary-foreground shadow-sticker hover:scale-105 transition-transform"
            >
              Avanti <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 font-display font-bold bg-gradient-flame text-flame-foreground shadow-sticker hover:scale-105 transition-transform disabled:opacity-60 disabled:hover:scale-100"
            >
              <PartyPopper className="w-4 h-4" />
              {submitting ? "Invio in corso…" : auth ? "Invia iscrizione" : "Accedi e invia"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- validation ----------------------------- */

function validateStep(step: number, s: WizardState, loc: Location): string | null {
  if (step === 1) {
    const g = s.guardian;
    if (!g.firstName || !g.lastName) return "Inserisci nome e cognome del genitore.";
    if (!/^\S+@\S+\.\S+$/.test(g.email)) return "Inserisci un'email valida.";
    if (g.phone.replace(/\D/g, "").length < 8) return "Inserisci un numero di telefono valido.";
    if (g.fiscalCode.length < 11) return "Codice fiscale del genitore non valido.";
    if (!g.address || !g.city || !g.province || !g.zip) return "Completa l'indirizzo.";
  }
  if (step === 2) {
    const c = s.child;
    if (!c.firstName || !c.lastName) return "Inserisci nome e cognome del bambino.";
    if (!c.birthDate) return "Inserisci la data di nascita.";
    if (c.fiscalCode.length < 11) return "Codice fiscale del bambino non valido.";
    if (!c.school || !c.grade) return "Completa scuola e classe.";
  }
  if (step === 3) {
    if (s.session.weekIds.length === 0) return "Seleziona almeno una settimana.";
    if (!s.session.timeSlot) return "Scegli una fascia oraria.";
    void loc;
  }
  if (step === 4) {
    for (const d of s.delegates) {
      if (!d.firstName || !d.lastName || !d.phone)
        return "Completa i dati di tutti i delegati o eliminali.";
    }
    const c = s.consents;
    if (!c.privacy || !c.rules || !c.dataProcessing)
      return "Devi accettare privacy, regolamento e trattamento dati.";
  }
  if (step === 6) {
    return (
      validateStep(1, s, loc) ||
      validateStep(2, s, loc) ||
      validateStep(3, s, loc) ||
      validateStep(4, s, loc)
    );
  }
  return null;
}

/* ----------------------------- step components ----------------------------- */

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: ReactNode; full?: boolean }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <Label className="font-semibold mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}

type SetState = Dispatch<SetStateAction<WizardState>>;

function StepGuardian({ state, setState }: { state: WizardState; setState: SetState }) {
  const g = state.guardian;
  const upd = (k: keyof GuardianData, v: string) =>
    setState((s) => ({ ...s, guardian: { ...s.guardian, [k]: v } }));
  return (
    <div>
      <SectionTitle
        title="Dati genitore o tutore"
        subtitle="Servono per i contatti e la documentazione ufficiale."
      />
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Nome">
          <Input value={g.firstName} onChange={(e) => upd("firstName", e.target.value)} />
        </Field>
        <Field label="Cognome">
          <Input value={g.lastName} onChange={(e) => upd("lastName", e.target.value)} />
        </Field>
        <Field label="Email">
          <Input type="email" value={g.email} onChange={(e) => upd("email", e.target.value)} />
        </Field>
        <Field label="Telefono">
          <Input value={g.phone} onChange={(e) => upd("phone", e.target.value)} />
        </Field>
        <Field label="Codice fiscale" full>
          <Input
            value={g.fiscalCode}
            onChange={(e) => upd("fiscalCode", e.target.value.toUpperCase())}
          />
        </Field>
        <Field label="Indirizzo" full>
          <Input value={g.address} onChange={(e) => upd("address", e.target.value)} />
        </Field>
        <Field label="Comune">
          <Input value={g.city} onChange={(e) => upd("city", e.target.value)} />
        </Field>
        <Field label="Provincia">
          <Input
            value={g.province}
            onChange={(e) => upd("province", e.target.value.toUpperCase())}
            maxLength={2}
          />
        </Field>
        <Field label="CAP">
          <Input value={g.zip} onChange={(e) => upd("zip", e.target.value)} maxLength={5} />
        </Field>
      </div>
    </div>
  );
}

function StepChild({ state, setState }: { state: WizardState; setState: SetState }) {
  const c = state.child;
  const upd = (k: keyof ChildData, v: string | number) =>
    setState((s) => ({ ...s, child: { ...s.child, [k]: v } }));
  const age = calcAge(c.birthDate);
  return (
    <div>
      <SectionTitle
        title="Dati del bambino o della bambina"
        subtitle="Ci aiutano a creare l'esperienza migliore per lui o lei."
      />
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Nome">
          <Input value={c.firstName} onChange={(e) => upd("firstName", e.target.value)} />
        </Field>
        <Field label="Cognome">
          <Input value={c.lastName} onChange={(e) => upd("lastName", e.target.value)} />
        </Field>
        <Field label="Data di nascita">
          <Input
            type="date"
            value={c.birthDate}
            onChange={(e) => upd("birthDate", e.target.value)}
          />
        </Field>
        <Field label="Età">
          <div className="rounded-md border border-input bg-secondary px-3 py-2 text-sm font-semibold">
            {age > 0 ? `${age} anni` : "—"}
          </div>
        </Field>
        <Field label="Codice fiscale" full>
          <Input
            value={c.fiscalCode}
            onChange={(e) => upd("fiscalCode", e.target.value.toUpperCase())}
          />
        </Field>
        <Field label="Scuola frequentata">
          <Input value={c.school} onChange={(e) => upd("school", e.target.value)} />
        </Field>
        <Field label="Classe">
          <Input value={c.grade} onChange={(e) => upd("grade", e.target.value)} />
        </Field>
        <Field label="Allergie o intolleranze" full>
          <Textarea
            value={c.allergies}
            onChange={(e) => upd("allergies", e.target.value)}
            placeholder="Es. lattosio, nichel, polline..."
          />
        </Field>
        <Field label="Note mediche importanti" full>
          <Textarea
            value={c.medicalNotes}
            onChange={(e) => upd("medicalNotes", e.target.value)}
            placeholder="Terapie in corso, farmaci, condizioni rilevanti..."
          />
        </Field>
        <Field label="Bisogni specifici o attenzioni particolari" full>
          <Textarea
            value={c.specialNeeds}
            onChange={(e) => upd("specialNeeds", e.target.value)}
            placeholder="Tutto quello che dobbiamo sapere per accoglierlo al meglio."
          />
        </Field>
      </div>
    </div>
  );
}

function StepSession({
  state,
  setState,
  location,
}: {
  state: WizardState;
  setState: SetState;
  location: Location;
}) {
  const sess = state.session;
  const toggleWeek = (id: string, label: string) => {
    const isSel = sess.weekIds.includes(id);
    const ids = isSel ? sess.weekIds.filter((x) => x !== id) : [...sess.weekIds, id];
    const labels = isSel ? sess.weekLabels.filter((x) => x !== label) : [...sess.weekLabels, label];
    setState((s) => ({ ...s, session: { ...s.session, weekIds: ids, weekLabels: labels } }));
  };
  const toggleExtra = (id: string) => {
    const isSel = sess.extras.includes(id);
    setState((s) => ({
      ...s,
      session: {
        ...s.session,
        extras: isSel ? s.session.extras.filter((x) => x !== id) : [...s.session.extras, id],
      },
    }));
  };
  return (
    <div>
      <SectionTitle
        title="Scegli settimane e servizi"
        subtitle="La sede è già selezionata: completa con settimane, orario e servizi extra."
      />

      <div className="rounded-2xl bg-gradient-royal text-primary-foreground p-5 mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 grid place-items-center">
          <MapPin className="w-5 h-5" />
        </div>
        <div>
          <div className="font-pixel text-white/70">Sede selezionata</div>
          <div className="font-display text-xl font-bold">{location.name}</div>
          <div className="text-xs text-white/80">{location.comune}</div>
        </div>
      </div>

      <h3 className="font-display text-lg font-bold mb-2">Settimane disponibili</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-6">
        {location.weeks.map((w) => {
          const checked = sess.weekIds.includes(w.id);
          return (
            <label
              key={w.id}
              className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${checked ? "bg-primary/10 border-primary" : "bg-white border-border hover:bg-secondary"}`}
            >
              <Checkbox
                checked={checked}
                onCheckedChange={() => toggleWeek(w.id, w.label)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <div className="font-display font-bold">Sett. {w.number}</div>
                <div className="text-sm text-muted-foreground">{w.label}</div>
              </div>
              <span className="font-pixel bg-grass/10 text-grass border border-grass/30 rounded-lg px-2 py-0.5 self-center">
                {w.spots} posti
              </span>
            </label>
          );
        })}
      </div>

      <h3 className="font-display text-lg font-bold mb-2">Fascia oraria</h3>
      <div className="grid sm:grid-cols-2 gap-2 mb-6">
        {location.timeSlots.map((t) => {
          const active = sess.timeSlot === t;
          return (
            <label
              key={t}
              className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${active ? "bg-primary/10 border-primary" : "bg-white border-border hover:bg-secondary"}`}
            >
              <input
                type="radio"
                name="timeSlot"
                className="accent-primary"
                checked={active}
                onChange={() => setState((s) => ({ ...s, session: { ...s.session, timeSlot: t } }))}
              />
              <span className="font-semibold">{t}</span>
            </label>
          );
        })}
      </div>

      <h3 className="font-display text-lg font-bold mb-2">Servizi extra</h3>
      <div className="grid sm:grid-cols-2 gap-2">
        {location.extraServices.map((s) => {
          const checked = sess.extras.includes(s.id);
          return (
            <label
              key={s.id}
              className={`flex items-center justify-between gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${checked ? "bg-magic/10 border-magic" : "bg-white border-border hover:bg-secondary"}`}
            >
              <div className="flex items-center gap-3">
                <Checkbox checked={checked} onCheckedChange={() => toggleExtra(s.id)} />
                <span className="font-semibold">{s.label}</span>
              </div>
              <span className="font-pixel bg-flame/10 text-flame border border-flame/30 rounded-lg px-2 py-0.5">
                + € {s.price}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function StepDelegates({ state, setState }: { state: WizardState; setState: SetState }) {
  const add = () =>
    setState((s) => ({
      ...s,
      delegates: [...s.delegates, { firstName: "", lastName: "", phone: "", document: "" }],
    }));
  const remove = (i: number) =>
    setState((s) => ({ ...s, delegates: s.delegates.filter((_, idx) => idx !== i) }));
  const upd = (i: number, k: keyof PickupDelegate, v: string) =>
    setState((s) => ({
      ...s,
      delegates: s.delegates.map((d, idx) => (idx === i ? { ...d, [k]: v } : d)),
    }));
  const updConsent = (k: keyof ConsentsData, v: boolean) =>
    setState((s) => ({ ...s, consents: { ...s.consents, [k]: v } }));

  return (
    <div>
      <SectionTitle
        title="Deleghe e autorizzazioni"
        subtitle="Aggiungi le persone autorizzate al ritiro e accetta le autorizzazioni necessarie."
      />

      <div className="space-y-3">
        {state.delegates.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            Nessun delegato aggiunto. Solo il genitore potrà ritirare il bambino.
          </div>
        )}
        {state.delegates.map((d, i) => (
          <div key={i} className="rounded-xl border border-border p-4 bg-secondary/30">
            <div className="flex items-center justify-between mb-3">
              <div className="font-display font-bold">Delegato #{i + 1}</div>
              <button
                onClick={() => remove(i)}
                className="text-flame hover:text-flame/80 inline-flex items-center gap-1 text-sm font-semibold"
              >
                <Trash2 className="w-4 h-4" /> Rimuovi
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Nome">
                <Input value={d.firstName} onChange={(e) => upd(i, "firstName", e.target.value)} />
              </Field>
              <Field label="Cognome">
                <Input value={d.lastName} onChange={(e) => upd(i, "lastName", e.target.value)} />
              </Field>
              <Field label="Telefono">
                <Input value={d.phone} onChange={(e) => upd(i, "phone", e.target.value)} />
              </Field>
              <Field label="Documento (tipo + numero)">
                <Input
                  value={d.document}
                  onChange={(e) => upd(i, "document", e.target.value)}
                  placeholder="es. CI AX1234567"
                />
              </Field>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={add}
        className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 font-display font-bold border border-dashed border-primary text-primary hover:bg-primary/10 transition-colors"
      >
        <Plus className="w-4 h-4" /> Aggiungi delegato
      </button>

      <div className="mt-8">
        <h3 className="font-display text-lg font-bold mb-3">Consensi</h3>
        <div className="space-y-2">
          <ConsentRow
            label="Autorizzo il trattamento dei dati personali (obbligatorio)"
            checked={state.consents.dataProcessing}
            onChange={(v) => updConsent("dataProcessing", v)}
          />
          <ConsentRow
            label="Ho preso visione della privacy policy (obbligatorio)"
            checked={state.consents.privacy}
            onChange={(v) => updConsent("privacy", v)}
          />
          <ConsentRow
            label="Accetto il regolamento del centro estivo (obbligatorio)"
            checked={state.consents.rules}
            onChange={(v) => updConsent("rules", v)}
          />
          <ConsentRow
            label="Autorizzo le uscite e le gite previste dal programma"
            checked={state.consents.outings}
            onChange={(v) => updConsent("outings", v)}
          />
          <ConsentRow
            label="Autorizzo l'uso di foto e video per i canali Sportivissimo"
            checked={state.consents.photos}
            onChange={(v) => updConsent("photos", v)}
          />
        </div>
      </div>
    </div>
  );
}

function ConsentRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 rounded-xl border border-border bg-white p-3 cursor-pointer hover:bg-secondary transition-colors">
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onChange(Boolean(v))}
        className="mt-0.5"
      />
      <span className="text-sm font-semibold">{label}</span>
    </label>
  );
}

function StepDocuments({
  state,
  setState,
  files,
}: {
  state: WizardState;
  setState: SetState;
  files: Map<string, File>;
}) {
  const addFromInput = (type: string, file: File | null) => {
    if (!file) return;
    const invalid = validateDocumentFile(file);
    if (invalid) {
      toast.error(invalid);
      return;
    }
    files.set(type, file);
    const meta: DocumentMeta = { type, fileName: file.name, size: file.size };
    setState((s) => ({ ...s, documents: [...s.documents.filter((d) => d.type !== type), meta] }));
  };
  const remove = (idx: number) => {
    const doc = state.documents[idx];
    if (doc) files.delete(doc.type);
    setState((s) => ({ ...s, documents: s.documents.filter((_, i) => i !== idx) }));
  };

  return (
    <div>
      <SectionTitle
        title="Carica i documenti"
        subtitle="Puoi caricarli ora o aggiungerli più tardi dall'area genitori."
      />

      <div className="grid md:grid-cols-2 gap-3">
        {DOC_TYPES.map((type) => {
          const existing = state.documents.find((d) => d.type === type);
          return (
            <label
              key={type}
              className="rounded-xl border border-dashed border-border bg-white p-4 cursor-pointer hover:bg-secondary transition-colors block"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-magic text-magic-foreground grid place-items-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-display font-bold">{type}</div>
                  <div className="text-xs text-muted-foreground">
                    {existing
                      ? `${existing.fileName} · ${(existing.size / 1024).toFixed(0)} KB`
                      : "PDF, JPG o PNG"}
                  </div>
                </div>
                {existing && (
                  <span className="font-pixel bg-grass/10 text-grass border border-grass/30 rounded-lg px-2 py-0.5">
                    caricato
                  </span>
                )}
              </div>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="sr-only"
                onChange={(e) => addFromInput(type, e.target.files?.[0] ?? null)}
              />
            </label>
          );
        })}
      </div>

      {state.documents.length > 0 && (
        <div className="mt-6">
          <h3 className="font-display text-lg font-bold mb-2">File caricati</h3>
          <ul className="space-y-2">
            {state.documents.map((d, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-xl border border-border bg-secondary/50 p-3"
              >
                <span className="inline-flex items-center gap-2 text-sm font-semibold">
                  <FileText className="w-4 h-4 text-magic" />
                  <span className="text-muted-foreground">{d.type}:</span> {d.fileName}
                </span>
                <button
                  onClick={() => remove(i)}
                  className="text-flame hover:text-flame/80 inline-flex items-center gap-1 text-sm font-semibold"
                >
                  <Trash2 className="w-4 h-4" /> Rimuovi
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StepSummary({ state, location }: { state: WizardState; location: Location }) {
  const total = useMemo(() => {
    const weeks = state.session.weekIds.length || 0;
    const extrasCost = state.session.extras.reduce((acc, id) => {
      const e = location.extraServices.find((x) => x.id === id);
      return acc + (e ? e.price * weeks : 0);
    }, 0);
    return location.pricePerWeek * weeks + extrasCost;
  }, [state, location]);

  return (
    <div>
      <SectionTitle
        title="Riepilogo iscrizione"
        subtitle="Controlla i dati prima di inviare l'iscrizione."
      />
      <div className="grid md:grid-cols-2 gap-4">
        <SummaryCard title="Sede & settimane">
          <SummaryRow label="Sede" value={location.name} />
          <SummaryRow label="Settimane" value={state.session.weekLabels.join(", ") || "—"} />
          <SummaryRow label="Orario" value={state.session.timeSlot || "—"} />
          <SummaryRow
            label="Servizi extra"
            value={
              state.session.extras
                .map((id) => location.extraServices.find((x) => x.id === id)?.label)
                .filter(Boolean)
                .join(", ") || "Nessuno"
            }
          />
        </SummaryCard>
        <SummaryCard title="Stima totale">
          <div className="font-display text-4xl font-bold text-grass">€ {total}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Calcolo indicativo: {state.session.weekIds.length} settimana/e × €{" "}
            {location.pricePerWeek} + servizi extra. Verrà confermato dallo staff.
          </p>
        </SummaryCard>
        <SummaryCard title="Genitore / Tutore">
          <SummaryRow
            label="Nome"
            value={`${state.guardian.firstName} ${state.guardian.lastName}`}
          />
          <SummaryRow label="Email" value={state.guardian.email} />
          <SummaryRow label="Telefono" value={state.guardian.phone} />
          <SummaryRow
            label="Indirizzo"
            value={`${state.guardian.address}, ${state.guardian.zip} ${state.guardian.city} (${state.guardian.province})`}
          />
        </SummaryCard>
        <SummaryCard title="Bambino / a">
          <SummaryRow label="Nome" value={`${state.child.firstName} ${state.child.lastName}`} />
          <SummaryRow
            label="Età"
            value={
              calcAge(state.child.birthDate) > 0 ? `${calcAge(state.child.birthDate)} anni` : "—"
            }
          />
          <SummaryRow label="Scuola" value={`${state.child.school} · ${state.child.grade}`} />
          <SummaryRow label="Allergie" value={state.child.allergies || "—"} />
        </SummaryCard>
        <SummaryCard title="Deleghe">
          {state.delegates.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nessun delegato.</div>
          ) : (
            state.delegates.map((d, i) => (
              <div key={i} className="text-sm">
                <span className="font-semibold">
                  {d.firstName} {d.lastName}
                </span>{" "}
                · {d.phone}
              </div>
            ))
          )}
        </SummaryCard>
        <SummaryCard title="Documenti">
          {state.documents.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nessun documento caricato.</div>
          ) : (
            state.documents.map((d, i) => (
              <div key={i} className="text-sm font-semibold">
                <span className="text-muted-foreground">{d.type}:</span> {d.fileName}
              </div>
            ))
          )}
        </SummaryCard>
      </div>
    </div>
  );
}

function SummaryCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-secondary/40 p-4">
      <div className="font-display text-lg font-bold mb-2">{title}</div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-right">{value}</span>
    </div>
  );
}

/* ----------------------------- success screen ----------------------------- */

function SuccessScreen({
  id,
  location,
  onParents,
}: {
  id: string;
  location: Location;
  onParents: () => void;
}) {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const confetti = (await import("canvas-confetti")).default;
      if (cancelled) return;
      const end = Date.now() + 1200;
      const colors = ["#ff6b1a", "#1e3a8a", "#fbbf24", "#22c55e", "#ec4899"];
      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 65,
          origin: { x: 0, y: 0.7 },
          colors,
          startVelocity: 55,
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 65,
          origin: { x: 1, y: 0.7 },
          colors,
          startVelocity: 55,
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 },
        colors,
      });
      frame();
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return (
    <div className="rounded-2xl bg-gradient-hero text-white p-10 text-center shadow-pop relative overflow-hidden">
      <div className="relative">
        <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-xl px-4 py-1.5 font-pixel mb-4">
          Iscrizione #{id}
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold">Iscrizione inviata!</h1>
        <p className="text-white/85 mt-3 max-w-xl mx-auto">
          La squadra Sportivissimo riceverà tutto per{" "}
          <span className="font-bold">{location.name}</span> e ti ricontatterà presto. Nel frattempo
          puoi tenere d'occhio lo stato dalla tua area genitori.
        </p>
        <div className="flex flex-wrap gap-3 justify-center mt-6">
          <button
            onClick={onParents}
            className="inline-flex items-center gap-2 bg-gradient-flame text-flame-foreground rounded-xl px-6 py-3.5 font-display font-bold shadow-sticker hover:scale-105 transition-transform"
          >
            <PartyPopper className="w-4 h-4" /> Vai alla mia area
          </button>
          <Link
            to="/centri-estivi"
            className="inline-flex items-center gap-2 bg-white/10 border border-white/30 text-white rounded-xl px-6 py-3.5 font-display font-bold hover:bg-white/20 transition-colors"
          >
            Torna alle sedi
          </Link>
        </div>
      </div>
    </div>
  );
}
