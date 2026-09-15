import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { ExtraChargeType, PaymentMethod } from "@/lib/supabase/types";
import { formatEuro, type RegistryTotals } from "@/lib/registry/registry";
import {
  EXTRA_CHARGE_TYPES,
  EXTRA_CHARGE_TYPE_LABELS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  amountText,
  formatDay,
  isIsoDate,
  parseAmount,
  paymentLabel,
  todayIso,
  type EnrollmentLedger,
  type RegistryPayment,
} from "@/lib/registry/payments";
import {
  addExtraCharge,
  deleteExtraCharge,
  deletePayment,
  getEnrollmentLedger,
  savePayment,
  type LedgerResult,
} from "@/lib/registry/payments-fns";

const selectCls =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-semibold";
const btnSmall =
  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold border border-border bg-white hover:bg-secondary transition-colors disabled:opacity-50";

// Scheda economica di un bambino nel registro (M11.3): rate e rimborsi, gita e
// altri addebiti fuori quota, con i totali calcolati dal database. Dopo ogni
// scrittura il server restituisce la scheda aggiornata e la griglia riceve i
// nuovi totali della riga.
export function EnrollmentLedgerDialog({
  enrollmentId,
  onClose,
  onTotalsChange,
}: {
  enrollmentId: string | null;
  onClose: () => void;
  onTotalsChange: (enrollmentId: string, totals: RegistryTotals) => void;
}) {
  const [ledger, setLedger] = useState<EnrollmentLedger | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<RegistryPayment | null>(null);

  useEffect(() => {
    if (!enrollmentId) {
      setLedger(null);
      setEditing(null);
      setLoadError(null);
      return;
    }
    let cancelled = false;
    setLedger(null);
    setLoadError(null);
    getEnrollmentLedger({ data: { enrollmentId } }).then((res) => {
      if (cancelled) return;
      if (res.ok) setLedger(res.ledger);
      else setLoadError(res.error);
    });
    return () => {
      cancelled = true;
    };
  }, [enrollmentId]);

  async function apply(op: () => Promise<LedgerResult>, okMsg: string): Promise<boolean> {
    setBusy(true);
    try {
      const res = await op();
      if (!res.ok) {
        toast.error(res.error);
        return false;
      }
      setLedger(res.ledger);
      onTotalsChange(res.ledger.enrollmentId, res.ledger.totals);
      toast.success(okMsg);
      return true;
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={enrollmentId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {ledger ? ledger.childName : "Pagamenti"}
          </DialogTitle>
          <DialogDescription>
            {ledger
              ? `${ledger.enrollmentCode} · rate, rimborsi e gita. Quota e saldo li calcola il sistema.`
              : "Caricamento della scheda…"}
          </DialogDescription>
        </DialogHeader>

        {loadError && <p className="text-sm font-semibold text-flame">{loadError}</p>}

        {ledger && (
          <div className="space-y-6">
            <TotalsStrip totals={ledger.totals} />

            <section>
              <h3 className="font-display text-lg font-bold mb-2">Rate versate</h3>
              {ledger.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nessuna rata registrata.</p>
              ) : (
                <ul className="space-y-2">
                  {ledger.payments.map((p) =>
                    editing?.id === p.id ? (
                      <li key={p.id} className="rounded-xl border border-primary/40 p-3">
                        <PaymentForm
                          initial={p}
                          busy={busy}
                          onCancel={() => setEditing(null)}
                          onSubmit={async (values) => {
                            const ok = await apply(
                              () =>
                                savePayment({
                                  data: { id: p.id, enrollmentId: ledger.enrollmentId, ...values },
                                }),
                              "Rata aggiornata.",
                            );
                            if (ok) setEditing(null);
                            return ok;
                          }}
                        />
                      </li>
                    ) : (
                      <li
                        key={p.id}
                        className="flex items-center gap-3 rounded-xl border border-border px-3 py-2"
                      >
                        <span className="font-pixel text-xs w-20 shrink-0">
                          {formatDay(p.paidOn)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold">
                            {paymentLabel(p.amount)} · {PAYMENT_METHOD_LABELS[p.method]}
                          </div>
                          {p.note && (
                            <div className="text-xs text-muted-foreground truncate">{p.note}</div>
                          )}
                        </div>
                        <span
                          className={`text-sm font-semibold shrink-0 ${p.amount < 0 ? "text-royal" : ""}`}
                        >
                          {formatEuro(p.amount)}
                        </span>
                        <button
                          type="button"
                          className={btnSmall}
                          disabled={busy}
                          onClick={() => setEditing(p)}
                          aria-label="Modifica la rata"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          className={btnSmall}
                          disabled={busy}
                          aria-label="Elimina la rata"
                          onClick={() => {
                            const what = `${paymentLabel(p.amount).toLowerCase()} di ${formatEuro(p.amount)} del ${formatDay(p.paidOn)}`;
                            if (
                              !window.confirm(
                                `Eliminare ${what}? Resta traccia nel registro delle azioni.`,
                              )
                            )
                              return;
                            void apply(
                              () =>
                                deletePayment({
                                  data: { id: p.id, enrollmentId: ledger.enrollmentId },
                                }),
                              "Rata eliminata.",
                            );
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ),
                  )}
                </ul>
              )}
              {!editing && (
                <div className="rounded-xl border border-dashed border-border p-3 mt-3">
                  <div className="text-xs font-bold text-muted-foreground mb-2">Nuova rata</div>
                  <PaymentForm
                    busy={busy}
                    onSubmit={(values) =>
                      apply(
                        () =>
                          savePayment({ data: { enrollmentId: ledger.enrollmentId, ...values } }),
                        values.amount < 0 ? "Rimborso registrato." : "Rata registrata.",
                      )
                    }
                  />
                </div>
              )}
            </section>

            <section>
              <h3 className="font-display text-lg font-bold mb-1">Gita e altri addebiti</h3>
              <p className="text-xs text-muted-foreground mb-2">
                Voci a parte: non entrano nella quota ma si sommano al saldo.
              </p>
              {ledger.extraCharges.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nessun addebito extra.</p>
              ) : (
                <ul className="space-y-2">
                  {ledger.extraCharges.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center gap-3 rounded-xl border border-border px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold">
                          {EXTRA_CHARGE_TYPE_LABELS[c.chargeType]}
                        </div>
                        {c.description && (
                          <div className="text-xs text-muted-foreground truncate">
                            {c.description}
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-semibold shrink-0">{formatEuro(c.amount)}</span>
                      <button
                        type="button"
                        className={btnSmall}
                        disabled={busy}
                        aria-label="Rimuovi l'addebito"
                        onClick={() => {
                          if (
                            !window.confirm(
                              `Rimuovere ${EXTRA_CHARGE_TYPE_LABELS[c.chargeType].toLowerCase()} di ${formatEuro(c.amount)}?`,
                            )
                          )
                            return;
                          void apply(
                            () =>
                              deleteExtraCharge({
                                data: { id: c.id, enrollmentId: ledger.enrollmentId },
                              }),
                            "Addebito rimosso.",
                          );
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <ExtraChargeForm
                busy={busy}
                onSubmit={(values) =>
                  apply(
                    () =>
                      addExtraCharge({ data: { enrollmentId: ledger.enrollmentId, ...values } }),
                    "Addebito aggiunto.",
                  )
                }
              />
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TotalsStrip({ totals }: { totals: RegistryTotals }) {
  const items: { label: string; value: number; hint?: string; tone?: string }[] = [
    {
      label: "Quota",
      value: totals.quota,
      hint: `settimane ${formatEuro(totals.weeksTotal)} + tessera ${formatEuro(totals.tessera)}`,
    },
    { label: "Gita ed extra", value: totals.extraTotal },
    { label: "Versato", value: totals.versato },
    {
      label: "Saldo",
      value: totals.saldo,
      tone: totals.saldo > 0 ? "text-flame" : totals.saldo < 0 ? "text-royal" : "text-grass",
      hint:
        totals.saldo < 0
          ? "versato più del dovuto"
          : totals.saldo === 0
            ? "in regola"
            : "da versare",
    },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {items.map((i) => (
        <div key={i.label} className="rounded-xl border border-border bg-secondary/40 px-3 py-2">
          <div className="font-pixel text-xs text-muted-foreground">{i.label}</div>
          <div className={`font-display text-lg font-bold ${i.tone ?? ""}`}>
            {formatEuro(i.value)}
          </div>
          {i.hint && <div className="text-[11px] text-muted-foreground">{i.hint}</div>}
        </div>
      ))}
    </div>
  );
}

type PaymentValues = { amount: number; method: PaymentMethod; paidOn: string; note: string };

function PaymentForm({
  initial,
  busy,
  onSubmit,
  onCancel,
}: {
  initial?: RegistryPayment;
  busy: boolean;
  onSubmit: (values: PaymentValues) => Promise<boolean>;
  onCancel?: () => void;
}) {
  const [refund, setRefund] = useState((initial?.amount ?? 0) < 0);
  const [amount, setAmount] = useState(initial ? amountText(Math.abs(initial.amount)) : "");
  const [method, setMethod] = useState<PaymentMethod>(initial?.method ?? "bonifico");
  const [paidOn, setPaidOn] = useState(initial?.paidOn ?? todayIso());
  const [note, setNote] = useState(initial?.note ?? "");

  async function submit() {
    // L'importo si scrive sempre positivo: il segno lo decide "rimborso".
    const value = parseAmount(amount, { allowNegative: false });
    if (value === null) {
      toast.error("Importo non valido: usa un numero maggiore di zero, al massimo due decimali.");
      return;
    }
    if (!isIsoDate(paidOn)) {
      toast.error("Indica la data del pagamento.");
      return;
    }
    const ok = await onSubmit({
      amount: refund ? -value : value,
      method,
      paidOn,
      note: note.trim(),
    });
    if (ok && !initial) {
      setAmount("");
      setNote("");
      setRefund(false);
    }
  }

  return (
    <div className="grid sm:grid-cols-4 gap-3 items-end">
      <div>
        <div className="text-xs font-bold text-muted-foreground mb-1">Data</div>
        <Input
          type="date"
          className="rounded-xl"
          value={paidOn}
          disabled={busy}
          onChange={(e) => setPaidOn(e.target.value)}
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
          placeholder="Es. 50,00"
          value={amount}
          disabled={busy}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <label className="inline-flex items-center gap-2 text-sm font-semibold h-10">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-input"
          checked={refund}
          disabled={busy}
          onChange={(e) => setRefund(e.target.checked)}
        />
        È un rimborso
      </label>
      <div className="sm:col-span-4">
        <div className="text-xs font-bold text-muted-foreground mb-1">Nota</div>
        <Input
          className="rounded-xl"
          maxLength={300}
          placeholder={refund ? "Es. restituiti soldi" : "Es. acconto, seconda rata"}
          value={note}
          disabled={busy}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <div className="sm:col-span-4 flex gap-2">
        <button type="button" className={btnSmall} disabled={busy} onClick={submit}>
          {initial ? (
            "Salva rata"
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" /> {refund ? "Registra rimborso" : "Registra rata"}
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

function ExtraChargeForm({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (values: {
    chargeType: ExtraChargeType;
    description: string;
    amount: number;
  }) => Promise<boolean>;
}) {
  const [chargeType, setChargeType] = useState<ExtraChargeType>("gita");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  async function submit() {
    const value = parseAmount(amount, { allowNegative: false });
    if (value === null) {
      toast.error("Importo non valido: usa un numero maggiore di zero, al massimo due decimali.");
      return;
    }
    const ok = await onSubmit({ chargeType, description: description.trim(), amount: value });
    if (ok) {
      setDescription("");
      setAmount("");
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-border p-3 mt-3 grid sm:grid-cols-4 gap-3 items-end">
      <div>
        <div className="text-xs font-bold text-muted-foreground mb-1">Tipo</div>
        <select
          className={selectCls}
          value={chargeType}
          disabled={busy}
          onChange={(e) => setChargeType(e.target.value as ExtraChargeType)}
        >
          {EXTRA_CHARGE_TYPES.map((t) => (
            <option key={t} value={t}>
              {EXTRA_CHARGE_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <div className="text-xs font-bold text-muted-foreground mb-1">Descrizione</div>
        <Input
          className="rounded-xl"
          maxLength={300}
          placeholder="Es. Gita al parco acquatico"
          value={description}
          disabled={busy}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <div className="text-xs font-bold text-muted-foreground mb-1">Importo (€)</div>
        <Input
          className="rounded-xl"
          inputMode="decimal"
          placeholder="Es. 35,00"
          value={amount}
          disabled={busy}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div className="sm:col-span-4">
        <button type="button" className={btnSmall} disabled={busy} onClick={submit}>
          <Plus className="w-3.5 h-3.5" /> Aggiungi addebito
        </button>
      </div>
    </div>
  );
}
