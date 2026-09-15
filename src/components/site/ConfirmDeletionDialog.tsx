import { useEffect, useState } from "react";
import { AlertTriangle, Ban, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { canDelete, nonEmpty, type DeletionPreview } from "@/lib/admin/deletion";

type PreviewResult = { ok: true; preview: DeletionPreview } | { ok: false; error: string };

// Dialogo di eliminazione definitiva (M11.3b). All'apertura chiede al server
// l'anteprima: se ci sono dipendenze l'eliminazione è bloccata e il dialogo
// dice cosa fare invece; altrimenti elenca cosa verrà rimosso e chiede conferma.
export function ConfirmDeletionDialog({
  open,
  onOpenChange,
  loadPreview,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loadPreview: () => Promise<PreviewResult>;
  // true = eliminato: il dialogo si chiude
  onConfirm: () => Promise<boolean>;
}) {
  const [preview, setPreview] = useState<DeletionPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) {
      setPreview(null);
      setError(null);
      return;
    }
    let cancelled = false;
    loadPreview().then((res) => {
      if (cancelled) return;
      if (res.ok) setPreview(res.preview);
      else setError(res.error);
    });
    return () => {
      cancelled = true;
    };
    // l'anteprima si ricarica a ogni apertura
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const blocked = preview ? !canDelete(preview) : false;
  const removes = preview ? nonEmpty(preview.removes) : [];
  const blockers = preview ? nonEmpty(preview.blockers) : [];

  async function confirm() {
    setDeleting(true);
    try {
      const ok = await onConfirm();
      if (ok) onOpenChange(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(o) => !deleting && onOpenChange(o)}>
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-2xl">
            {blocked ? "Eliminazione non possibile" : "Eliminare definitivamente?"}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              {error && <p className="font-semibold text-flame">{error}</p>}
              {!preview && !error && <p>Controllo dei dati collegati…</p>}

              {preview && blocked && (
                <>
                  <p>
                    Non si può eliminare {preview.subject}: ci sono dati da conservare come storico.
                  </p>
                  <ul className="space-y-1">
                    {blockers.map((b) => (
                      <li key={b.label} className="flex items-center gap-2 text-foreground">
                        <Ban className="w-4 h-4 text-flame shrink-0" />
                        {b.label}: <strong>{b.count}</strong>
                      </li>
                    ))}
                  </ul>
                  <p className="rounded-xl border border-border bg-secondary/50 px-3 py-2 text-foreground">
                    {preview.alternative}
                  </p>
                </>
              )}

              {preview && !blocked && (
                <>
                  <p>
                    Stai per eliminare {preview.subject}. L'operazione non si può annullare e resta
                    traccia nel registro delle azioni.
                  </p>
                  {removes.length > 0 ? (
                    <>
                      <p className="text-foreground font-semibold">Verrà rimosso anche:</p>
                      <ul className="space-y-1">
                        {removes.map((r) => (
                          <li key={r.label} className="flex items-center gap-2 text-foreground">
                            <Trash2 className="w-4 h-4 text-flame shrink-0" />
                            {r.label}: <strong>{r.count}</strong>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p>Non ci sono altri dati collegati da rimuovere.</p>
                  )}
                </>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>
            {blocked ? "Chiudi" : "Annulla"}
          </AlertDialogCancel>
          {preview && !blocked && (
            <button
              type="button"
              onClick={confirm}
              disabled={deleting}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              <AlertTriangle className="w-4 h-4" />
              {deleting ? "Eliminazione…" : "Elimina definitivamente"}
            </button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
