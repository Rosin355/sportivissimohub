import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Download, Trash2, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  LOCATION_DOCUMENT_CATEGORIES,
  LOCATION_DOCUMENT_CATEGORY_LABELS,
  type Location,
  type LocationDocument,
} from "@/data/locations";
import type { LocationDocumentCategory } from "@/lib/supabase/types";
import {
  LOCATION_DOC_ACCEPT,
  formatBytes,
  removeUploadedLocationDocument,
  uploadLocationDocumentFile,
  validateLocationDocumentFile,
} from "@/lib/locations/documents";
import {
  createLocationDocument,
  deleteLocationDocument,
  getLocationDocumentUrl,
  reorderLocationDocuments,
  updateLocationDocument,
} from "@/lib/locations/documents-fns";

const selectCls =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-semibold";
const btnSmall =
  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold border border-border bg-white hover:bg-secondary transition-colors disabled:opacity-50";

// Sezione "Documenti della sede" dell'editor admin: upload (file + categoria
// + titolo + visibilità), riordino, cambio visibilità, eliminazione.
// Dopo ogni operazione il loader della route viene invalidato.
export function LocationDocumentsAdmin({ location }: { location: Location }) {
  const router = useRouter();
  const docs = location.documents;
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<LocationDocumentCategory>("regolamento");
  const [title, setTitle] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  async function refresh() {
    await router.invalidate();
  }

  async function upload() {
    if (!file) {
      toast.error("Scegli un file.");
      return;
    }
    const invalid = validateLocationDocumentFile(file);
    if (invalid) {
      toast.error(invalid);
      return;
    }
    if (!title.trim()) {
      toast.error("Inserisci un titolo.");
      return;
    }
    setBusy(true);
    try {
      // File prima, riga dopo: se la riga fallisce il file viene rimosso.
      const id = crypto.randomUUID();
      const up = await uploadLocationDocumentFile(location.id, id, file);
      if (!up.ok) {
        toast.error(up.error);
        return;
      }
      const res = await createLocationDocument({
        data: {
          id,
          locationId: location.id,
          category,
          title: title.trim(),
          isPublic: category === "template_overlay" ? false : isPublic,
          fileName: file.name,
          sizeBytes: file.size,
          mimeType:
            file.type as (typeof import("@/lib/locations/documents").LOCATION_DOC_MIME)[number],
        },
      });
      if (!res.ok) {
        await removeUploadedLocationDocument(up.path);
        toast.error(res.error);
        return;
      }
      toast.success("Documento caricato.");
      setFile(null);
      setTitle("");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function togglePublic(doc: LocationDocument, next: boolean) {
    const res = await updateLocationDocument({ data: { id: doc.id, isPublic: next } });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    await refresh();
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= docs.length) return;
    const ids = docs.map((d) => d.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    const res = await reorderLocationDocuments({
      data: { locationId: location.id, orderedIds: ids },
    });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    await refresh();
  }

  async function remove(doc: LocationDocument) {
    if (!window.confirm(`Eliminare "${doc.title}"? Il file verrà rimosso dallo storage.`)) return;
    setBusy(true);
    try {
      const res = await deleteLocationDocument({ data: { id: doc.id } });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Documento eliminato.");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function download(doc: LocationDocument) {
    const res = await getLocationDocumentUrl({ data: { id: doc.id } });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    window.open(res.url, "_blank", "noopener");
  }

  return (
    <div className="space-y-4">
      {docs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessun documento caricato per questa sede.</p>
      ) : (
        <ul className="space-y-2">
          {docs.map((doc, i) => (
            <li
              key={doc.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-white px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate">{doc.title}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {LOCATION_DOCUMENT_CATEGORY_LABELS[doc.category]} · {doc.fileName} ·{" "}
                  {formatBytes(doc.sizeBytes)}
                </div>
              </div>
              {doc.category === "template_overlay" ? (
                <span className="font-pixel rounded-lg border px-2 py-0.5 bg-secondary text-muted-foreground border-border">
                  interno
                </span>
              ) : (
                <label className="inline-flex items-center gap-1.5 text-xs font-semibold">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-input"
                    checked={doc.isPublic}
                    disabled={busy}
                    onChange={(e) => togglePublic(doc, e.target.checked)}
                  />
                  pubblico
                </label>
              )}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={busy || i === 0}
                  className={btnSmall}
                  aria-label="Sposta su"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={busy || i === docs.length - 1}
                  className={btnSmall}
                  aria-label="Sposta giù"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => download(doc)}
                  disabled={busy}
                  className={btnSmall}
                  aria-label="Scarica"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(doc)}
                  disabled={busy}
                  className="inline-flex items-center rounded-lg px-2.5 py-1.5 text-xs font-bold border border-flame/40 text-flame hover:bg-flame/10 disabled:opacity-50"
                  aria-label="Elimina"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-xl border border-dashed border-border p-3 grid md:grid-cols-4 gap-3 items-end">
        <div className="md:col-span-2">
          <div className="text-xs font-bold text-muted-foreground mb-1">File (max 10 MB)</div>
          <input
            type="file"
            accept={LOCATION_DOC_ACCEPT}
            className="block w-full text-sm"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFile(f);
              if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ""));
            }}
          />
        </div>
        <div>
          <div className="text-xs font-bold text-muted-foreground mb-1">Categoria</div>
          <select
            className={selectCls}
            value={category}
            disabled={busy}
            onChange={(e) => setCategory(e.target.value as LocationDocumentCategory)}
          >
            {LOCATION_DOCUMENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {LOCATION_DOCUMENT_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="text-xs font-bold text-muted-foreground mb-1">Titolo</div>
          <Input
            className="rounded-xl"
            value={title}
            disabled={busy}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="md:col-span-3 flex items-center gap-4 flex-wrap">
          <label className="inline-flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input"
              checked={category !== "template_overlay" && isPublic}
              disabled={busy || category === "template_overlay"}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            Visibile al pubblico (pagina sede e wizard)
          </label>
          {category === "template_overlay" && (
            <span className="text-xs text-muted-foreground">
              I template PDF sono file di lavoro: mai esposti al pubblico.
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={upload}
          disabled={busy}
          className={`${btnSmall} h-10 justify-center`}
        >
          <Upload className="w-3.5 h-3.5" /> {busy ? "Attendi…" : "Carica"}
        </button>
      </div>
    </div>
  );
}
