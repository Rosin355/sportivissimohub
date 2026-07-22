export type EnrollmentStatus =
  | "bozza"
  | "nuova"
  | "inviata"
  | "revisione"
  | "documenti-mancanti"
  | "confermata"
  | "attesa-pagamento"
  | "lista-attesa"
  | "annullata";

const map: Record<EnrollmentStatus, { label: string; cls: string }> = {
  bozza: { label: "Bozza", cls: "bg-secondary text-muted-foreground border-border" },
  nuova: { label: "Nuova", cls: "bg-sky/15 text-sky border-sky/30" },
  inviata: { label: "Inviata", cls: "bg-sky/15 text-sky border-sky/30" },
  revisione: { label: "In revisione", cls: "bg-sun/20 text-sun-foreground border-sun/40" },
  "documenti-mancanti": {
    label: "Documenti mancanti",
    cls: "bg-flame/15 text-flame border-flame/30",
  },
  confermata: { label: "Confermata", cls: "bg-grass/15 text-grass border-grass/30" },
  "attesa-pagamento": { label: "Attesa pagamento", cls: "bg-magic/15 text-magic border-magic/30" },
  "lista-attesa": { label: "Lista d'attesa", cls: "bg-magic/15 text-magic border-magic/30" },
  annullata: {
    label: "Annullata",
    cls: "bg-destructive/10 text-destructive border-destructive/30",
  },
};

export function EnrollmentStatusBadge({ status }: { status: EnrollmentStatus }) {
  const s = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-pixel px-2.5 py-1 rounded-lg border ${s.cls}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" /> {s.label}
    </span>
  );
}
