import { useCallback, useEffect, useState, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { AlertTriangle, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { ConfirmDeletionDialog } from "@/components/site/ConfirmDeletionDialog";
import { Input } from "@/components/ui/input";
import type { Location } from "@/data/locations";
import type { FrequencyBand, FrequencyCategory } from "@/lib/supabase/types";
import {
  BAND_LABELS,
  CATEGORY_LABELS,
  FREQUENCY_BANDS,
  FREQUENCY_CATEGORIES,
  FREQUENCY_CODE_PATTERN,
  MAX_FREQUENCY_PRICE,
  STANDARD_FREQUENCY_CODES,
  formatEuro,
} from "@/lib/registry/registry";
import {
  createFrequencyCode,
  listFrequencyCodes,
  loadStandardFrequencyCodes,
  updateFrequencyCode,
  deleteFrequencyCode,
  getFrequencyCodeDeletionPreview,
  type FrequencyCodeWithUsage,
} from "@/lib/registry/frequency-codes-fns";

const selectCls =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-semibold";
const btnSmall =
  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold border border-border bg-white hover:bg-secondary transition-colors disabled:opacity-50";

// La sezione vive dentro il form della sede: Invio in un campo non deve
// salvare la sede intera.
function blockEnter(e: KeyboardEvent<HTMLInputElement>) {
  if (e.key === "Enter") e.preventDefault();
}

// Prezzo all'italiana: accetta sia la virgola sia il punto.
function parsePrice(text: string): number | null {
  const normalized = text.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const n = Number(normalized);
  return Number.isFinite(n) && n <= MAX_FREQUENCY_PRICE ? n : null;
}

function priceText(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

type Draft = {
  label: string;
  category: FrequencyCategory;
  band: FrequencyBand;
  convenzione: boolean;
  price: string;
};

// Sezione "Codici di frequenza" della scheda sede (M11.2b): la legenda codici
// e prezzi del registro. Codice e sede non cambiano mai; un codice non si
// elimina, si disattiva. Ogni modifica passa da una server function con audit.
export function LocationFrequencyCodesAdmin({ location }: { location: Location }) {
  const [codes, setCodes] = useState<FrequencyCodeWithUsage[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const res = await listFrequencyCodes({
      data: { locationId: location.id, locationSlug: location.slug },
    });
    if (!res.ok) {
      setLoadError(res.error);
      return;
    }
    setLoadError(null);
    setCodes(res.codes);
  }, [location.id, location.slug]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function run(
    op: () => Promise<{ ok: true } | { ok: false; error: string }>,
    okMsg: string,
  ): Promise<boolean> {
    setBusy(true);
    try {
      const res = await op();
      if (!res.ok) {
        toast.error(res.error);
        return false;
      }
      toast.success(okMsg);
      await reload();
      return true;
    } finally {
      setBusy(false);
    }
  }

  if (loadError) {
    return <p className="text-sm text-flame font-semibold">{loadError}</p>;
  }
  if (codes === null) {
    return <p className="text-sm text-muted-foreground">Caricamento dei codici…</p>;
  }

  const activeCount = codes.filter((c) => c.active).length;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-sun/40 bg-sun/10 px-3 py-2 text-xs flex gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 text-sun-foreground mt-0.5" />
        <span>
          Prezzo, categoria e fascia valgono anche per le caselle già compilate: cambiandoli, le
          quote e il riepilogo del registro si aggiornano subito, come quando si modifica la legenda
          nel file Excel. Accanto a ogni codice trovi quante caselle lo usano.
        </span>
      </div>

      {codes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-4 text-sm">
          <p className="font-semibold">Questa sede non ha ancora codici di frequenza.</p>
          <p className="text-muted-foreground mt-1">
            Senza codici le caselle del registro restano bloccate. Puoi partire dagli 8 codici
            standard ({STANDARD_FREQUENCY_CODES.map((c) => c.code).join(", ")}) ai prezzi di
            Asigliano e poi adattare i prezzi, oppure aggiungere i codici uno per uno qui sotto.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              run(
                () => loadStandardFrequencyCodes({ data: { locationId: location.id } }),
                "Caricati gli 8 codici standard.",
              )
            }
            className={`${btnSmall} mt-3`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Carica gli 8 codici standard
          </button>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {activeCount} codici attivi su {codes.length}. Un codice disattivato sparisce dalle
            tendine del registro ma resta valido nelle caselle dove è già stato usato. Si elimina
            definitivamente solo un codice che nessuna casella usa.
          </p>
          <ul className="space-y-2">
            {codes.map((c) =>
              editingId === c.id ? (
                <li key={c.id} className="rounded-xl border border-primary/40 bg-white p-3">
                  <CodeEditor
                    code={c}
                    busy={busy}
                    onCancel={() => setEditingId(null)}
                    onSave={async (patch) => {
                      const ok = await run(
                        () => updateFrequencyCode({ data: { id: c.id, ...patch } }),
                        `Codice ${c.code} aggiornato.`,
                      );
                      if (ok) setEditingId(null);
                    }}
                  />
                </li>
              ) : (
                <li
                  key={c.id}
                  className={`flex items-center gap-3 rounded-xl border border-border px-3 py-2 ${c.active ? "bg-white" : "bg-secondary/50"}`}
                >
                  <span className="font-pixel text-sm w-12 shrink-0">{c.code}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">
                      {c.label}
                      {!c.active && (
                        <span className="ml-2 font-pixel text-xs text-muted-foreground">
                          disattivato
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {BAND_LABELS[c.band]} · {CATEGORY_LABELS[c.category]}
                      {c.convenzione ? " · convenzione" : " · senza convenzione"} ·{" "}
                      {c.usage === 1 ? "usato in 1 casella" : `usato in ${c.usage} caselle`}
                    </div>
                  </div>
                  <span className="text-sm font-semibold shrink-0">{formatEuro(c.price)}</span>
                  <label className="inline-flex items-center gap-1.5 text-xs font-semibold shrink-0">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-input"
                      checked={c.active}
                      disabled={busy}
                      onChange={(e) =>
                        run(
                          () =>
                            updateFrequencyCode({ data: { id: c.id, active: e.target.checked } }),
                          e.target.checked
                            ? `Codice ${c.code} attivato.`
                            : `Codice ${c.code} disattivato.`,
                        )
                      }
                    />
                    attivo
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditingId(c.id)}
                    disabled={busy}
                    className={btnSmall}
                    aria-label={`Modifica il codice ${c.code}`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  {c.usage === 0 && (
                    <button
                      type="button"
                      onClick={() => setDeletingId(c.id)}
                      disabled={busy}
                      className={btnSmall}
                      aria-label={`Elimina il codice ${c.code}`}
                      title="Nessuna casella lo usa: si può eliminare definitivamente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </li>
              ),
            )}
          </ul>
        </>
      )}

      <ConfirmDeletionDialog
        open={deletingId !== null}
        onOpenChange={(open) => !open && setDeletingId(null)}
        loadPreview={() => getFrequencyCodeDeletionPreview({ data: { id: deletingId! } })}
        onConfirm={() =>
          run(() => deleteFrequencyCode({ data: { id: deletingId! } }), "Codice eliminato.")
        }
      />

      <NewCodeForm
        busy={busy}
        existingCodes={codes.map((c) => c.code)}
        onCreate={(input) =>
          run(
            () => createFrequencyCode({ data: { locationId: location.id, ...input } }),
            `Codice ${input.code} aggiunto.`,
          )
        }
      />
    </div>
  );
}

function DraftFields({
  draft,
  setDraft,
  disabled,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  disabled: boolean;
}) {
  return (
    <>
      <div className="md:col-span-2">
        <div className="text-xs font-bold text-muted-foreground mb-1">Etichetta</div>
        <Input
          className="rounded-xl"
          value={draft.label}
          maxLength={80}
          disabled={disabled}
          onKeyDown={blockEnter}
          onChange={(e) => setDraft({ ...draft, label: e.target.value })}
        />
      </div>
      <div>
        <div className="text-xs font-bold text-muted-foreground mb-1">Categoria</div>
        <select
          className={selectCls}
          value={draft.category}
          disabled={disabled}
          onChange={(e) => setDraft({ ...draft, category: e.target.value as FrequencyCategory })}
        >
          {FREQUENCY_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <div className="text-xs font-bold text-muted-foreground mb-1">Fascia</div>
        <select
          className={selectCls}
          value={draft.band}
          disabled={disabled}
          onChange={(e) => setDraft({ ...draft, band: e.target.value as FrequencyBand })}
        >
          {FREQUENCY_BANDS.map((b) => (
            <option key={b} value={b}>
              {BAND_LABELS[b]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <div className="text-xs font-bold text-muted-foreground mb-1">Prezzo a settimana (€)</div>
        <Input
          className="rounded-xl"
          inputMode="decimal"
          value={draft.price}
          disabled={disabled}
          onKeyDown={blockEnter}
          onChange={(e) => setDraft({ ...draft, price: e.target.value })}
        />
      </div>
      <label className="inline-flex items-center gap-2 text-sm font-semibold h-10">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-input"
          checked={draft.convenzione}
          disabled={disabled}
          onChange={(e) => setDraft({ ...draft, convenzione: e.target.checked })}
        />
        Convenzione col comune
      </label>
    </>
  );
}

function validateDraft(draft: Draft): { price: number; label: string } | null {
  const label = draft.label.trim();
  if (!label) {
    toast.error("Inserisci l'etichetta del codice.");
    return null;
  }
  const price = parsePrice(draft.price);
  if (price === null) {
    toast.error("Prezzo non valido: usa un numero, con al massimo due decimali.");
    return null;
  }
  return { price, label };
}

function CodeEditor({
  code,
  busy,
  onCancel,
  onSave,
}: {
  code: FrequencyCodeWithUsage;
  busy: boolean;
  onCancel: () => void;
  onSave: (patch: {
    label: string;
    category: FrequencyCategory;
    band: FrequencyBand;
    convenzione: boolean;
    price: number;
  }) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Draft>({
    label: code.label,
    category: code.category,
    band: code.band,
    convenzione: code.convenzione,
    price: priceText(code.price),
  });

  return (
    <div className="grid md:grid-cols-6 gap-3 items-end">
      <div className="md:col-span-6 text-xs text-muted-foreground">
        Codice <strong className="font-pixel">{code.code}</strong>: non modificabile.{" "}
        {code.usage > 0 &&
          `Le modifiche valgono anche per ${code.usage === 1 ? "la casella" : `le ${code.usage} caselle`} che già lo usano.`}
      </div>
      <DraftFields draft={draft} setDraft={setDraft} disabled={busy} />
      <div className="md:col-span-6 flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            const valid = validateDraft(draft);
            if (!valid) return;
            void onSave({
              label: valid.label,
              category: draft.category,
              band: draft.band,
              convenzione: draft.convenzione,
              price: valid.price,
            });
          }}
          className={btnSmall}
        >
          Salva codice
        </button>
        <button type="button" onClick={onCancel} className={btnSmall}>
          <X className="w-3.5 h-3.5" /> Annulla
        </button>
      </div>
    </div>
  );
}

function NewCodeForm({
  busy,
  existingCodes,
  onCreate,
}: {
  busy: boolean;
  existingCodes: string[];
  onCreate: (input: {
    code: string;
    label: string;
    category: FrequencyCategory;
    band: FrequencyBand;
    convenzione: boolean;
    price: number;
  }) => Promise<boolean>;
}) {
  const empty: Draft = {
    label: "",
    category: "primaria",
    band: "intera",
    convenzione: false,
    price: "",
  };
  const [code, setCode] = useState("");
  const [draft, setDraft] = useState<Draft>(empty);

  async function submit() {
    const normalized = code.trim().toUpperCase();
    if (!FREQUENCY_CODE_PATTERN.test(normalized)) {
      toast.error("Il codice può contenere solo lettere maiuscole e cifre, massimo 8.");
      return;
    }
    if (existingCodes.includes(normalized)) {
      toast.error(`Il codice ${normalized} esiste già in questa sede.`);
      return;
    }
    const valid = validateDraft(draft);
    if (!valid) return;
    const ok = await onCreate({
      code: normalized,
      label: valid.label,
      category: draft.category,
      band: draft.band,
      convenzione: draft.convenzione,
      price: valid.price,
    });
    if (ok) {
      setCode("");
      setDraft(empty);
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-border p-3 grid md:grid-cols-6 gap-3 items-end">
      <div className="md:col-span-6 text-xs font-bold text-muted-foreground">
        Nuovo codice di frequenza
      </div>
      <div>
        <div className="text-xs font-bold text-muted-foreground mb-1">Codice</div>
        <Input
          className="rounded-xl font-pixel uppercase"
          placeholder="Es. IC"
          maxLength={8}
          value={code}
          disabled={busy}
          onKeyDown={blockEnter}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
      </div>
      <DraftFields draft={draft} setDraft={setDraft} disabled={busy} />
      <div className="md:col-span-6">
        <button type="button" onClick={submit} disabled={busy} className={btnSmall}>
          <Plus className="w-3.5 h-3.5" /> Aggiungi codice
        </button>
        <span className="ml-3 text-xs text-muted-foreground">
          Il codice si sceglie ora e poi non si cambia più.
        </span>
      </div>
    </div>
  );
}
