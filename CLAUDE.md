# Sportivissimo Hub — Contesto per Claude Code

Piattaforma per centri estivi, doposcuola, progetti scolastici e corsi dell'Associazione Sportivissimo A.S.D. Utenti: genitori (iscrivono i figli), staff (presenze), admin (gestione completa).

## Stack e architettura (stato reale, verificato)

- **Frontend:** TanStack Start (SSR) + TanStack Router file-based, React 19, Vite 7, Tailwind 4, shadcn/ui, lucide-react, react-hook-form + zod, sonner.
- **Backend:** Supabase via **Lovable Cloud** — Auth (sessione nei cookie per SSR), Postgres con RLS su ogni tabella, Storage privato (bucket `documents`), migrazioni in `supabase/migrations/`.
- **Deploy:** Cloudflare Workers gestito da Lovable. Push su `main` → Lovable aggiorna la preview → publish manuale per andare live.
- **Email:** Lovable Emails (sistema gestito nativo: auth email + app email dal dominio dell'associazione). NON usiamo Resend.
- **PDF:** `pdf-lib` — generazione on-demand server-side, due modalità: PDF puliti generati da zero (`src/lib/pdf-templates/layout.ts`) e overlay su moduli cartacei originali (template in `assets/pdf-templates/` incorporati nel bundle server via `?inline`, mappe coordinate in `src/lib/pdf-templates/overlay/`, calibrazione con `node scripts/pdf-calibrate.ts`). Metadati dei moduli in `catalog.ts` (client-safe), builder in `index.ts`.
- **CF italiano:** validazione nativa completa (struttura, omocodia, check digit) in `src/lib/enrollments/fiscal-code.ts`; calcolo con `codice-fiscale-js` (import dinamico).

## Flusso di lavoro (NON derogare)

1. Claude Code lavora in locale, commit atomici per milestone/task, **mai push autonomo**: a fine lavoro riepiloga e si ferma; il push lo fa Romesh.
2. Ogni push su `main` rideploya la preview Lovable. Il live si aggiorna solo col publish manuale.
3. **Le migrazioni NON si applicano da sole col push**: vanno applicate via prompt in Lovable (contenuto SQL nel blocco di revisione, una alla volta, senza creare migrazioni autonome). Se un task crea una migrazione, segnalarlo esplicitamente nel riepilogo finale.
4. Le edge functions e i template email sono gestiti da Lovable Emails: non crearne di nuovi senza istruzione esplicita.
5. Prima di iniziare qualsiasi sessione: `git pull` (Lovable può aver committato), poi leggere `PIANO_LAVORI.md` e confrontare con `git log` per capire cosa è già fatto. **Mai rifare lavori già completati.**
6. A fine task: `npx tsc --noEmit`, `npm run build`, `npm run lint` (6 warning react-refresh nei componenti shadcn/ui sono noti e innocui), riepilogo di file modificati, controlli, regressioni escluse, task residui.

## Regole di sicurezza (non negoziabili)

- Dati di minori (CF, allergie, note mediche): RLS su ogni tabella nuova, bucket privati, URL firmati, validazione client E server.
- Ruoli in `user_roles` (genitore/staff/admin) con `has_role()` security definer. Mai fidarsi del client.
- Mai committare chiavi o secrets. Env: nomi variabili allineati a quelli forniti da Lovable Cloud (verificare `.env` nel repo), con fallback e errore esplicito a runtime se mancanti.
- Il client Supabase browser è un singleton. Nessuna service key nel codice dell'app: l'autorizzazione delle server function è delegata alle RLS con la sessione utente.
- Genitore non può mai modificare status, payment_status, admin_notes; audit_log append-only per le azioni admin.

## Vincoli operativi noti

- L'anteprima embedded di Lovable blocca i cookie di auth (iframe): i test auth si fanno sul sito pubblicato o in scheda dedicata.
- Le sedi vivono nel DB (`locations`, `location_weeks`, `location_extras`, M10.1): `src/data/locations.ts` contiene solo tipi e mapping, le query stanno in `src/lib/locations/`. L'admin le gestisce da `/area-admin/sedi`. Solo Galzignano ha prezzi/settimane reali 2026; le altre 8 sedi hanno valori placeholder segnalati in `admin_notes`. La disponibilità non è memorizzata: viene dalla funzione `location_week_occupancy()` (iscrizioni confermate per settimana).
- Le bozze del wizard vivono in localStorage per sede; i File selezionati stanno in IndexedDB (`src/lib/enrollments/draft-files.ts`) e sopravvivono a reload e login. Tipi documento con codici stabili in `src/lib/enrollments/doc-types.ts` (matching sempre per codice).
- Campi personalizzati per sede (M10.3) in `location_custom_fields`, risposte in `enrollments.custom_answers`; schema zod dinamica e limiti espliciti in `src/lib/enrollments/custom-fields.ts` (nessun effetto su prezzi/posti/logica, risposte raccolte mai alterate, code immutabile, campi si disattivano e non si eliminano).
- Documenti della sede (M10.2) in `location_documents` + bucket privato `location-documents`: download solo via `getLocationDocumentUrl` (`src/lib/locations/documents-fns.ts`) con la sessione corrente; le policy storage ammettono la lettura pubblica solo dei file con riga pubblica di sede pubblicata; la categoria `template_overlay` non è mai pubblica. Nessuna service key.
- CF sodalizio per i PDF in `src/lib/pdf-templates/config.ts`: 91018400282 (dal modulo ACSI ufficiale).
- I moduli cartacei originali sono digitalizzati solo per Galzignano (`ORIGINAL_FORM_SLUGS` in `catalog.ts`); la pagina ACSI del tesseramento minore è uguale per tutte le sedi.

## Documenti di riferimento

- `PIANO_LAVORI.md` — stato lavori, task completati, backlog e specifica M10. **Fonte di verità operativa.**
- `SPORTIVISSIMO_PRD.md` — requisiti di design e contenuti delle pagine pubbliche (nota: descrive il redesign UI; lo stato reale del backend è in PIANO_LAVORI.md).
- `MILESTONE_9.md` — specifica storica della M9 (completata; non presente nel repo).
