import { useState } from "react";
import { toast } from "sonner";
import { Download, FileText } from "lucide-react";
import { LOCATION_DOCUMENT_CATEGORY_LABELS, type LocationDocument } from "@/data/locations";
import { getLocationDocumentUrl } from "@/lib/locations/documents-fns";
import { formatBytes } from "@/lib/locations/documents";

// Elenco documenti della sede scaricabili (pagina pubblica e wizard). Il
// link è un URL firmato a breve scadenza generato dalla server function.
export function LocationDocumentsList({
  documents,
  title,
  subtitle,
}: {
  documents: LocationDocument[];
  title: string;
  subtitle?: string;
}) {
  if (documents.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <FileText className="w-5 h-5 text-magic" />
        <h3 className="font-display text-xl font-bold">{title}</h3>
      </div>
      {subtitle && <p className="text-sm text-muted-foreground mb-3">{subtitle}</p>}
      <ul className="space-y-2">
        {documents.map((d) => (
          <li key={d.id}>
            <DocumentDownloadRow doc={d} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DocumentDownloadRow({ doc }: { doc: LocationDocument }) {
  const [busy, setBusy] = useState(false);
  async function download() {
    setBusy(true);
    try {
      const res = await getLocationDocumentUrl({ data: { id: doc.id } });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      window.open(res.url, "_blank", "noopener");
    } catch {
      toast.error("Download non riuscito. Riprova.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <button
      type="button"
      onClick={download}
      disabled={busy}
      className="w-full flex items-center justify-between gap-3 rounded-xl border border-border bg-white px-3 py-2 text-left hover:bg-secondary transition-colors disabled:opacity-60"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold truncate">{doc.title}</span>
        <span className="block text-xs text-muted-foreground truncate">
          {LOCATION_DOCUMENT_CATEGORY_LABELS[doc.category]} · {doc.fileName} ·{" "}
          {formatBytes(doc.sizeBytes)}
        </span>
      </span>
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary shrink-0">
        <Download className="w-4 h-4" /> {busy ? "Preparo…" : "Scarica"}
      </span>
    </button>
  );
}
