import { useEffect, useState } from "react";
import { createFileRoute, Link, notFound, useNavigate, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Plus, Table2, Trash2, X } from "lucide-react";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Input } from "@/components/ui/input";
import { requireRole } from "@/lib/supabase/auth";
import type { CashMovementKind, PaymentMethod } from "@/lib/supabase/types";
import { formatEuro } from "@/lib/registry/registry";
import {
  CASH_MOVEMENT_KINDS,
  CASH_MOVEMENT_KIND_LABELS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  amountText,
  entryLabel,
  formatDay,
  isIsoDate,
  parseAmount,
  todayIso,
  type CashBook,
  type CashEntry,
  type MethodSummary,
} from "@/lib/registry/payments";
import { deleteCashMovement, getCashBook, saveCashMovement } from "@/lib/registry/payments-fns";

// Cassa di sede (M11.3), solo admin: rate e rimborsi dei bambini più spese,
// consegne di contanti e altri movimenti, filtrabili per periodo. I totali per
// metodo arrivano calcolati dal server. Le rate si gestiscono dal registro
// (scheda pagamenti del bambino); qui si registrano i movimenti di cassa.

type CashSearch = { from?: string; to?: string };

export const Route = createFileRoute("/area-admin_/sedi_/$slug/cassa")({
  validateSearch: (search: Record<string, unknown>): CashSearch => ({
    from: typeof search.from === "string" && isIsoDate(search.from) ? search.from : undefined,
    to: typeof search.to === "string" && isIsoDate(search.to) ? search.to : undefined,
  }),
  beforeLoad: ({ context, location }) => ({
    auth: requireRole(context.auth, "admin", location.href),
  }),
  loaderDeps: ({ search }) => ({ from: search.from, to: search.to }),
  loader: async ({ params, deps }): Promise<CashBook> => {
    // Periodo rovesciato: si ignora invece di mostrare un errore.
    const inverted = deps.from && deps.to && deps.from > deps.to;
    const res = await getCashBook({
      data: {
        slug: params.slug,
        from: inverted ? null : (deps.from ?? null),
        to: inverted ? null : (deps.to ?? null),
      },
    });
    if (!res.ok) throw new Error(res.error);
    if (!res.book) throw notFound();
    return res.book;
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `Cassa ${(loaderData as CashBook | undefined)?.locationName ?? "sede"} — Area Admin`,
      },
    ],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1 container mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold mb-3">Sede non trovata</h1>
        <Link to="/area-admin/sedi" className="font-semibold underline">
          Torna all'elenco sedi
        </Link>
      </main>
      <SiteFooter />
    </div>
  ),
  component: CassaPage,
});

const selectCls =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-semibold";
const btnSmall =
  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold border border-border bg-white hover:bg-secondary transition-colors disabled:opacity-50";

function CassaPage() {
  const book: CashBook = Route.useLoaderData();
  const router = useRouter();
  const navigate = useNavigate({ from: Route.fullPath });
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [from, setFrom] = useState(book.from ?? "");
  const [to, setTo] = useState(book.to ?? "");

  useEffect(() => {
    setFrom(book.from ?? "");
    setTo(book.to ?? "");
  }, [book.from, book.to]);

  const filtered = Boolean(book.from || book.to);
  const s = book.summary;

  function applyPeriod(next: { from: string; to: string }) {
    if (next.from && next.to && next.from > next.to) {
      toast.error("La data di inizio è successiva a quella di fine.");
      return;
    }
    void navigate({
      search: { from: next.from || undefined, to: next.to || undefined },
    });
  }

  async function run(op: () => Promise<{ ok: true } | { ok: false; error: string }>, msg: string) {
    setBusy(true);
    try {
      const res = await op();
      if (!res.ok) {
        toast.error(res.error);
        return false;
      }
      toast.success(msg);
      await router.invalidate();
      return true;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1 container mx-auto px-4 py-10">
        <Link
          to="/area-admin/sedi/$slug/registro"
          params={{ slug: book.locationSlug }}
          className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Registro della sede
        </Link>
        <div className="flex items-end justify-between flex-wrap gap-4 mt-3 mb-6">
          <div>
            <span className="inline-flex items-center bg-primary/10 text-primary border border-primary/20 rounded-xl px-3 py-1 font-pixel mb-3">
              Cassa sede
            </span>
            <h1 className="font-display text-4xl font-bold">{book.locationName}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {filtered
                ? `Periodo ${book.from ? `dal ${formatDay(book.from)}` : "dall'inizio"} ${book.to ? `al ${formatDay(book.to)}` : "a oggi"}`
                : "Tutti i movimenti registrati"}{" "}
              · {s.count} {s.count === 1 ? "movimento" : "movimenti"}
            </p>
          </div>
        </div>

        {/* Filtro periodo */}
        <section className="rounded-2xl border border-border bg-white shadow-pop p-4 mb-6 flex flex-wrap items-end gap-3">
          <div>
            <div className="text-xs font-bold text-muted-foreground mb-1">Dal</div>
            <Input
              type="date"
              className="rounded-xl"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <div className="text-xs font-bold text-muted-foreground mb-1">Al</div>
            <Input
              type="date"
              className="rounded-xl"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <button type="button" className={btnSmall} onClick={() => applyPeriod({ from, to })}>
            Applica
          </button>
          {filtered && (
            <button
              type="button"
              className={btnSmall}
              onClick={() => applyPeriod({ from: "", to: "" })}
            >
              <X className="w-3.5 h-3.5" /> Tutto il periodo
            </button>
          )}
        </section>

        {/* Totali per metodo, calcolati dal server */}
        <section className="grid md:grid-cols-3 gap-4 mb-6">
          {PAYMENT_METHODS.map((m) => (
            <MethodCard key={m} summary={s.byMethod[m]} filtered={filtered} />
          ))}
          <div className="rounded-2xl border border-border bg-secondary/40 p-4">
            <div className="font-pixel text-xs text-muted-foreground">Totale</div>
            <SummaryLine label="Incassi" value={s.incassi} />
            <SummaryLine label="Rimborsi" value={s.rimborsi} />
            <SummaryLine label="Spese, consegne e altro" value={s.movimenti} />
            <div className="border-t border-border mt-2 pt-2 flex justify-between font-display text-lg font-bold">
              <span>Netto</span>
              <span>{formatEuro(s.netto)}</span>
            </div>
          </div>
        </section>

        {/* Nuovo movimento di cassa */}
        <section className="rounded-2xl border border-border bg-white shadow-pop p-5 mb-6">
          <h2 className="font-display text-xl font-bold mb-1">Registra un movimento di cassa</h2>
          <p className="text-xs text-muted-foreground mb-3">
            Spese e consegne di contanti escono dalla cassa: scrivi l'importo senza segno. Le rate e
            i rimborsi dei bambini si registrano dal registro, nella scheda pagamenti.
          </p>
          <MovementForm
            busy={busy}
            onSubmit={(values) =>
              run(
                () => saveCashMovement({ data: { locationId: book.locationId, ...values } }),
                "Movimento registrato.",
              )
            }
          />
        </section>

        {/* Elenco movimenti */}
        <section className="rounded-2xl border border-border bg-white shadow-pop p-5 overflow-x-auto">
          <h2 className="font-display text-xl font-bold mb-3">Movimenti</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left font-pixel text-muted-foreground border-b border-border">
                <th className="py-2 pr-3">Data</th>
                <th className="py-2 pr-3">Tipo</th>
                <th className="py-2 pr-3">Dettaglio</th>
                <th className="py-2 pr-3">Metodo</th>
                <th className="py-2 pr-3 text-right">Importo</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {book.entries.map((e) =>
                e.source === "movement" && editingId === e.id ? (
                  <tr key={e.id} className="border-b border-border">
                    <td colSpan={6} className="py-3">
                      <MovementForm
                        initial={e}
                        busy={busy}
                        onCancel={() => setEditingId(null)}
                        onSubmit={async (values) => {
                          const ok = await run(
                            () =>
                              saveCashMovement({
                                data: { id: e.id, locationId: book.locationId, ...values },
                              }),
                            "Movimento aggiornato.",
                          );
                          if (ok) setEditingId(null);
                          return ok;
                        }}
                      />
                    </td>
                  </tr>
                ) : (
                  <EntryRow
                    key={`${e.source}-${e.id}`}
                    entry={e}
                    busy={busy}
                    locationSlug={book.locationSlug}
                    onEdit={() => setEditingId(e.id)}
                    onDelete={() => {
                      if (e.source !== "movement") return;
                      const what = `${CASH_MOVEMENT_KIND_LABELS[e.kind].toLowerCase()} di ${formatEuro(e.amount)} del ${formatDay(e.date)}`;
                      if (
                        !window.confirm(
                          `Eliminare ${what}? Resta traccia nel registro delle azioni.`,
                        )
                      )
                        return;
                      void run(
                        () =>
                          deleteCashMovement({ data: { id: e.id, locationId: book.locationId } }),
                        "Movimento eliminato.",
                      );
                    }}
                  />
                ),
              )}
              {book.entries.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-muted-foreground">
                    {filtered
                      ? "Nessun movimento in questo periodo."
                      : "Nessun movimento registrato per questa sede."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-sm mt-1">
      <span className="text-muted-foreground">{label}</span>
      <span className={value < 0 ? "text-royal font-semibold" : "font-semibold"}>
        {formatEuro(value)}
      </span>
    </div>
  );
}

function MethodCard({ summary, filtered }: { summary: MethodSummary; filtered: boolean }) {
  const cash = summary.method === "contanti";
  return (
    <div className="rounded-2xl border border-border bg-white shadow-pop p-4">
      <div className="font-pixel text-xs text-muted-foreground">
        {PAYMENT_METHOD_LABELS[summary.method]}
      </div>
      <SummaryLine label="Incassi" value={summary.incassi} />
      <SummaryLine label="Rimborsi" value={summary.rimborsi} />
      <SummaryLine
        label={cash ? "Spese e consegne" : "Altri movimenti"}
        value={summary.movimenti}
      />
      <div className="border-t border-border mt-2 pt-2 flex justify-between font-display text-lg font-bold">
        {/* "In cassa" ha senso solo sull'intero periodo */}
        <span>{cash && !filtered ? "In cassa" : "Netto"}</span>
        <span>{formatEuro(summary.netto)}</span>
      </div>
    </div>
  );
}

function EntryRow({
  entry,
  busy,
  locationSlug,
  onEdit,
  onDelete,
}: {
  entry: CashEntry;
  busy: boolean;
  locationSlug: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-2 pr-3 font-pixel text-xs whitespace-nowrap">{formatDay(entry.date)}</td>
      <td className="py-2 pr-3 whitespace-nowrap">{entryLabel(entry)}</td>
      <td className="py-2 pr-3">
        {entry.source === "payment" ? (
          <>
            <div className="font-semibold">{entry.childName}</div>
            <div className="text-xs text-muted-foreground">
              {entry.enrollmentCode}
              {entry.note ? ` · ${entry.note}` : ""}
            </div>
          </>
        ) : (
          entry.description
        )}
      </td>
      <td className="py-2 pr-3">{PAYMENT_METHOD_LABELS[entry.method]}</td>
      <td
        className={`py-2 pr-3 text-right whitespace-nowrap font-semibold ${entry.amount < 0 ? "text-royal" : ""}`}
      >
        {formatEuro(entry.amount)}
      </td>
      <td className="py-2 text-right whitespace-nowrap">
        {entry.source === "payment" ? (
          <Link
            to="/area-admin/sedi/$slug/registro"
            params={{ slug: locationSlug }}
            className={btnSmall}
            title="Le rate si modificano dalla scheda pagamenti del registro"
          >
            <Table2 className="w-3.5 h-3.5" /> Registro
          </Link>
        ) : (
          <div className="inline-flex gap-1">
            <button
              type="button"
              className={btnSmall}
              disabled={busy}
              onClick={onEdit}
              aria-label="Modifica il movimento"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              className={btnSmall}
              disabled={busy}
              onClick={onDelete}
              aria-label="Elimina il movimento"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

type MovementValues = {
  kind: CashMovementKind;
  amount: number;
  method: PaymentMethod;
  movedOn: string;
  description: string;
};

function MovementForm({
  initial,
  busy,
  onSubmit,
  onCancel,
}: {
  initial?: Extract<CashEntry, { source: "movement" }>;
  busy: boolean;
  onSubmit: (values: MovementValues) => Promise<boolean>;
  onCancel?: () => void;
}) {
  const [kind, setKind] = useState<CashMovementKind>(initial?.kind ?? "spesa");
  // Solo per "altro": entrata o uscita. Spese e consegne sono sempre uscite.
  const [incoming, setIncoming] = useState((initial?.amount ?? -1) > 0);
  const [amount, setAmount] = useState(initial ? amountText(Math.abs(initial.amount)) : "");
  const [method, setMethod] = useState<PaymentMethod>(initial?.method ?? "contanti");
  const [movedOn, setMovedOn] = useState(initial?.date ?? todayIso());
  const [description, setDescription] = useState(initial?.description ?? "");

  async function submit() {
    const value = parseAmount(amount, { allowNegative: false });
    if (value === null) {
      toast.error("Importo non valido: usa un numero maggiore di zero, al massimo due decimali.");
      return;
    }
    if (!isIsoDate(movedOn)) {
      toast.error("Indica la data del movimento.");
      return;
    }
    if (!description.trim()) {
      toast.error("Scrivi una descrizione del movimento.");
      return;
    }
    const ok = await onSubmit({
      kind,
      amount: kind === "altro" && !incoming ? -value : value,
      method,
      movedOn,
      description: description.trim(),
    });
    if (ok && !initial) {
      setAmount("");
      setDescription("");
    }
  }

  return (
    <div className="grid md:grid-cols-5 gap-3 items-end">
      <div>
        <div className="text-xs font-bold text-muted-foreground mb-1">Tipo</div>
        <select
          className={selectCls}
          value={kind}
          disabled={busy}
          onChange={(e) => setKind(e.target.value as CashMovementKind)}
        >
          {CASH_MOVEMENT_KINDS.map((k) => (
            <option key={k} value={k}>
              {CASH_MOVEMENT_KIND_LABELS[k]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <div className="text-xs font-bold text-muted-foreground mb-1">Data</div>
        <Input
          type="date"
          className="rounded-xl"
          value={movedOn}
          disabled={busy}
          onChange={(e) => setMovedOn(e.target.value)}
        />
      </div>
      <div>
        <div className="text-xs font-bold text-muted-foreground mb-1">Metodo</div>
        <select
          className={selectCls}
          value={method}
          disabled={busy}
          onChange={(e) => setMethod(e.target.value as PaymentMethod)}
        >
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>
              {PAYMENT_METHOD_LABELS[m]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <div className="text-xs font-bold text-muted-foreground mb-1">Importo (€)</div>
        <Input
          className="rounded-xl"
          inputMode="decimal"
          placeholder="Es. 25,00"
          value={amount}
          disabled={busy}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div>
        {kind === "altro" ? (
          <select
            className={selectCls}
            value={incoming ? "entrata" : "uscita"}
            disabled={busy}
            onChange={(e) => setIncoming(e.target.value === "entrata")}
          >
            <option value="uscita">Uscita dalla cassa</option>
            <option value="entrata">Entrata in cassa</option>
          </select>
        ) : (
          <div className="h-10 flex items-center text-xs text-muted-foreground">
            Uscita dalla cassa
          </div>
        )}
      </div>
      <div className="md:col-span-5">
        <div className="text-xs font-bold text-muted-foreground mb-1">Descrizione</div>
        <Input
          className="rounded-xl"
          maxLength={300}
          placeholder={
            kind === "consegna" ? "Es. consegnati alla segreteria" : "Es. materiale laboratori"
          }
          value={description}
          disabled={busy}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="md:col-span-5 flex gap-2">
        <button type="button" className={btnSmall} disabled={busy} onClick={submit}>
          {initial ? (
            "Salva movimento"
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" /> Registra movimento
            </>
          )}
        </button>
        {onCancel && (
          <button type="button" className={btnSmall} onClick={onCancel}>
            <X className="w-3.5 h-3.5" /> Annulla
          </button>
        )}
      </div>
    </div>
  );
}
