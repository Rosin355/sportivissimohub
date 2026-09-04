import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Pencil, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Location, LocationCustomField } from "@/data/locations";
import type { CustomFieldType } from "@/lib/supabase/types";
import {
  CUSTOM_FIELD_TYPES,
  CUSTOM_FIELD_TYPE_LABELS,
  MAX_ACTIVE_CUSTOM_FIELDS,
} from "@/lib/enrollments/custom-fields";
import {
  createCustomField,
  reorderCustomFields,
  updateCustomField,
} from "@/lib/locations/custom-fields-fns";

const selectCls =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-semibold";
const btnSmall =
  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold border border-border bg-white hover:bg-secondary transition-colors disabled:opacity-50";

function parseOptions(text: string): string[] {
  return [
    ...new Set(
      text
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ];
}

// Sezione "Campi personalizzati" dell'editor sede: crea, modifica (etichetta,
// opzioni, obbligatorio), riordina, attiva/disattiva. Mai eliminazione
// fisica: un campo con risposte si disattiva e le risposte restano.
export function LocationCustomFieldsAdmin({ location }: { location: Location }) {
  const router = useRouter();
  const fields = location.customFields;
  const activeCount = fields.filter((f) => f.active).length;
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function run(
    op: () => Promise<{ ok: true } | { ok: false; error: string }>,
    okMsg?: string,
  ) {
    setBusy(true);
    try {
      const res = await op();
      if (!res.ok) {
        toast.error(res.error);
        return false;
      }
      if (okMsg) toast.success(okMsg);
      await router.invalidate();
      return true;
    } finally {
      setBusy(false);
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= fields.length) return;
    const ids = fields.map((f) => f.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    await run(() => reorderCustomFields({ data: { locationId: location.id, orderedIds: ids } }));
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {activeCount}/{MAX_ACTIVE_CUSTOM_FIELDS} campi attivi. I campi non influenzano prezzi, posti
        o logica; disattivare o modificare un campo non tocca le risposte già raccolte.
      </p>

      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nessun campo personalizzato per questa sede.
        </p>
      ) : (
        <ul className="space-y-2">
          {fields.map((f, i) =>
            editingId === f.id ? (
              <li key={f.id} className="rounded-xl border border-primary/40 bg-white p-3">
                <FieldEditor
                  field={f}
                  busy={busy}
                  onCancel={() => setEditingId(null)}
                  onSave={async (patch) => {
                    const ok = await run(
                      () => updateCustomField({ data: { id: f.id, ...patch } }),
                      "Campo aggiornato.",
                    );
                    if (ok) setEditingId(null);
                  }}
                />
              </li>
            ) : (
              <li
                key={f.id}
                className={`flex items-center gap-3 rounded-xl border border-border px-3 py-2 ${f.active ? "bg-white" : "bg-secondary/50"}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">
                    {f.label}
                    {f.required && <span className="text-flame"> *</span>}
                    {!f.active && (
                      <span className="ml-2 font-pixel text-xs text-muted-foreground">
                        disattivato
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {CUSTOM_FIELD_TYPE_LABELS[f.fieldType]} · codice {f.code}
                    {f.fieldType === "scelta" &&
                      f.options.length > 0 &&
                      ` · ${f.options.join(", ")}`}
                  </div>
                </div>
                <label className="inline-flex items-center gap-1.5 text-xs font-semibold shrink-0">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-input"
                    checked={f.active}
                    disabled={busy}
                    onChange={(e) =>
                      run(
                        () => updateCustomField({ data: { id: f.id, active: e.target.checked } }),
                        e.target.checked ? "Campo attivato." : "Campo disattivato.",
                      )
                    }
                  />
                  attivo
                </label>
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
                    disabled={busy || i === fields.length - 1}
                    className={btnSmall}
                    aria-label="Sposta giù"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(f.id)}
                    disabled={busy}
                    className={btnSmall}
                    aria-label="Modifica"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}

      <NewFieldForm
        busy={busy}
        disabled={activeCount >= MAX_ACTIVE_CUSTOM_FIELDS}
        onCreate={(input) =>
          run(
            () => createCustomField({ data: { locationId: location.id, ...input } }),
            "Campo aggiunto.",
          )
        }
      />
    </div>
  );
}

function FieldEditor({
  field,
  busy,
  onCancel,
  onSave,
}: {
  field: LocationCustomField;
  busy: boolean;
  onCancel: () => void;
  onSave: (patch: { label: string; options?: string[]; required: boolean }) => Promise<void>;
}) {
  const [label, setLabel] = useState(field.label);
  const [options, setOptions] = useState(field.options.join("\n"));
  const [required, setRequired] = useState(field.required);
  return (
    <div className="grid md:grid-cols-3 gap-3 items-end">
      <div className="md:col-span-2">
        <div className="text-xs font-bold text-muted-foreground mb-1">Etichetta</div>
        <Input className="rounded-xl" value={label} onChange={(e) => setLabel(e.target.value)} />
        <div className="text-[11px] text-muted-foreground mt-1">
          Tipo {CUSTOM_FIELD_TYPE_LABELS[field.fieldType]} e codice {field.code}: non modificabili.
        </div>
      </div>
      <label className="inline-flex items-center gap-2 text-sm font-semibold h-10">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-input"
          checked={required}
          onChange={(e) => setRequired(e.target.checked)}
        />
        Obbligatorio
      </label>
      {field.fieldType === "scelta" && (
        <div className="md:col-span-3">
          <div className="text-xs font-bold text-muted-foreground mb-1">Opzioni (una per riga)</div>
          <Textarea rows={3} value={options} onChange={(e) => setOptions(e.target.value)} />
        </div>
      )}
      <div className="md:col-span-3 flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            onSave({
              label: label.trim(),
              required,
              ...(field.fieldType === "scelta" ? { options: parseOptions(options) } : {}),
            })
          }
          className={btnSmall}
        >
          Salva campo
        </button>
        <button type="button" onClick={onCancel} className={btnSmall}>
          <X className="w-3.5 h-3.5" /> Annulla
        </button>
      </div>
    </div>
  );
}

function NewFieldForm({
  busy,
  disabled,
  onCreate,
}: {
  busy: boolean;
  disabled: boolean;
  onCreate: (input: {
    label: string;
    fieldType: CustomFieldType;
    options: string[];
    required: boolean;
  }) => Promise<boolean>;
}) {
  const [label, setLabel] = useState("");
  const [fieldType, setFieldType] = useState<CustomFieldType>("testo");
  const [options, setOptions] = useState("");
  const [required, setRequired] = useState(false);

  async function submit() {
    if (!label.trim()) {
      toast.error("Inserisci l'etichetta del campo.");
      return;
    }
    const opts = fieldType === "scelta" ? parseOptions(options) : [];
    if (fieldType === "scelta" && opts.length === 0) {
      toast.error("Inserisci almeno un'opzione (una per riga).");
      return;
    }
    const ok = await onCreate({ label: label.trim(), fieldType, options: opts, required });
    if (ok) {
      setLabel("");
      setOptions("");
      setRequired(false);
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-border p-3 grid md:grid-cols-4 gap-3 items-end">
      <div className="md:col-span-2">
        <div className="text-xs font-bold text-muted-foreground mb-1">Etichetta (domanda)</div>
        <Input
          className="rounded-xl"
          placeholder="Es. Taglia maglietta"
          value={label}
          disabled={busy || disabled}
          onChange={(e) => setLabel(e.target.value)}
        />
      </div>
      <div>
        <div className="text-xs font-bold text-muted-foreground mb-1">Tipo</div>
        <select
          className={selectCls}
          value={fieldType}
          disabled={busy || disabled}
          onChange={(e) => setFieldType(e.target.value as CustomFieldType)}
        >
          {CUSTOM_FIELD_TYPES.map((t) => (
            <option key={t} value={t}>
              {CUSTOM_FIELD_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>
      <label className="inline-flex items-center gap-2 text-sm font-semibold h-10">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-input"
          checked={required}
          disabled={busy || disabled}
          onChange={(e) => setRequired(e.target.checked)}
        />
        Obbligatorio
      </label>
      {fieldType === "scelta" && (
        <div className="md:col-span-4">
          <div className="text-xs font-bold text-muted-foreground mb-1">Opzioni (una per riga)</div>
          <Textarea
            rows={3}
            value={options}
            disabled={busy || disabled}
            onChange={(e) => setOptions(e.target.value)}
          />
        </div>
      )}
      <div className="md:col-span-4">
        <button type="button" onClick={submit} disabled={busy || disabled} className={btnSmall}>
          <Plus className="w-3.5 h-3.5" /> Aggiungi campo
        </button>
        {disabled && (
          <span className="ml-3 text-xs text-muted-foreground">
            Limite di {MAX_ACTIVE_CUSTOM_FIELDS} campi attivi raggiunto.
          </span>
        )}
      </div>
    </div>
  );
}
