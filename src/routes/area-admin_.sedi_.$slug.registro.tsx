import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { toast } from "sonner";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { requireRole } from "@/lib/supabase/auth";
import { getRegistry, setWeekCode } from "@/lib/registry/registry-fns";
import { EnrollmentLedgerDialog } from "@/components/site/EnrollmentLedgerDialog";
import {
  BAND_LABELS,
  CATEGORY_LABELS,
  codeByCode,
  formatEuro,
  grandTotals,
  missingWeekCodes,
  orphanWeekCodes,
  summarizeRegistry,
  type RegistryData,
  type RegistryRow,
} from "@/lib/registry/registry";
import { ArrowLeft, CalendarRange, Info, Pencil, Users, Wallet } from "lucide-react";

// Registro sede (M11.2): la matrice bambini × settimane del gestionale del
// cliente. La cella contiene il codice di frequenza; quota, gita, versato e
// saldo arrivano calcolati dal database (location_registry_totals), mai dal
// browser. Ogni modifica di cella passa da una server function che scrive
// anche in audit_log.
export const Route = createFileRoute("/area-admin_/sedi_/$slug/registro")({
  beforeLoad: ({ context, location }) => ({
    auth: requireRole(context.auth, "admin", location.href),
  }),
  loader: async ({ params }): Promise<RegistryData> => {
    const data = await getRegistry({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `Registro ${(loaderData as RegistryData | undefined)?.locationName ?? "sede"} — Area Admin`,
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
  component: RegistroPage,
});

function RegistroPage() {
  const data: RegistryData = Route.useLoaderData();
  const [rows, setRows] = useState<RegistryRow[]>(data.rows);
  const [saving, setSaving] = useState<string | null>(null);
  // Iscrizione di cui è aperta la scheda pagamenti (rate, rimborsi, gita).
  const [ledgerId, setLedgerId] = useState<string | null>(null);

  // Il loader rigira i dati dal database (navigazione, invalidate): la copia
  // locale serve solo per riflettere subito la cella appena salvata.
  useEffect(() => {
    setRows(data.rows);
  }, [data.rows]);

  const activeCodes = useMemo(() => data.codes.filter((c) => c.active), [data.codes]);
  const byCode = useMemo(() => codeByCode(data.codes), [data.codes]);
  const summary = useMemo(
    () => summarizeRegistry(data.weeks, data.codes, rows),
    [data.weeks, data.codes, rows],
  );
  const totals = useMemo(() => grandTotals(rows), [rows]);

  const hasWeeks = data.weeks.length > 0;
  const hasCodes = activeCodes.length > 0;

  async function changeCell(row: RegistryRow, weekCode: string, frequencyCode: string) {
    const key = `${row.enrollmentId}:${weekCode}`;
    setSaving(key);
    const previous = row.cells[weekCode] ?? "";
    // aggiornamento ottimistico della sola cella
    setRows((current) =>
      current.map((r) =>
        r.enrollmentId === row.enrollmentId
          ? { ...r, cells: { ...r.cells, [weekCode]: frequencyCode } }
          : r,
      ),
    );
    const res = await setWeekCode({
      data: { enrollmentId: row.enrollmentId, weekCode, frequencyCode },
    });
    setSaving(null);
    if (!res.ok) {
      // ripristino il valore precedente: la verità è quella del database
      setRows((current) =>
        current.map((r) =>
          r.enrollmentId === row.enrollmentId
            ? { ...r, cells: { ...r.cells, [weekCode]: previous } }
            : r,
        ),
      );
      toast.error(res.error);
      return;
    }
    setRows((current) =>
      current.map((r) => (r.enrollmentId === row.enrollmentId ? { ...r, totals: res.totals } : r)),
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1 container mx-auto px-4 py-10">
        <Link
          to="/area-admin/sedi"
          className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Elenco sedi
        </Link>
        <div className="flex items-end justify-between flex-wrap gap-4 mt-3 mb-6">
          <div>
            <span className="inline-flex items-center bg-primary/10 text-primary border border-primary/20 rounded-xl px-3 py-1 font-pixel mb-3">
              Registro sede
            </span>
            <h1 className="font-display text-4xl font-bold">{data.locationName}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {rows.length} {rows.length === 1 ? "iscrizione" : "iscrizioni"} · {data.weeks.length}{" "}
              {data.weeks.length === 1 ? "settimana" : "settimane"} configurate
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link
              to="/area-admin/sedi/$slug/cassa"
              params={{ slug: data.locationSlug }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold hover:bg-secondary"
            >
              <Wallet className="w-4 h-4" /> Cassa della sede
            </Link>
            <Link
              to="/area-admin/sedi/$id"
              params={{ id: data.locationId }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold hover:bg-secondary"
            >
              <Pencil className="w-4 h-4" /> Scheda sede
            </Link>
          </div>
        </div>

        {/* Spiegazione dei codici + legenda con i prezzi reali della sede */}
        <section className="rounded-2xl border border-border bg-secondary/40 p-5 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold mb-1">Come si compila il registro</p>
              <p className="text-muted-foreground">
                In ogni casella si mette il codice di frequenza del bambino per quella settimana:
                dice se fa mezza giornata o giornata intera, se è della primaria o dell'asilo e se
                ha la convenzione col comune. Il prezzo lo porta il codice, e la quota si calcola da
                sola sommando le settimane più la tessera. La gita resta una voce a parte e non
                entra nella quota. Codici e prezzi si configurano nella{" "}
                <Link
                  to="/area-admin/sedi/$id"
                  params={{ id: data.locationId }}
                  hash="codici-frequenza"
                  className="font-semibold underline"
                >
                  scheda sede
                </Link>
                .
              </p>
              {hasCodes ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {activeCodes.map((c) => (
                    <span
                      key={c.id}
                      title={`${BAND_LABELS[c.band]} · ${CATEGORY_LABELS[c.category]}${c.convenzione ? " · convenzione" : ""}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1 text-xs"
                    >
                      <strong className="font-pixel">{c.code}</strong>
                      <span className="text-muted-foreground">{c.label}</span>
                      <span className="font-semibold">{formatEuro(c.price)}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 font-semibold text-flame">
                  Questa sede non ha ancora codici di frequenza attivi: le caselle restano vuote
                  finché non ne esiste almeno uno.{" "}
                  <Link
                    to="/area-admin/sedi/$id"
                    params={{ id: data.locationId }}
                    hash="codici-frequenza"
                    className="underline"
                  >
                    Configurali nella scheda sede.
                  </Link>
                </p>
              )}
            </div>
          </div>
        </section>

        {!hasWeeks ? (
          <section className="rounded-2xl border border-border bg-white shadow-pop p-8 text-center">
            <CalendarRange className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
            <h2 className="font-display text-2xl font-bold mb-2">Nessuna settimana configurata</h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Il registro è una matrice bambini × settimane: senza settimane non c'è griglia da
              compilare. Aggiungile nella scheda della sede, poi torna qui.
              {rows.length > 0 && (
                <>
                  {" "}
                  Le {rows.length} iscrizioni già presenti non vanno perse: compariranno appena le
                  settimane esistono.
                </>
              )}
            </p>
            <Link
              to="/area-admin/sedi/$id"
              params={{ id: data.locationId }}
              className="inline-flex items-center gap-2 mt-5 bg-gradient-flame text-flame-foreground rounded-xl px-5 py-3 font-display font-bold shadow-sticker hover:scale-[1.02] transition-transform"
            >
              <Pencil className="w-4 h-4" /> Configura le settimane
            </Link>
          </section>
        ) : (
          <>
            <section className="rounded-2xl border border-border bg-white shadow-pop p-5 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left font-pixel text-muted-foreground border-b border-border">
                    <th className="py-2 pr-3 sticky left-0 bg-white">Bambino/a</th>
                    {data.weeks.map((w) => (
                      <th key={w.code} className="py-2 px-2 text-center whitespace-nowrap">
                        <div>S{w.number}</div>
                        <div className="font-normal text-[11px] normal-case">{w.label}</div>
                      </th>
                    ))}
                    <th className="py-2 px-2 text-right whitespace-nowrap">Quota</th>
                    <th className="py-2 px-2 text-right whitespace-nowrap">Gita</th>
                    <th className="py-2 px-2 text-right whitespace-nowrap">Versato</th>
                    <th className="py-2 px-2 text-right whitespace-nowrap">Saldo</th>
                    <th className="py-2 pl-2">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const missing = missingWeekCodes(row, data.weeks);
                    const orphans = orphanWeekCodes(row, data.weeks);
                    return (
                      <tr key={row.enrollmentId} className="border-b border-border last:border-0">
                        <td className="py-2 pr-3 sticky left-0 bg-white">
                          <div className="font-semibold whitespace-nowrap">{row.childName}</div>
                          <div className="font-pixel text-xs text-muted-foreground">
                            {row.enrollmentCode} · {row.status}
                            {row.residente ? " · convenzione" : ""}
                          </div>
                          {orphans.length > 0 && (
                            <div className="text-xs text-flame mt-0.5">
                              settimane non più in calendario: {orphans.join(", ")}
                            </div>
                          )}
                        </td>
                        {data.weeks.map((w) => {
                          const value = row.cells[w.code] ?? "";
                          const iscritto = row.weekIds.includes(w.code);
                          const key = `${row.enrollmentId}:${w.code}`;
                          return (
                            <td key={w.code} className="py-2 px-1 text-center">
                              <select
                                value={value}
                                disabled={!hasCodes || saving === key}
                                onChange={(e) => changeCell(row, w.code, e.target.value)}
                                aria-label={`${row.childName}, settimana ${w.number}`}
                                title={
                                  value
                                    ? `${byCode.get(value)?.label ?? value} — ${formatEuro(byCode.get(value)?.price ?? 0)}`
                                    : iscritto
                                      ? "Iscritto a questa settimana: codice da assegnare"
                                      : "Non iscritto a questa settimana"
                                }
                                className={`w-[4.5rem] rounded-lg border px-1.5 py-1 text-center font-pixel text-xs disabled:opacity-60 ${
                                  value
                                    ? "border-border bg-white"
                                    : iscritto
                                      ? "border-flame/50 bg-flame/10"
                                      : "border-dashed border-border bg-secondary/40"
                                }`}
                              >
                                <option value="">—</option>
                                {activeCodes.map((c) => (
                                  <option key={c.id} value={c.code}>
                                    {c.code}
                                  </option>
                                ))}
                                {/* codice disattivato ma già assegnato: resta visibile */}
                                {value && !activeCodes.some((c) => c.code === value) && (
                                  <option value={value}>{value}</option>
                                )}
                              </select>
                            </td>
                          );
                        })}
                        <td className="py-2 px-2 text-right whitespace-nowrap font-semibold">
                          {formatEuro(row.totals.quota)}
                        </td>
                        <td className="py-2 px-2 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setLedgerId(row.enrollmentId)}
                            title="Gita e altri addebiti"
                            className="rounded-md px-1.5 py-0.5 underline decoration-dotted underline-offset-4 hover:bg-secondary"
                          >
                            {row.totals.gita ? formatEuro(row.totals.gita) : "—"}
                          </button>
                        </td>
                        <td className="py-2 px-2 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setLedgerId(row.enrollmentId)}
                            title="Rate e rimborsi"
                            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 underline decoration-dotted underline-offset-4 hover:bg-secondary"
                          >
                            <Wallet className="w-3.5 h-3.5 opacity-60" />
                            {formatEuro(row.totals.versato)}
                          </button>
                        </td>
                        <td
                          className={`py-2 px-2 text-right whitespace-nowrap font-semibold ${
                            row.totals.saldo > 0
                              ? "text-flame"
                              : row.totals.saldo < 0
                                ? "text-royal"
                                : "text-grass"
                          }`}
                        >
                          {formatEuro(row.totals.saldo)}
                        </td>
                        <td className="py-2 pl-2 text-xs text-muted-foreground max-w-[16rem]">
                          {missing.length > 0 && (
                            <div className="text-flame font-semibold">
                              {missing.length === 1
                                ? "1 settimana da assegnare"
                                : `${missing.length} settimane da assegnare`}
                            </div>
                          )}
                          {row.adminNotes && <div className="line-clamp-2">{row.adminNotes}</div>}
                        </td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={data.weeks.length + 6}
                        className="py-10 text-center text-muted-foreground"
                      >
                        <Users className="w-7 h-7 mx-auto mb-2 opacity-60" />
                        Nessuna iscrizione per questa sede: la griglia si popola da sola quando
                        arrivano.
                      </td>
                    </tr>
                  )}
                </tbody>
                {rows.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-border font-semibold">
                      <td className="py-2 pr-3 sticky left-0 bg-white">Totali</td>
                      {data.weeks.map((w) => (
                        <td key={w.code} className="py-2 px-1 text-center font-pixel text-xs">
                          {summary.childrenPerWeek[w.code] ?? 0}
                        </td>
                      ))}
                      <td className="py-2 px-2 text-right whitespace-nowrap">
                        {formatEuro(totals.quota)}
                      </td>
                      <td className="py-2 px-2 text-right whitespace-nowrap">
                        {formatEuro(totals.gita)}
                      </td>
                      <td className="py-2 px-2 text-right whitespace-nowrap">
                        {formatEuro(totals.versato)}
                      </td>
                      <td className="py-2 px-2 text-right whitespace-nowrap">
                        {formatEuro(totals.saldo)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </section>

            {/* Riepilogo per settimana: le righe in fondo al foglio del cliente */}
            <section className="rounded-2xl border border-border bg-white shadow-pop p-5 mt-6 overflow-x-auto">
              <h2 className="font-display text-xl font-bold mb-1">Riepilogo per settimana</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Quanti bambini per tipo di frequenza, settimana per settimana. La riga dei pasti
                conta le giornate intere: è il numero da ordinare.
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left font-pixel text-muted-foreground border-b border-border">
                    <th className="py-2 pr-3">Categoria</th>
                    {data.weeks.map((w) => (
                      <th key={w.code} className="py-2 px-2 text-center whitespace-nowrap">
                        S{w.number}
                      </th>
                    ))}
                    <th className="py-2 pl-2 text-right">Totale</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.buckets.map((b) => (
                    <tr
                      key={`${b.category}-${b.band}`}
                      className="border-b border-border last:border-0"
                    >
                      <td className="py-2 pr-3">{b.label}</td>
                      {data.weeks.map((w) => (
                        <td key={w.code} className="py-2 px-2 text-center">
                          {b.perWeek[w.code] || "—"}
                        </td>
                      ))}
                      <td className="py-2 pl-2 text-right font-semibold">{b.total || "—"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border font-semibold bg-grass/10">
                    <td className="py-2 pr-3">Totale intera (pasti)</td>
                    {data.weeks.map((w) => (
                      <td key={w.code} className="py-2 px-2 text-center">
                        {summary.mealsPerWeek[w.code] ?? 0}
                      </td>
                    ))}
                    <td className="py-2 pl-2 text-right">{summary.mealsTotal}</td>
                  </tr>
                  <tr className="font-semibold">
                    <td className="py-2 pr-3">Bambini iscritti</td>
                    {data.weeks.map((w) => (
                      <td key={w.code} className="py-2 px-2 text-center">
                        {summary.childrenPerWeek[w.code] ?? 0}
                      </td>
                    ))}
                    <td className="py-2 pl-2 text-right">{summary.childrenTotal}</td>
                  </tr>
                </tfoot>
              </table>
            </section>
          </>
        )}

        <EnrollmentLedgerDialog
          enrollmentId={ledgerId}
          onClose={() => setLedgerId(null)}
          onTotalsChange={(enrollmentId, totals) =>
            setRows((current) =>
              current.map((r) => (r.enrollmentId === enrollmentId ? { ...r, totals } : r)),
            )
          }
        />
      </main>
      <SiteFooter />
    </div>
  );
}
