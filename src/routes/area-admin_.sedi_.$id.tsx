import { useState } from "react";
import { createFileRoute, Link, notFound, useNavigate, useRouter } from "@tanstack/react-router";
import {
  useForm,
  useFieldArray,
  Controller,
  type Control,
  type FieldErrors,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { requireRole } from "@/lib/supabase/auth";
import { listLocations, saveLocation } from "@/lib/locations/server-fns";
import { locationToInput, newLocationInput, type Location } from "@/data/locations";
import {
  DAY_ICONS,
  DAY_ICON_LABELS,
  LOCATION_STATUSES,
  LOCATION_TYPES,
  LOCATION_TYPE_LABELS,
  THEMES,
  THEME_LABELS,
  locationInputSchema,
  type LocationInput,
} from "@/lib/locations/validation";
import { removeLocationLogo, signLogoUrl, uploadLocationLogo } from "@/lib/locations/logo";
import { REQUIRED_DOC_TYPE_OPTIONS, docTypeLabel } from "@/lib/enrollments/doc-types";
import { LocationDocumentsAdmin } from "@/components/site/LocationDocumentsAdmin";
import { LocationCustomFieldsAdmin } from "@/components/site/LocationCustomFieldsAdmin";
import { ArrowLeft, Plus, Trash2, Save, Upload, ExternalLink } from "lucide-react";

// Editor sede (admin): crea/modifica, bozza/pubblica, settimane, extra,
// badge, giornata tipo, FAQ e logo del comune. "nuova" = creazione.
export const Route = createFileRoute("/area-admin_/sedi_/$id")({
  beforeLoad: ({ context, location }) => ({
    auth: requireRole(context.auth, "admin", location.href),
  }),
  loader: async ({ params }): Promise<Location | null> => {
    if (params.id === "nuova") return null;
    const loc = (await listLocations()).find((l) => l.id === params.id);
    if (!loc) throw notFound();
    return loc;
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${(loaderData as Location | null | undefined)?.name ?? "Nuova sede"} — Sedi admin`,
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
  component: LocationEditorPage,
});

const inputCls = "rounded-xl";
const selectCls =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-semibold";
const btnSmall =
  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold border border-border bg-white hover:bg-secondary transition-colors";

function LocationEditorPage() {
  const initial = Route.useLoaderData() as Location | null;
  // key: cambiando sede (o dopo la creazione) il form riparte dai dati nuovi.
  return <LocationEditor key={initial?.id ?? "nuova"} initial={initial} />;
}

function LocationEditor({ initial }: { initial: Location | null }) {
  const navigate = useNavigate();
  const router = useRouter();
  const published = initial?.status === "pubblicata";
  const existingWeekCodes = new Set(initial?.weeks.map((w) => w.id) ?? []);
  const existingExtraCodes = new Set(initial?.extraServices.map((e) => e.id) ?? []);

  const form = useForm<LocationInput>({
    resolver: zodResolver(locationInputSchema),
    defaultValues: initial ? locationToInput(initial) : newLocationInput(),
  });
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = form;
  const weeks = useFieldArray({ control, name: "weeks" });
  const extras = useFieldArray({ control, name: "extraServices" });
  const badges = useFieldArray({ control, name: "badges" });
  const dayPlan = useFieldArray({ control, name: "dayPlan" });
  const faq = useFieldArray({ control, name: "faq" });
  const logoPath = watch("logoPath");
  const [logoBusy, setLogoBusy] = useState(false);
  // Anteprima: URL firmato dal loader (bucket privato) o firmato dopo l'upload.
  const [logoPreview, setLogoPreview] = useState<string | null>(initial?.logoUrl ?? null);

  async function onSubmit(values: LocationInput) {
    const res = await saveLocation({ data: values });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(values.status === "pubblicata" ? "Sede salvata e pubblicata." : "Sede salvata.");
    if (!initial) {
      navigate({ to: "/area-admin/sedi/$id", params: { id: res.id } });
    } else {
      await router.invalidate();
    }
  }

  async function onLogoChange(file: File | null) {
    if (!file || !initial) return;
    setLogoBusy(true);
    try {
      const res = await uploadLocationLogo(initial.id, file);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const previous = logoPath;
      setValue("logoPath", res.path, { shouldDirty: true });
      setLogoPreview(await signLogoUrl(res.path));
      if (previous && previous !== res.path) await removeLocationLogo(previous);
      toast.success("Logo caricato: salva la sede per confermarlo.");
    } finally {
      setLogoBusy(false);
    }
  }

  async function onLogoRemove() {
    if (logoPath) await removeLocationLogo(logoPath);
    setValue("logoPath", null, { shouldDirty: true });
    setLogoPreview(null);
    toast.info("Logo rimosso: salva la sede per confermare.");
  }

  const rootError = (key: keyof LocationInput) => {
    const e = errors[key] as { message?: string; root?: { message?: string } } | undefined;
    return e?.message ?? e?.root?.message;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-5xl">
        <Link
          to="/area-admin/sedi"
          className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Elenco sedi
        </Link>
        <div className="flex items-end justify-between flex-wrap gap-4 mt-3 mb-6">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold">
              {initial ? initial.name : "Nuova sede"}
            </h1>
            {initial && (
              <p className="text-sm text-muted-foreground mt-1">
                /{initial.slug} ·{" "}
                <Link
                  to="/centri-estivi/$slug"
                  params={{ slug: initial.slug }}
                  className="inline-flex items-center gap-1 underline"
                >
                  pagina pubblica <ExternalLink className="w-3 h-3" />
                </Link>
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Section title="Dati principali">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Nome" error={errors.name?.message}>
                <Input className={inputCls} {...register("name")} />
              </Field>
              <Field
                label="Slug (URL pubblico)"
                error={errors.slug?.message}
                hint={
                  published
                    ? "Sede pubblicata: lo slug non si può più modificare."
                    : "Solo minuscole, numeri e trattini. Dopo la pubblicazione diventa fisso."
                }
              >
                <Input className={inputCls} {...register("slug")} disabled={published} />
              </Field>
              <Field label="Tipo" error={errors.type?.message}>
                <select className={selectCls} {...register("type")}>
                  {LOCATION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {LOCATION_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Stato"
                error={errors.status?.message}
                hint="In bozza la sede è visibile solo agli admin."
              >
                <select className={selectCls} {...register("status")}>
                  {LOCATION_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s === "bozza" ? "Bozza" : "Pubblicata"}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Comune" error={errors.comune?.message}>
                <Input
                  className={inputCls}
                  placeholder="Galzignano Terme (PD)"
                  {...register("comune")}
                />
              </Field>
              <Field label="Indirizzo" error={errors.address?.message}>
                <Input className={inputCls} {...register("address")} />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Età min" error={errors.ageMin?.message}>
                  <Input className={inputCls} type="number" {...register("ageMin")} />
                </Field>
                <Field label="Età max" error={errors.ageMax?.message}>
                  <Input className={inputCls} type="number" {...register("ageMax")} />
                </Field>
                <Field label="Etichetta età" hint="Vuota = automatica">
                  <Input className={inputCls} placeholder="6-13 anni" {...register("ageLabel")} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tema colore" error={errors.theme?.message}>
                  <select className={selectCls} {...register("theme")}>
                    {THEMES.map((t) => (
                      <option key={t} value={t}>
                        {THEME_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Ordine in elenco" error={errors.sortOrder?.message}>
                  <Input className={inputCls} type="number" {...register("sortOrder")} />
                </Field>
              </div>
              <Field label="Tagline" error={errors.tagline?.message} className="md:col-span-2">
                <Input className={inputCls} {...register("tagline")} />
              </Field>
              <Field
                label="Descrizione"
                error={errors.description?.message}
                className="md:col-span-2"
              >
                <Textarea rows={3} {...register("description")} />
              </Field>
            </div>
          </Section>

          <Section title="Logo del comune">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="w-24 h-24 rounded-xl border border-border bg-secondary grid place-items-center overflow-hidden">
                {logoPath && logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
                ) : logoPath ? (
                  <span className="text-xs text-muted-foreground text-center px-2">
                    Anteprima non disponibile
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Nessun logo</span>
                )}
              </div>
              <div className="space-y-2">
                {initial ? (
                  <>
                    <label className={`${btnSmall} cursor-pointer`}>
                      <Upload className="w-3.5 h-3.5" />
                      {logoBusy ? "Caricamento…" : logoPath ? "Sostituisci logo" : "Carica logo"}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        className="hidden"
                        disabled={logoBusy}
                        onChange={(e) => onLogoChange(e.target.files?.[0] ?? null)}
                      />
                    </label>
                    {logoPath && (
                      <button type="button" onClick={onLogoRemove} className={`${btnSmall} ml-2`}>
                        <Trash2 className="w-3.5 h-3.5" /> Rimuovi
                      </button>
                    )}
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, SVG o WebP, max 2 MB. Mostrato nella pagina pubblica della sede;
                      nell'intestazione dei PDF solo se PNG o JPG.
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Salva la sede una prima volta per poter caricare il logo.
                  </p>
                )}
              </div>
            </div>
          </Section>

          <Section
            title="Documenti della sede"
            subtitle="Regolamento, moduli vuoti, informative e template PDF per l'overlay. Solo i documenti pubblici compaiono nella pagina della sede e nel wizard; i template restano interni."
          >
            {initial ? (
              <LocationDocumentsAdmin location={initial} />
            ) : (
              <p className="text-xs text-muted-foreground">
                Salva la sede una prima volta per poter caricare documenti.
              </p>
            )}
          </Section>

          <Section
            title="Campi personalizzati"
            subtitle='Domande in più che il wizard fa ai genitori nello step "Informazioni richieste dalla sede". Il codice si genera alla creazione e non cambia; un campo con risposte si disattiva, non si elimina.'
          >
            {initial ? (
              <LocationCustomFieldsAdmin location={initial} />
            ) : (
              <p className="text-xs text-muted-foreground">
                Salva la sede una prima volta per poter aggiungere campi.
              </p>
            )}
          </Section>

          <Section title="Contatti">
            <div className="grid md:grid-cols-3 gap-4">
              <Field label="Telefono" error={errors.contacts?.phone?.message}>
                <Input className={inputCls} {...register("contacts.phone")} />
              </Field>
              <Field label="Email" error={errors.contacts?.email?.message}>
                <Input className={inputCls} type="email" {...register("contacts.email")} />
              </Field>
              <Field label="Referente" error={errors.contacts?.manager?.message}>
                <Input className={inputCls} {...register("contacts.manager")} />
              </Field>
            </div>
          </Section>

          <Section
            title="Prezzi (EUR)"
            subtitle="Quote settimanali per residenti/non residenti, sconto fratelli per settimana, tessera ACSI e mora."
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {(
                [
                  ["residentFullDay", "Residenti · giornata intera"],
                  ["residentHalfDay", "Residenti · mezza giornata"],
                  ["nonResidentFullDay", "Non residenti · giornata intera"],
                  ["nonResidentHalfDay", "Non residenti · mezza giornata"],
                  ["siblingDiscountFullDay", "Sconto fratelli · intera (a settimana)"],
                  ["siblingDiscountHalfDay", "Sconto fratelli · mezza (a settimana)"],
                  ["membershipBase", "Tessera ACSI base"],
                  ["membershipSuperIntegrativa", "Supplemento super-integrativa"],
                  ["lateFee", "Mora iscrizione fuori termine"],
                ] as const
              ).map(([key, label]) => (
                <Field key={key} label={label} error={errors.pricing?.[key]?.message}>
                  <Input
                    className={inputCls}
                    type="number"
                    step="0.01"
                    {...register(`pricing.${key}`)}
                  />
                </Field>
              ))}
            </div>
          </Section>

          <Section
            title="Settimane"
            subtitle="Il codice è usato dalle iscrizioni: per le settimane già salvate non si cambia. Rimuovere una settimana con iscrizioni la rende non più riconoscibile nel gestionale."
          >
            <ErrorLine msg={rootError("weeks")} />
            <div className="space-y-3">
              {weeks.fields.map((f, i) => {
                const locked = existingWeekCodes.has(f.code);
                return (
                  <div
                    key={f.id}
                    className="grid grid-cols-2 md:grid-cols-7 gap-2 items-end rounded-xl border border-border p-3"
                  >
                    <Field label="Codice" error={errors.weeks?.[i]?.code?.message}>
                      <Input
                        className={inputCls}
                        {...register(`weeks.${i}.code`)}
                        readOnly={locked}
                      />
                    </Field>
                    <Field label="N." error={errors.weeks?.[i]?.number?.message}>
                      <Input
                        className={inputCls}
                        type="number"
                        {...register(`weeks.${i}.number`)}
                      />
                    </Field>
                    <Field
                      label="Etichetta"
                      error={errors.weeks?.[i]?.label?.message}
                      className="md:col-span-2"
                    >
                      <Input
                        className={inputCls}
                        placeholder="8 - 12 giugno"
                        {...register(`weeks.${i}.label`)}
                      />
                    </Field>
                    <Field label="Inizio" error={errors.weeks?.[i]?.startDate?.message}>
                      <Input
                        className={inputCls}
                        type="date"
                        {...register(`weeks.${i}.startDate`)}
                      />
                    </Field>
                    <Field label="Fine" error={errors.weeks?.[i]?.endDate?.message}>
                      <Input className={inputCls} type="date" {...register(`weeks.${i}.endDate`)} />
                    </Field>
                    <div className="flex items-end gap-2">
                      <Field label="Posti" error={errors.weeks?.[i]?.spots?.message}>
                        <Input
                          className={inputCls}
                          type="number"
                          {...register(`weeks.${i}.spots`)}
                        />
                      </Field>
                      <RemoveButton onClick={() => weeks.remove(i)} />
                    </div>
                  </div>
                );
              })}
            </div>
            <AddButton
              label="Aggiungi settimana"
              onClick={() => {
                const n = weeks.fields.length + 1;
                weeks.append({
                  code: `w${n}`,
                  number: n,
                  label: "",
                  startDate: "",
                  endDate: "",
                  spots: 12,
                });
              }}
            />
          </Section>

          <Section title="Orari, attività e servizi" subtitle="Una voce per riga.">
            <div className="grid md:grid-cols-2 gap-4">
              <LinesField
                control={control}
                name="timeSlots"
                label="Fasce orarie"
                hint='Es. "07:45 - 16:00 (giornata intera)". La mezza giornata si riconosce dalla parola "mezza".'
              />
              <LinesField control={control} name="activities" label="Attività principali" />
              <LinesField control={control} name="includedServices" label="Servizi inclusi" />
              <DocTypesField control={control} />
            </div>
          </Section>

          <Section
            title="Servizi extra (a settimana)"
            subtitle="Il codice è usato dalle iscrizioni: per gli extra già salvati non si cambia."
          >
            <ErrorLine msg={rootError("extraServices")} />
            <div className="space-y-3">
              {extras.fields.map((f, i) => (
                <div
                  key={f.id}
                  className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end rounded-xl border border-border p-3"
                >
                  <Field label="Codice" error={errors.extraServices?.[i]?.id?.message}>
                    <Input
                      className={inputCls}
                      {...register(`extraServices.${i}.id`)}
                      readOnly={existingExtraCodes.has(f.id)}
                    />
                  </Field>
                  <Field
                    label="Etichetta"
                    error={errors.extraServices?.[i]?.label?.message}
                    className="md:col-span-2"
                  >
                    <Input className={inputCls} {...register(`extraServices.${i}.label`)} />
                  </Field>
                  <div className="flex items-end gap-2 md:col-span-2">
                    <Field label="Prezzo EUR" error={errors.extraServices?.[i]?.price?.message}>
                      <Input
                        className={inputCls}
                        type="number"
                        step="0.01"
                        {...register(`extraServices.${i}.price`)}
                      />
                    </Field>
                    <RemoveButton onClick={() => extras.remove(i)} />
                  </div>
                </div>
              ))}
            </div>
            <AddButton
              label="Aggiungi extra"
              onClick={() => extras.append({ id: "", label: "", price: 0 })}
            />
          </Section>

          <Section title="Badge (max 3 nella card)">
            <div className="space-y-3">
              {badges.fields.map((f, i) => (
                <div key={f.id} className="grid grid-cols-[1fr_auto_auto] gap-2 items-end">
                  <Field label="Etichetta" error={errors.badges?.[i]?.label?.message}>
                    <Input className={inputCls} {...register(`badges.${i}.label`)} />
                  </Field>
                  <Field label="Colore">
                    <select className={selectCls} {...register(`badges.${i}.color`)}>
                      {THEMES.map((t) => (
                        <option key={t} value={t}>
                          {THEME_LABELS[t]}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <RemoveButton onClick={() => badges.remove(i)} />
                </div>
              ))}
            </div>
            <AddButton
              label="Aggiungi badge"
              onClick={() => badges.append({ label: "", color: "flame" })}
            />
          </Section>

          <Section title="Giornata tipo">
            <div className="space-y-3">
              {dayPlan.fields.map((f, i) => (
                <div
                  key={f.id}
                  className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end rounded-xl border border-border p-3"
                >
                  <Field label="Orario">
                    <Input
                      className={inputCls}
                      placeholder="09:00 - 12:30"
                      {...register(`dayPlan.${i}.time`)}
                    />
                  </Field>
                  <Field
                    label="Titolo"
                    error={errors.dayPlan?.[i]?.title?.message}
                    className="md:col-span-2"
                  >
                    <Input className={inputCls} {...register(`dayPlan.${i}.title`)} />
                  </Field>
                  <Field label="Icona">
                    <select className={selectCls} {...register(`dayPlan.${i}.icon`)}>
                      {DAY_ICONS.map((ic) => (
                        <option key={ic} value={ic}>
                          {DAY_ICON_LABELS[ic]}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Colore">
                    <select className={selectCls} {...register(`dayPlan.${i}.color`)}>
                      {THEMES.map((t) => (
                        <option key={t} value={t}>
                          {THEME_LABELS[t]}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <div className="flex items-end justify-end">
                    <RemoveButton onClick={() => dayPlan.remove(i)} />
                  </div>
                  <Field label="Descrizione" className="col-span-2 md:col-span-6">
                    <Input className={inputCls} {...register(`dayPlan.${i}.description`)} />
                  </Field>
                </div>
              ))}
            </div>
            <AddButton
              label="Aggiungi blocco"
              onClick={() =>
                dayPlan.append({ time: "", title: "", description: "", icon: "sun", color: "sun" })
              }
            />
          </Section>

          <Section title="Domande frequenti">
            <div className="space-y-3">
              {faq.fields.map((f, i) => (
                <div key={f.id} className="rounded-xl border border-border p-3 space-y-2">
                  <div className="flex items-end gap-2">
                    <Field label="Domanda" error={errors.faq?.[i]?.q?.message} className="flex-1">
                      <Input className={inputCls} {...register(`faq.${i}.q`)} />
                    </Field>
                    <RemoveButton onClick={() => faq.remove(i)} />
                  </div>
                  <Field label="Risposta" error={errors.faq?.[i]?.a?.message}>
                    <Textarea rows={2} {...register(`faq.${i}.a`)} />
                  </Field>
                </div>
              ))}
            </div>
            <AddButton label="Aggiungi domanda" onClick={() => faq.append({ q: "", a: "" })} />
          </Section>

          <Section title="Note interne (solo admin)">
            <Textarea
              rows={2}
              placeholder="Es. prezzi da confermare con l'associazione."
              {...register("adminNotes")}
            />
          </Section>

          <div className="flex items-center justify-between gap-3 flex-wrap sticky bottom-4">
            <ErrorLine
              msg={Object.keys(errors).length > 0 ? "Controlla i campi evidenziati." : undefined}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="ml-auto inline-flex items-center gap-2 rounded-xl px-6 py-3 font-display font-bold bg-gradient-royal text-primary-foreground shadow-sticker hover:scale-[1.02] transition-transform disabled:opacity-60"
            >
              <Save className="w-4 h-4" /> {isSubmitting ? "Salvataggio…" : "Salva sede"}
            </button>
          </div>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}

/* ---------- componenti di supporto ---------- */

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-white shadow-pop p-5">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      {subtitle && <p className="text-xs text-muted-foreground mt-1 mb-3">{subtitle}</p>}
      <div className={subtitle ? "" : "mt-3"}>{children}</div>
    </section>
  );
}

function Field({
  label,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="text-xs font-bold text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
      {hint && !error && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
      <ErrorLine msg={error} />
    </div>
  );
}

function ErrorLine({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs font-semibold text-flame mt-1">{msg}</p>;
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Rimuovi"
      className="h-10 w-10 shrink-0 rounded-xl border border-flame/40 text-flame hover:bg-flame/10 grid place-items-center"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`${btnSmall} mt-3`}>
      <Plus className="w-3.5 h-3.5" /> {label}
    </button>
  );
}

type LinesName = "timeSlots" | "activities" | "includedServices";

// Elenco "una voce per riga": nel form resta un array di stringhe.
function LinesField({
  control,
  name,
  label,
  hint,
}: {
  control: Control<LocationInput>;
  name: LinesName;
  label: string;
  hint?: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field label={label} hint={hint} error={fieldState.error?.message}>
          <Textarea
            rows={5}
            value={(field.value ?? []).join("\n")}
            onChange={(e) => field.onChange(e.target.value.split("\n"))}
            onBlur={() => {
              field.onChange((field.value ?? []).map((s) => s.trim()).filter(Boolean));
              field.onBlur();
            }}
          />
        </Field>
      )}
    />
  );
}

// Evita l'errore "unused" per FieldErrors quando non serve altrove.
export type LocationFormErrors = FieldErrors<LocationInput>;

// Documenti richiesti: codici stabili dal catalogo condiviso (doc-types.ts),
// così wizard e area genitori fanno il matching per codice. Eventuali codici
// personalizzati già salvati restano visibili e rimovibili.
function DocTypesField({ control }: { control: Control<LocationInput> }) {
  return (
    <Controller
      control={control}
      name="requiredDocuments"
      render={({ field, fieldState }) => {
        const selected = field.value ?? [];
        const custom = selected.filter((c) => !REQUIRED_DOC_TYPE_OPTIONS.some((o) => o.code === c));
        const toggle = (code: string, on: boolean) =>
          field.onChange(on ? [...selected, code] : selected.filter((c) => c !== code));
        return (
          <Field
            label="Documenti richiesti"
            hint="Compaiono nella pagina pubblica, nello step Documenti del wizard e nella barra documenti dell'area genitori."
            error={fieldState.error?.message}
          >
            <div className="space-y-2 rounded-xl border border-input p-3">
              {REQUIRED_DOC_TYPE_OPTIONS.map((o) => (
                <label key={o.code} className="flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-input"
                    checked={selected.includes(o.code)}
                    onChange={(e) => toggle(o.code, e.target.checked)}
                  />
                  {o.label}
                </label>
              ))}
              {custom.map((code) => (
                <label key={code} className="flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-input"
                    checked
                    onChange={() => toggle(code, false)}
                  />
                  {docTypeLabel(code)}
                  <span className="text-xs text-muted-foreground">(personalizzato)</span>
                </label>
              ))}
            </div>
          </Field>
        );
      }}
    />
  );
}
