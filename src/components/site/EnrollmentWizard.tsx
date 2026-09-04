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
import { computeFiscalCode, isValidFiscalCode } from "@/lib/enrollments/fiscal-code";
import { computeEstimate, extrasCostFor, isHalfDay } from "@/lib/enrollments/pricing";
import {
  requiredDocTypesForLocation,
  uploadEnrollmentDocument,
  validateDocumentFile,
} from "@/lib/enrollments/documents";
import { OTHER_DOC_TYPE, docTypeLabel } from "@/lib/enrollments/doc-types";
import {
  clearDraftFiles,
  deleteDraftFile,
  loadDraftFiles,
  saveDraftFile,
} from "@/lib/enrollments/draft-files";
import { getEnrollments } from "@/data/enrollments";
import { toast } from "sonner";
import { publicLocationDocuments, type Location } from "@/data/locations";
import { LocationDocumentsList } from "@/components/site/LocationDocumentsList";
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
  secondaryGuardian: GuardianData | null;
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
  sesso: "",
  comuneNascita: "",
  provinciaNascita: "",
  nazioneNascita: "Italia",
  hasItalianCf: true,
  cittadinanza: "",
  nazioneResidenza: "",
  tipoDocumento: "",
  numeroDocumento: "",
};

const emptyConsents: ConsentsData = {
  privacy: false,
  photos: false,
  outings: false,
  rules: false,
  dataProcessing: false,
  acsiDati24: false,
  acsiDati25: false,
  acsiFotoMarketing: false,
};

function calcAge(birth: string) {
  if (!birth) return 0;
  const d = new Date(birth);
  if (isNaN(d.getTime())) return 0;
  const diff = Date.now() - d.getTime();
  return Math.max(0, Math.floor(diff / (365.25 * 24 * 3600 * 1000)));
}

// Esito dell'upload dei documenti al termine del wizard, mostrato nella
// schermata finale: mai un fallimento silenzioso.
export type DocsReport = {
  uploaded: string[]; // codici doc caricati
  failed: Array<{ type: string; error: string }>;
  missing: string[]; // selezionati nella bozza ma senza file (da ricaricare)
};

export function EnrollmentWizard({ location }: { location: Location }) {
  const navigate = useNavigate();
  const { auth } = useRouteContext({ from: "__root__" });
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState<{ code: string; report: DocsReport } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // File reali selezionati nello StepDocuments, per codice documento. La bozza
  // in localStorage ha solo i metadati: i File stanno in IndexedDB
  // (draft-files.ts) e vengono ricaricati qui sotto, così sopravvivono a
  // reload e al giro di login/registrazione.
  const docFilesRef = useRef(new Map<string, File>());
  const [filesVersion, setFilesVersion] = useState(0);
  // Documenti chiesti dalla sede (codici stabili) + "altro".
  const docTypes = useMemo(
    () => [...new Set([...requiredDocTypesForLocation(location), OTHER_DOC_TYPE])],
    [location],
  );

  const [state, setState] = useState<WizardState>(() => ({
    guardian: emptyGuardian,
    secondaryGuardian: null,
    child: emptyChild,
    session: {
      locationSlug: location.slug,
      locationName: location.name,
      weekIds: [],
      weekLabels: [],
      timeSlot: location.timeSlots[0] ?? "",
      extras: [],
      residenteNelComune: false,
      tesseraTipo: "base",
    },
    delegates: [],
    consents: emptyConsents,
    documents: [],
  }));

  // Figli già iscritti nella stagione (per stimare lo sconto fratelli).
  // Il valore autoritativo di figlio_ordine viene comunque calcolato server-side.
  const [enrolledChildren, setEnrolledChildren] = useState<
    Array<{ cf: string; nameKey: string; birthDate: string }>
  >([]);
  useEffect(() => {
    if (!auth) return;
    getEnrollments()
      .then((list) => {
        const year = new Date().getFullYear();
        const seen = new Map<string, { cf: string; nameKey: string; birthDate: string }>();
        for (const e of list) {
          if (e.status === "annullata") continue;
          if (new Date(e.createdAt).getFullYear() !== year) continue;
          const cf = e.child.fiscalCode.toUpperCase();
          const nameKey = `${e.child.firstName}|${e.child.lastName}`.toLowerCase();
          seen.set(cf || `${nameKey}|${e.child.birthDate}`, {
            cf,
            nameKey,
            birthDate: e.child.birthDate,
          });
        }
        setEnrolledChildren([...seen.values()]);
      })
      .catch(() => {});
  }, [auth]);

  const figlioOrdine = useMemo(() => {
    const cf = state.child.fiscalCode.trim().toUpperCase();
    const nameKey = `${state.child.firstName}|${state.child.lastName}`.toLowerCase();
    const others = enrolledChildren.filter(
      (k) =>
        !(cf && k.cf === cf) && !(k.nameKey === nameKey && k.birthDate === state.child.birthDate),
    );
    return others.length + 1;
  }, [
    enrolledChildren,
    state.child.fiscalCode,
    state.child.firstName,
    state.child.lastName,
    state.child.birthDate,
  ]);

  // hydrate draft once
  const hydrated = useRef(false);
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const draft = readDraft<Partial<WizardState>>(location.slug);
    if (draft) {
      // merge campo per campo: le bozze salvate prima della M9 non hanno i
      // nuovi campi e devono ereditare i default.
      setState((prev) => ({
        guardian: { ...prev.guardian, ...draft.guardian },
        secondaryGuardian: draft.secondaryGuardian
          ? { ...emptyGuardian, ...draft.secondaryGuardian }
          : null,
        child: { ...prev.child, ...draft.child },
        session: {
          ...prev.session,
          ...draft.session,
          locationSlug: location.slug,
          locationName: location.name,
        },
        delegates: draft.delegates ?? prev.delegates,
        consents: { ...prev.consents, ...draft.consents },
        documents: draft.documents ?? prev.documents,
      }));
    }
    loadDraftFiles(location.slug).then((files) => {
      if (files.size === 0) return;
      for (const [type, file] of files) docFilesRef.current.set(type, file);
      setFilesVersion((v) => v + 1);
    });
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
      secondaryGuardian: state.secondaryGuardian,
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
      // l'iscrizione. Un errore qui non blocca la conferma, ma viene sempre
      // mostrato: nella schermata finale c'è il conto di cosa è stato caricato.
      const report: DocsReport = { uploaded: [], failed: [], missing: [] };
      for (const doc of state.documents) {
        const file = docFilesRef.current.get(doc.type);
        if (!file) {
          report.missing.push(doc.type);
          continue;
        }
        const upload = await uploadEnrollmentDocument({
          userId: auth.user.id,
          enrollmentId: result.id,
          docType: doc.type,
          file,
        });
        if (upload.ok) report.uploaded.push(doc.type);
        else report.failed.push({ type: doc.type, error: upload.error });
      }
      for (const f of report.failed) toast.error(`${docTypeLabel(f.type)}: ${f.error}`);
      if (report.missing.length > 0) {
        toast.warning(
          "Alcuni documenti della bozza non hanno più il file: ricaricali dall'area genitori.",
        );
      }

      clearDraft(location.slug);
      await clearDraftFiles(location.slug);
      docFilesRef.current.clear();
      setSubmitted({ code: result.code, report });
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
        id={submitted.code}
        report={submitted.report}
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
        {step === 3 && (
          <StepSession
            state={state}
            setState={setState}
            location={location}
            figlioOrdine={figlioOrdine}
          />
        )}
        {step === 4 && <StepDelegates state={state} setState={setState} />}
        {step === 5 && (
          <StepDocuments
            state={state}
            setState={setState}
            location={location}
            slug={location.slug}
            docTypes={docTypes}
            files={docFilesRef.current}
            filesVersion={filesVersion}
            onFilesChange={() => setFilesVersion((v) => v + 1)}
          />
        )}
        {step === 6 && (
          <StepSummary
            state={state}
            location={location}
            figlioOrdine={figlioOrdine}
            files={docFilesRef.current}
            filesVersion={filesVersion}
          />
        )}

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
    if (!isValidFiscalCode(g.fiscalCode))
      return "Codice fiscale del genitore non valido (controlla anche l'ultimo carattere).";
    if (!g.address || !g.city || !g.province || !g.zip) return "Completa l'indirizzo.";
    const sg = s.secondaryGuardian;
    if (sg) {
      if (!sg.firstName || !sg.lastName || !sg.email || !sg.phone)
        return "Completa i dati del secondo genitore o rimuovi il blocco.";
      if (!isValidFiscalCode(sg.fiscalCode))
        return "Codice fiscale del secondo genitore non valido.";
      if (!sg.address || !sg.city || !sg.province || !sg.zip)
        return "Completa l'indirizzo del secondo genitore.";
    }
  }
  if (step === 2) {
    const c = s.child;
    if (!c.firstName || !c.lastName) return "Inserisci nome e cognome del bambino.";
    if (!c.birthDate) return "Inserisci la data di nascita.";
    if (!c.sesso) return "Indica il sesso del bambino.";
    if (!c.comuneNascita) return "Inserisci il comune (o la città) di nascita.";
    if (c.hasItalianCf) {
      if (!isValidFiscalCode(c.fiscalCode))
        return "Codice fiscale del bambino non valido (controlla anche l'ultimo carattere).";
    } else if (!c.cittadinanza || !c.nazioneResidenza || !c.tipoDocumento || !c.numeroDocumento) {
      return "Per un bambino senza CF italiano completa cittadinanza, nazione di residenza e documento.";
    }
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
    if (!c.acsiDati24)
      return "Il consenso ACSI al trattamento dati per il tesseramento è obbligatorio.";
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

      <div className="mt-8">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-display text-lg font-bold">Secondo genitore</h3>
          {state.secondaryGuardian === null ? (
            <button
              onClick={() => setState((s) => ({ ...s, secondaryGuardian: { ...emptyGuardian } }))}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-bold border border-dashed border-primary text-primary hover:bg-primary/10 transition-colors"
            >
              <Plus className="w-4 h-4" /> Aggiungi
            </button>
          ) : (
            <button
              onClick={() => setState((s) => ({ ...s, secondaryGuardian: null }))}
              className="text-flame hover:text-flame/80 inline-flex items-center gap-1 text-sm font-semibold"
            >
              <Trash2 className="w-4 h-4" /> Rimuovi
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1 mb-3">
          Facoltativo: il modulo di tesseramento ACSI prevede i dati di entrambi i genitori.
        </p>
        {state.secondaryGuardian && <SecondaryGuardianFields state={state} setState={setState} />}
      </div>
    </div>
  );
}

function SecondaryGuardianFields({ state, setState }: { state: WizardState; setState: SetState }) {
  const sg = state.secondaryGuardian;
  if (!sg) return null;
  const upd = (k: keyof GuardianData, v: string) =>
    setState((s) => ({
      ...s,
      secondaryGuardian: s.secondaryGuardian ? { ...s.secondaryGuardian, [k]: v } : null,
    }));
  return (
    <div className="rounded-xl border border-border p-4 bg-secondary/30">
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Nome">
          <Input value={sg.firstName} onChange={(e) => upd("firstName", e.target.value)} />
        </Field>
        <Field label="Cognome">
          <Input value={sg.lastName} onChange={(e) => upd("lastName", e.target.value)} />
        </Field>
        <Field label="Email">
          <Input type="email" value={sg.email} onChange={(e) => upd("email", e.target.value)} />
        </Field>
        <Field label="Telefono">
          <Input value={sg.phone} onChange={(e) => upd("phone", e.target.value)} />
        </Field>
        <Field label="Codice fiscale" full>
          <Input
            value={sg.fiscalCode}
            onChange={(e) => upd("fiscalCode", e.target.value.toUpperCase())}
          />
        </Field>
        <Field label="Indirizzo" full>
          <Input value={sg.address} onChange={(e) => upd("address", e.target.value)} />
        </Field>
        <Field label="Comune">
          <Input value={sg.city} onChange={(e) => upd("city", e.target.value)} />
        </Field>
        <Field label="Provincia">
          <Input
            value={sg.province}
            onChange={(e) => upd("province", e.target.value.toUpperCase())}
            maxLength={2}
          />
        </Field>
        <Field label="CAP">
          <Input value={sg.zip} onChange={(e) => upd("zip", e.target.value)} maxLength={5} />
        </Field>
      </div>
    </div>
  );
}

function StepChild({ state, setState }: { state: WizardState; setState: SetState }) {
  const c = state.child;
  const upd = (k: keyof ChildData, v: string | number | boolean) =>
    setState((s) => ({ ...s, child: { ...s.child, [k]: v } }));
  const age = calcAge(c.birthDate);

  // Genera il CF con codice-fiscale-js (mappa dei codici catastali dei comuni).
  // Il valore resta modificabile e viene comunque rivalidato; se il comune non
  // viene riconosciuto si può inserire il CF a mano.
  async function computeChildCf() {
    if (!c.sesso) {
      toast.error("Per calcolare il codice fiscale indica anche il sesso del bambino.");
      return;
    }
    const res = await computeFiscalCode({
      firstName: c.firstName,
      lastName: c.lastName,
      sex: c.sesso,
      birthDate: c.birthDate,
      comune: c.comuneNascita,
      provincia: c.provinciaNascita,
    });
    if (!res.ok) {
      toast.error(res.message);
      return;
    }
    upd("fiscalCode", res.fiscalCode);
    // Se la provincia era scritta per esteso (o mancava) la porta alla sigla.
    if (res.provincia && !/^[A-Za-z]{2}$/.test(c.provinciaNascita.trim())) {
      upd("provinciaNascita", res.provincia);
    }
    toast.success("Codice fiscale calcolato: controllalo con la tessera sanitaria.");
  }

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
        <Field label="Sesso">
          <div className="flex gap-2">
            {(["M", "F"] as const).map((sx) => (
              <label
                key={sx}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl border p-2.5 cursor-pointer transition-colors font-semibold ${
                  c.sesso === sx
                    ? "bg-primary/10 border-primary"
                    : "bg-white border-border hover:bg-secondary"
                }`}
              >
                <input
                  type="radio"
                  name="childSex"
                  className="accent-primary"
                  checked={c.sesso === sx}
                  onChange={() => upd("sesso", sx)}
                />
                {sx === "M" ? "Maschio" : "Femmina"}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Comune (o città) di nascita">
          <Input value={c.comuneNascita} onChange={(e) => upd("comuneNascita", e.target.value)} />
        </Field>
        <Field label="Provincia di nascita">
          <Input
            value={c.provinciaNascita}
            onChange={(e) => upd("provinciaNascita", e.target.value.toUpperCase())}
            maxLength={2}
            placeholder="es. PD (vuoto se estero)"
          />
        </Field>
        <Field label="Nazione di nascita">
          <Input value={c.nazioneNascita} onChange={(e) => upd("nazioneNascita", e.target.value)} />
        </Field>
        <Field label="Il bambino ha il codice fiscale italiano?" full>
          <div className="flex gap-2">
            {(
              [
                [true, "Sì, ha il codice fiscale"],
                [false, "No (bambino straniero senza CF)"],
              ] as const
            ).map(([val, label]) => (
              <label
                key={String(val)}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl border p-2.5 cursor-pointer transition-colors text-sm font-semibold ${
                  c.hasItalianCf === val
                    ? "bg-primary/10 border-primary"
                    : "bg-white border-border hover:bg-secondary"
                }`}
              >
                <input
                  type="radio"
                  name="hasItalianCf"
                  className="accent-primary"
                  checked={c.hasItalianCf === val}
                  onChange={() => upd("hasItalianCf", val)}
                />
                {label}
              </label>
            ))}
          </div>
        </Field>
        {c.hasItalianCf ? (
          <Field label="Codice fiscale" full>
            <div className="flex gap-2">
              <Input
                value={c.fiscalCode}
                onChange={(e) => upd("fiscalCode", e.target.value.toUpperCase())}
                className="flex-1"
              />
              <button
                type="button"
                onClick={computeChildCf}
                className="shrink-0 rounded-xl px-4 py-2 font-display font-bold border border-primary text-primary hover:bg-primary/10 transition-colors"
              >
                Calcola
              </button>
            </div>
            {c.fiscalCode.length === 16 && !isValidFiscalCode(c.fiscalCode) && (
              <p className="text-xs font-semibold text-flame mt-1">
                Codice fiscale non valido: controlla anche l'ultimo carattere.
              </p>
            )}
          </Field>
        ) : (
          <>
            <Field label="Cittadinanza">
              <Input value={c.cittadinanza} onChange={(e) => upd("cittadinanza", e.target.value)} />
            </Field>
            <Field label="Nazione di residenza">
              <Input
                value={c.nazioneResidenza}
                onChange={(e) => upd("nazioneResidenza", e.target.value)}
              />
            </Field>
            <Field label="Tipo documento">
              <Input
                value={c.tipoDocumento}
                onChange={(e) => upd("tipoDocumento", e.target.value)}
                placeholder="es. passaporto, carta d'identità"
              />
            </Field>
            <Field label="Numero documento">
              <Input
                value={c.numeroDocumento}
                onChange={(e) => upd("numeroDocumento", e.target.value)}
              />
            </Field>
          </>
        )}
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
  figlioOrdine,
}: {
  state: WizardState;
  setState: SetState;
  location: Location;
  figlioOrdine: number;
}) {
  const sess = state.session;
  const estimate = computeEstimate({
    pricing: location.pricing,
    weeksCount: sess.weekIds.length,
    halfDay: isHalfDay(sess.timeSlot),
    residente: sess.residenteNelComune,
    tessera: sess.tesseraTipo,
    figlioOrdine,
    extrasCost: extrasCostFor(location, sess.extras, sess.weekIds.length),
  });
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

      <h3 className="font-display text-lg font-bold mb-2">Residenza</h3>
      <p className="text-xs text-muted-foreground mb-2">
        La tariffa settimanale cambia per i residenti nel comune della sede.
      </p>
      <div className="grid sm:grid-cols-2 gap-2 mb-6">
        {(
          [
            [true, "Residente nel comune della sede"],
            [false, "Non residente"],
          ] as const
        ).map(([val, label]) => (
          <label
            key={String(val)}
            className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
              sess.residenteNelComune === val
                ? "bg-primary/10 border-primary"
                : "bg-white border-border hover:bg-secondary"
            }`}
          >
            <input
              type="radio"
              name="residente"
              className="accent-primary"
              checked={sess.residenteNelComune === val}
              onChange={() =>
                setState((s) => ({ ...s, session: { ...s.session, residenteNelComune: val } }))
              }
            />
            <span className="font-semibold">{label}</span>
          </label>
        ))}
      </div>

      <h3 className="font-display text-lg font-bold mb-2">Tesseramento ACSI</h3>
      <div className="grid sm:grid-cols-2 gap-2 mb-6">
        {(
          [
            ["base", "Tessera base", location.pricing.membershipBase],
            [
              "super_integrativa",
              "Tessera super-integrativa",
              location.pricing.membershipBase + location.pricing.membershipSuperIntegrativa,
            ],
          ] as const
        ).map(([val, label, price]) => (
          <label
            key={val}
            className={`flex items-center justify-between gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
              sess.tesseraTipo === val
                ? "bg-magic/10 border-magic"
                : "bg-white border-border hover:bg-secondary"
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="tessera"
                className="accent-primary"
                checked={sess.tesseraTipo === val}
                onChange={() =>
                  setState((s) => ({ ...s, session: { ...s.session, tesseraTipo: val } }))
                }
              />
              <span className="font-semibold">{label}</span>
            </div>
            <span className="font-pixel bg-flame/10 text-flame border border-flame/30 rounded-lg px-2 py-0.5">
              € {price}
            </span>
          </label>
        ))}
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

      <div className="mt-6 rounded-2xl border border-border bg-secondary/40 p-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="font-display text-lg font-bold">Costo stimato</div>
          <div className="font-display text-3xl font-bold text-grass">€ {estimate.total}</div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {estimate.weeks} settimana/e × € {estimate.perWeek}
          {estimate.siblingDiscountPerWeek > 0 &&
            ` − € ${estimate.siblingDiscountPerWeek}/sett. sconto fratelli (figlio n. ${figlioOrdine})`}{" "}
          + tessera € {estimate.membership}
          {estimate.extras > 0 && ` + servizi extra € ${estimate.extras}`}. Verrà confermato dallo
          staff.
        </p>
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
            label="Autorizzo l'uso di foto e video per i canali Sportivissimo (uso interno)"
            checked={state.consents.photos}
            onChange={(v) => updConsent("photos", v)}
          />
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-display text-lg font-bold mb-1">Consensi tesseramento ACSI</h3>
        <p className="text-xs text-muted-foreground mb-3">
          L'iscrizione comprende il tesseramento ACSI del minore: servono i consensi
          dell'informativa ACSI. Nessuna casella è pre-spuntata.
        </p>
        <div className="space-y-2">
          <ConsentRow
            label="Acconsento al trattamento dei dati personali per il tesseramento e le finalità istituzionali ACSI — punto 2.4 dell'informativa (obbligatorio)"
            checked={state.consents.acsiDati24}
            onChange={(v) => updConsent("acsiDati24", v)}
          />
          <ConsentRow
            label="Acconsento alle comunicazioni su iniziative e convenzioni ACSI — punto 2.5 dell'informativa (facoltativo)"
            checked={state.consents.acsiDati25}
            onChange={(v) => updConsent("acsiDati25", v)}
          />
          <ConsentRow
            label="Autorizzo l'uso di foto e video per finalità promozionali ACSI — diffusione esterna, distinta dall'autorizzazione precedente (facoltativo)"
            checked={state.consents.acsiFotoMarketing}
            onChange={(v) => updConsent("acsiFotoMarketing", v)}
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
  location,
  slug,
  docTypes,
  files,
  filesVersion: _filesVersion,
  onFilesChange,
}: {
  state: WizardState;
  setState: SetState;
  location: Location;
  slug: string;
  docTypes: string[];
  files: Map<string, File>;
  filesVersion: number; // forza il re-render quando i file vengono ricaricati
  onFilesChange: () => void;
}) {
  const addFromInput = (type: string, file: File | null) => {
    if (!file) return;
    const invalid = validateDocumentFile(file);
    if (invalid) {
      toast.error(invalid);
      return;
    }
    files.set(type, file);
    void saveDraftFile(slug, type, file);
    const meta: DocumentMeta = { type, fileName: file.name, size: file.size };
    setState((s) => ({ ...s, documents: [...s.documents.filter((d) => d.type !== type), meta] }));
    onFilesChange();
  };
  const remove = (idx: number) => {
    const doc = state.documents[idx];
    if (doc) {
      files.delete(doc.type);
      void deleteDraftFile(slug, doc.type);
    }
    setState((s) => ({ ...s, documents: s.documents.filter((_, i) => i !== idx) }));
    onFilesChange();
  };
  const missing = state.documents.filter((d) => !files.has(d.type));
  const locationDocs = publicLocationDocuments(location);

  return (
    <div>
      <SectionTitle
        title="Carica i documenti"
        subtitle="Puoi caricarli ora o aggiungerli più tardi dall'area genitori. Vengono inviati insieme all'iscrizione."
      />

      {missing.length > 0 && (
        <div className="mb-4 bg-sun/15 border border-sun/40 rounded-xl px-4 py-3 text-sm font-semibold">
          {missing.length === 1
            ? "Un documento della bozza non ha più il file: "
            : `${missing.length} documenti della bozza non hanno più il file: `}
          riselezionalo prima di inviare, oppure caricalo dopo dall'area genitori.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        {docTypes.map((type) => {
          const existing = state.documents.find((d) => d.type === type);
          const hasFile = files.has(type);
          return (
            <label
              key={type}
              className="rounded-xl border border-dashed border-border bg-white p-4 cursor-pointer hover:bg-secondary transition-colors block"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-magic text-magic-foreground grid place-items-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold">{docTypeLabel(type)}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {existing
                      ? `${existing.fileName} · ${(existing.size / 1024).toFixed(0)} KB`
                      : "PDF, JPG o PNG (max 10 MB)"}
                  </div>
                </div>
                {existing && hasFile && (
                  <span className="font-pixel bg-grass/10 text-grass border border-grass/30 rounded-lg px-2 py-0.5">
                    selezionato
                  </span>
                )}
                {existing && !hasFile && (
                  <span className="font-pixel bg-flame/10 text-flame border border-flame/30 rounded-lg px-2 py-0.5">
                    da riselezionare
                  </span>
                )}
              </div>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="sr-only"
                onChange={(e) => {
                  addFromInput(type, e.target.files?.[0] ?? null);
                  e.target.value = "";
                }}
              />
            </label>
          );
        })}
      </div>

      {state.documents.length > 0 && (
        <div className="mt-6">
          <h3 className="font-display text-lg font-bold mb-2">File selezionati</h3>
          <ul className="space-y-2">
            {state.documents.map((d, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-xl border border-border bg-secondary/50 p-3"
              >
                <span className="inline-flex items-center gap-2 text-sm font-semibold min-w-0">
                  <FileText className="w-4 h-4 text-magic shrink-0" />
                  <span className="text-muted-foreground">{docTypeLabel(d.type)}:</span>
                  <span className="truncate">{d.fileName}</span>
                  {!files.has(d.type) && (
                    <span className="text-flame text-xs">(file da riselezionare)</span>
                  )}
                </span>
                <button
                  onClick={() => remove(i)}
                  className="text-flame hover:text-flame/80 inline-flex items-center gap-1 text-sm font-semibold shrink-0"
                >
                  <Trash2 className="w-4 h-4" /> Rimuovi
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {locationDocs.length > 0 && (
        <div className="mt-8 rounded-2xl border border-border bg-secondary/40 p-4">
          <LocationDocumentsList
            documents={locationDocs}
            title="Documenti della sede da consultare"
            subtitle="Regolamento, moduli e informative: leggili prima di inviare l'iscrizione."
          />
        </div>
      )}
    </div>
  );
}

function StepSummary({
  state,
  location,
  figlioOrdine,
  files,
  filesVersion: _filesVersion,
}: {
  state: WizardState;
  location: Location;
  figlioOrdine: number;
  files: Map<string, File>;
  filesVersion: number;
}) {
  const estimate = useMemo(
    () =>
      computeEstimate({
        pricing: location.pricing,
        weeksCount: state.session.weekIds.length,
        halfDay: isHalfDay(state.session.timeSlot),
        residente: state.session.residenteNelComune,
        tessera: state.session.tesseraTipo,
        figlioOrdine,
        extrasCost: extrasCostFor(location, state.session.extras, state.session.weekIds.length),
      }),
    [state, location, figlioOrdine],
  );

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
            label="Residenza"
            value={state.session.residenteNelComune ? "Residente nel comune" : "Non residente"}
          />
          <SummaryRow
            label="Tessera ACSI"
            value={state.session.tesseraTipo === "base" ? "Base" : "Super-integrativa"}
          />
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
          <div className="font-display text-4xl font-bold text-grass">€ {estimate.total}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {estimate.weeks} settimana/e × € {estimate.perWeek}
            {estimate.siblingDiscountPerWeek > 0 &&
              ` − € ${estimate.siblingDiscountPerWeek}/sett. sconto fratelli (figlio n. ${figlioOrdine})`}{" "}
            + tessera € {estimate.membership}
            {estimate.extras > 0 && ` + servizi extra € ${estimate.extras}`}. Verrà confermato dallo
            staff.
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
          <SummaryRow
            label="Secondo genitore"
            value={
              state.secondaryGuardian
                ? `${state.secondaryGuardian.firstName} ${state.secondaryGuardian.lastName}`
                : "—"
            }
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
            <div className="text-sm text-muted-foreground">
              Nessun documento allegato: potrai caricarli dall'area genitori.
            </div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground mb-1">
                {state.documents.filter((d) => files.has(d.type)).length} su{" "}
                {state.documents.length} pronti per l'invio
              </div>
              {state.documents.map((d, i) => (
                <div key={i} className="text-sm font-semibold">
                  <span className="text-muted-foreground">{docTypeLabel(d.type)}:</span>{" "}
                  {d.fileName}
                  {!files.has(d.type) && (
                    <span className="text-flame">
                      {" "}
                      (file da riselezionare nello step Documenti)
                    </span>
                  )}
                </div>
              ))}
            </>
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
  report,
  location,
  onParents,
}: {
  id: string;
  report: DocsReport;
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
    <div className="rounded-2xl bg-gradient-hero border border-border text-foreground p-10 text-center shadow-pop relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-magic/20 blur-[100px]" />
        <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-flame/15 blur-[90px]" />
      </div>
      <div className="relative">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary rounded-xl px-4 py-1.5 font-pixel mb-4">
          Iscrizione {id}
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">
          Iscrizione inviata!
        </h1>
        <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
          La squadra Sportivissimo riceverà tutto per{" "}
          <span className="font-bold text-foreground">{location.name}</span> e ti ricontatterà
          presto. Nel frattempo puoi tenere d'occhio lo stato dalla tua area genitori.
        </p>
        <DocsReportBox report={report} />
        <div className="flex flex-wrap gap-3 justify-center mt-6">
          <button
            onClick={onParents}
            className="inline-flex items-center gap-2 bg-gradient-flame text-flame-foreground rounded-xl px-6 py-3.5 font-display font-bold shadow-sticker hover:scale-105 transition-transform"
          >
            <PartyPopper className="w-4 h-4" /> Vai alla mia area
          </button>
          <Link
            to="/centri-estivi"
            className="inline-flex items-center gap-2 bg-white border border-border text-foreground rounded-xl px-6 py-3.5 font-display font-bold hover:bg-secondary transition-colors"
          >
            Torna alle sedi
          </Link>
        </div>
      </div>
    </div>
  );
}

// Conto dei documenti: caricati, falliti (con motivo) e da ricaricare.
function DocsReportBox({ report }: { report: DocsReport }) {
  const total = report.uploaded.length + report.failed.length + report.missing.length;
  if (total === 0) {
    return (
      <div className="mt-6 max-w-xl mx-auto rounded-xl bg-white border border-border px-4 py-3 text-sm text-muted-foreground">
        Nessun documento allegato: potrai caricarli dall'area genitori.
      </div>
    );
  }
  const allOk = report.uploaded.length === total;
  return (
    <div className="mt-6 max-w-xl mx-auto rounded-xl bg-white border border-border p-4 text-left text-sm">
      <div className={`font-display font-bold ${allOk ? "text-grass" : "text-flame"}`}>
        Documenti caricati: {report.uploaded.length} su {total}
      </div>
      <ul className="mt-2 space-y-1">
        {report.uploaded.map((t) => (
          <li key={t} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-grass shrink-0" />
            <span className="font-semibold">{docTypeLabel(t)}</span>
            <span className="text-muted-foreground">caricato</span>
          </li>
        ))}
        {report.failed.map((f) => (
          <li key={f.type} className="flex items-start gap-2">
            <span className="w-2 h-2 rounded-full bg-flame shrink-0 mt-1.5" />
            <span>
              <span className="font-semibold">{docTypeLabel(f.type)}</span>{" "}
              <span className="text-flame">non caricato: {f.error}</span>
            </span>
          </li>
        ))}
        {report.missing.map((t) => (
          <li key={t} className="flex items-start gap-2">
            <span className="w-2 h-2 rounded-full bg-sun shrink-0 mt-1.5" />
            <span>
              <span className="font-semibold">{docTypeLabel(t)}</span>{" "}
              <span className="text-muted-foreground">
                file non più disponibile: caricalo dall'area genitori
              </span>
            </span>
          </li>
        ))}
      </ul>
      {!allOk && (
        <p className="mt-2 text-muted-foreground">
          I documenti mancanti si caricano in qualsiasi momento dall'area genitori, nella scheda
          dell'iscrizione.
        </p>
      )}
    </div>
  );
}
