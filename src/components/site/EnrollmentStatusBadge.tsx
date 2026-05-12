export type EnrollmentStatus =
  | "bozza" | "inviata" | "revisione" | "confermata" | "attesa-pagamento" | "lista-attesa";

const map: Record<EnrollmentStatus, { label: string; cls: string }> = {
  "bozza":             { label: "Bozza",            cls: "bg-secondary text-foreground" },
  "inviata":           { label: "Inviata",          cls: "bg-sky text-sky-foreground" },
  "revisione":         { label: "In revisione",     cls: "bg-sun text-sun-foreground" },
  "confermata":        { label: "Confermata",       cls: "bg-grass text-grass-foreground" },
  "attesa-pagamento":  { label: "Attesa pagamento", cls: "bg-flame text-flame-foreground" },
  "lista-attesa":      { label: "Lista d'attesa",   cls: "bg-magic text-magic-foreground" },
};

export function EnrollmentStatusBadge({ status }: { status: EnrollmentStatus }) {
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border-2 border-foreground/90 ${s.cls}`}>
      ● {s.label}
    </span>
  );
}
