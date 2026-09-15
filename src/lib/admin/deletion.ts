// Eliminazione definitiva nel pannello admin (M11.3b). Prima di eliminare, il
// server calcola un'anteprima: cosa impedisce l'eliminazione (storico da
// conservare, per cui si archivia, si annulla o si disattiva) e cosa verrebbe
// rimosso insieme all'entità. Il dialogo di conferma mostra entrambe le liste;
// la funzione che elimina ricalcola tutto e il database ricontrolla con i
// trigger di guardia.

export type DeletionItem = { label: string; count: number };

export type DeletionPreview = {
  // nome leggibile dell'entità, es. "la sede Galzignano Terme"
  subject: string;
  blockers: DeletionItem[];
  removes: DeletionItem[];
  // cosa fare invece, quando l'eliminazione è bloccata
  alternative: string;
};

export function canDelete(preview: DeletionPreview): boolean {
  return preview.blockers.every((b) => b.count === 0);
}

// Solo le voci con almeno un elemento, per non riempire il dialogo di zeri.
export function nonEmpty(items: DeletionItem[]): DeletionItem[] {
  return items.filter((i) => i.count > 0);
}

// Messaggi dei trigger di guardia e dei vincoli, resi leggibili.
export function deletionDbError(message: string): string | null {
  const guard =
    /(si può solo (archiviare|annullare|disattivare)|non si può eliminare|ha iscrizioni)/i;
  if (guard.test(message)) return message.replace(/^ERROR:\s*/i, "");
  if (/row-level security|permission denied/i.test(message)) {
    return "Operazione non consentita: serve il ruolo admin.";
  }
  if (/foreign key|violates foreign key/i.test(message)) {
    return "Ci sono dati collegati che impediscono l'eliminazione.";
  }
  return null;
}
