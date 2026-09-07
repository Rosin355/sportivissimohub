import { useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import { toast } from "sonner";
import { Eraser, PenLine, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Enrollment } from "@/data/enrollments";
import type { SignerRole } from "@/lib/supabase/types";
import { PDF_TEMPLATE_INFO, pdfTemplatesForLocation } from "@/lib/pdf-templates/catalog";
import {
  SIGNATURE_CONSENT_TEXT,
  SIGNER_ROLE_LABELS,
  expectedSigners,
  formatSignedAt,
  latestSignatures,
} from "@/lib/enrollments/signatures";
import { saveSignature } from "@/lib/enrollments/signatures-fns";

// Firma elettronica semplice: anteprima di cosa si firma (moduli e consensi),
// dichiarazione esplicita, canvas touch/mouse (signature_pad). Riusabile per
// entrambi i firmatari, anche in momenti diversi.

const CONSENT_LABELS: Array<[keyof Enrollment["consents"], string]> = [
  ["privacy", "Informativa privacy"],
  ["rules", "Regolamento della sede"],
  ["dataProcessing", "Trattamento dei dati"],
  ["photos", "Foto e video"],
  ["outings", "Uscite e gite"],
  ["acsiDati24", "ACSI: trattamento dati per il tesseramento (2.4)"],
  ["acsiDati25", "ACSI: comunicazioni (2.5)"],
  ["acsiFotoMarketing", "ACSI: immagini per finalità promozionali"],
];

export function SignatureDialog({
  open,
  onOpenChange,
  enrollment,
  signerRole,
  signerName,
  onSigned,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  enrollment: Enrollment;
  signerRole: SignerRole;
  signerName: string;
  onSigned: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const [declared, setDeclared] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [busy, setBusy] = useState(false);
  const modules = pdfTemplatesForLocation(enrollment.session.locationSlug).map(
    (k) => PDF_TEMPLATE_INFO[k].label,
  );

  // Il canvas va dimensionato in pixel reali (DPR) o il tratto risulta
  // sfocato; al resize si ridimensiona e si azzera.
  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pad = new SignaturePad(canvas, {
      minWidth: 1,
      maxWidth: 2.5,
      penColor: "#1c2a4a",
      backgroundColor: "rgba(255,255,255,0)",
    });
    padRef.current = pad;
    const resize = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.getContext("2d")?.scale(ratio, ratio);
      pad.clear();
      setHasStrokes(false);
    };
    const onEnd = () => setHasStrokes(!pad.isEmpty());
    pad.addEventListener("endStroke", onEnd);
    // il dialog anima l'apertura: misura dopo il primo layout
    const t = window.setTimeout(resize, 50);
    window.addEventListener("resize", resize);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", resize);
      pad.removeEventListener("endStroke", onEnd);
      pad.off();
      padRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setDeclared(false);
      setHasStrokes(false);
    }
  }, [open]);

  function clear() {
    padRef.current?.clear();
    setHasStrokes(false);
  }

  async function confirm() {
    const pad = padRef.current;
    if (!pad || pad.isEmpty()) {
      toast.error("Disegna la firma nel riquadro.");
      return;
    }
    if (!declared) {
      toast.error("Spunta la dichiarazione prima di confermare.");
      return;
    }
    setBusy(true);
    try {
      const res = await saveSignature({
        data: {
          enrollmentId: enrollment.id,
          signerRole,
          pngDataUrl: pad.toDataURL("image/png"),
          consentAccepted: true,
          signedDocuments: modules,
        },
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Firma apposta. I moduli PDF ora la includono.");
      onSigned();
      onOpenChange(false);
    } catch {
      toast.error("Firma non salvata. Controlla la connessione e riprova.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Firma i moduli</DialogTitle>
          <DialogDescription>
            {SIGNER_ROLE_LABELS[signerRole]}: <span className="font-semibold">{signerName}</span> ·
            iscrizione {enrollment.code}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="rounded-xl border border-border bg-secondary/40 p-3">
            <div className="font-display font-bold mb-1">Cosa stai firmando</div>
            <ul className="list-disc pl-5 space-y-0.5">
              {modules.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
            <div className="font-display font-bold mt-3 mb-1">
              Consensi espressi nell'iscrizione
            </div>
            <ul className="space-y-0.5">
              {CONSENT_LABELS.map(([key, label]) => (
                <li key={key} className="flex items-center justify-between gap-2">
                  <span>{label}</span>
                  <span
                    className={
                      enrollment.consents[key]
                        ? "font-semibold text-grass"
                        : "text-muted-foreground"
                    }
                  >
                    {enrollment.consents[key] ? "Sì" : "No"}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <label className="flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-input"
              checked={declared}
              onChange={(e) => setDeclared(e.target.checked)}
            />
            <span className="font-semibold">{SIGNATURE_CONSENT_TEXT}</span>
          </label>

          <div>
            <div className="text-xs font-bold text-muted-foreground mb-1">
              Firma qui con il dito o con il mouse
            </div>
            <div className="relative rounded-xl border-2 border-dashed border-border bg-white">
              <canvas
                ref={canvasRef}
                className="block w-full h-44 rounded-xl touch-none"
                aria-label="Area di firma"
              />
              <span className="pointer-events-none absolute left-4 right-4 bottom-8 border-b border-border/70" />
            </div>
            <div className="flex items-center justify-between mt-2">
              <button
                type="button"
                onClick={clear}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                <Eraser className="w-3.5 h-3.5" /> Cancella
              </button>
              <span className="text-[11px] text-muted-foreground">Firmando come {signerName}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-display font-bold border border-border bg-white hover:bg-secondary"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={busy || !declared || !hasStrokes}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 font-display font-bold bg-gradient-royal text-primary-foreground shadow-sticker disabled:opacity-50"
            >
              <PenLine className="w-4 h-4" /> {busy ? "Salvataggio…" : "Conferma e firma"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Riquadro "Firma i moduli" nella scheda iscrizione dell'area genitori:
// stato per firmatario e pulsante per firmare (anche in momenti diversi).
export function SignaturePanel({
  enrollment,
  onChange,
}: {
  enrollment: Enrollment;
  onChange: () => void;
}) {
  const [signing, setSigning] = useState<{ role: SignerRole; name: string } | null>(null);
  const latest = latestSignatures(enrollment);
  const signers = expectedSigners(enrollment);
  return (
    <div className="mt-3 rounded-xl border border-border bg-secondary/40 p-3">
      <div className="flex items-center gap-2 font-display font-bold">
        <PenLine className="w-4 h-4 text-primary" /> Firma dei moduli
        <span className="text-xs font-normal text-muted-foreground">(facoltativa)</span>
      </div>
      <p className="text-xs text-muted-foreground mt-0.5 mb-2">
        Firmando qui, i moduli PDF scaricabili includono la tua firma e non servirà firmarli a mano.
      </p>
      <ul className="space-y-1.5">
        {signers.map((s) => {
          const sig = latest[s.role];
          return (
            <li key={s.role} className="flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0">
                <span className="font-semibold">{s.name}</span>{" "}
                <span className="text-xs text-muted-foreground">
                  ({SIGNER_ROLE_LABELS[s.role]})
                </span>
                {sig && (
                  <span className="block text-xs text-grass inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> firmato il {formatSignedAt(sig.signedAt)}
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => setSigning({ role: s.role, name: s.name })}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold border border-primary text-primary hover:bg-primary/10 shrink-0"
              >
                <PenLine className="w-3.5 h-3.5" /> {sig ? "Firma di nuovo" : "Firma i moduli"}
              </button>
            </li>
          );
        })}
      </ul>
      {signing && (
        <SignatureDialog
          open
          onOpenChange={(o) => !o && setSigning(null)}
          enrollment={enrollment}
          signerRole={signing.role}
          signerName={signing.name}
          onSigned={onChange}
        />
      )}
    </div>
  );
}
