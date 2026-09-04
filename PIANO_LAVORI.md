# Sportivissimo Hub — Piano lavori

Fonte di verità operativa. Claude Code: prima di ogni sessione, confronta questo file con `git log` e aggiorna le caselle dei task man mano che li completi (spuntarli fa parte del task stesso).

---

## FATTO (non rifare)

- [x] **M1** — Supabase Auth: login/registrazione/recupero password (`/login`, `/password-dimenticata`, `/aggiorna-password`, `/non-autorizzato`), guardie di ruolo sulle tre aree, SiteNav per ruolo, migrazione profiles + user_roles + trigger `handle_new_user`.
- [x] **M2** — Schema completo con RLS: children, enrollments (codice da sequence), pickup_delegates, enrollment_documents, audit_log; bucket privato `documents`.
- [x] **M3** — Wizard collegato al DB: server function con zod, upsert figlio, bozza per-sede in localStorage, redirect login senza perdita bozza, seed rimossi.
- [x] **M4** — Upload documenti reale nel bucket privato `{user_id}/{enrollment_id}/{doc_type}/`, download via URL firmati, stati caricato/verificato/rifiutato.
- [x] **M5** — Area genitori reale: dati utente, progresso documenti sui requiredDocuments, multi-figlio, comunicazioni dai dati veri.
- [x] **M6** — Area admin reale: filtri, cambio stato/note/pagamento con audit_log, verifica/rifiuto documenti, export CSV, pannello posti per settimana.
- [x] **M7 (superata)** — La funzione Resend è stata sostituita da **Lovable Emails**: tre app email italiane (conferma iscrizione, cambio stato, sollecito documenti) + auth email brandizzate, gestite da Lovable.
- [x] **M8** — Area staff: sede+settimana corrente, bambini confermati con allergie/delegati, check-in/out su tabella `attendance` con RLS.
- [x] **Fix routing** (via Lovable) — Outlet/nesting di `centri-estivi.$slug` e route di iscrizione.
- [x] **M9.1** — Dati estesi (commit 1aed251): sesso e luogo di nascita, minori senza CF italiano (toggle + dati documento estero, CF nullable con check), secondo genitore (jsonb), residenza, tessera base/super-integrativa, figlio_ordine, tre consensi ACSI; prezzi reali Galzignano 2026 con struttura `pricing`; validazione CF completa con check digit + pulsante Calcola; costo stimato live nel wizard; CSV con 12 nuove colonne. Migrazione `20260722150000_m9_dati_estesi.sql` (applicata su Lovable).
- [x] **M9.2** — PDF puliti precompilati (commit 92d11e9): layer `src/lib/pdf-templates/` con PdfBuilder e registro; modulo tesseramento ACSI minore e modulo iscrizione; server function `generateEnrollmentPdf` on-demand con autorizzazione via RLS; pulsanti in area genitori e admin.
- [x] **Rifinitura auth** (commit 42e0c22, eseguita da Lovable): `PasswordInput` con occhio mostra/nascondi su password e conferma; checklist requisiti live in `src/lib/auth/password.ts` (8+ caratteri, maiuscola, minuscola, numero) — da tenere allineata alla policy in Cloud → Users & Auth; barra robustezza a 3 livelli; `src/lib/auth/errors.ts` con mappatura in italiano (credenziali errate, email non confermata, email già registrata, password in breach, requisiti password, rate limit, rete, sessione mancante); `auth-attacher.ts` usa il singleton `getSupabaseBrowserClient` (niente più GoTrueClient doppio). Verificata a codice il 2026-09-03.
- [x] **M9.3 — Overlay sui moduli originali** (2026-09-03): template `assets/pdf-templates/galzignano-2026.pdf` (4 pagine: regolamento, note allergie, modulo iscrizione, modulo ACSI minore) incorporato nel bundle server via `?inline`; motore `src/lib/pdf-templates/overlay/engine.ts` (testo con adattamento/a capo su righe, spunte, whiteout, rimozione annotazioni); mappa coordinate `overlay/galzignano-2026.ts`; catalogo client-safe `catalog.ts` con disponibilità per sede; due varianti nel registro: `iscrizione-originale` (solo sedi con modulo digitalizzato, oggi Galzignano) e `tesseramento-acsi-originale` (pagina ACSI, tutte le sedi). Script di calibrazione `node scripts/pdf-calibrate.ts` (griglia + campi evidenziati + dati di prova). Calibrazione visiva fatta sul render a 4x: resta consigliata una stampa di prova. Le caselle Sì/No mediche di p.2 vengono spuntate solo con informazione positiva (allergie), mai dedotte.
- [x] **CF del sodalizio** in `pdf-templates/config.ts`: 91018400282, preso dal modulo ACSI ufficiale (p. 4 del template Galzignano).
- [x] **Fix dal test end-to-end** (2026-09-04): (1) documenti del wizard: catalogo unico dei tipi documento con codici stabili in `src/lib/enrollments/doc-types.ts` (matching per codice tra `enrollment_documents.doc_type` e `locations.required_documents`, etichette legacy normalizzate in lettura, nessuna migrazione), file del wizard persistiti in IndexedDB (`draft-files.ts`) così sopravvivono a reload e login/registrazione, esito upload sempre visibile nella schermata finale (caricati/falliti/da ricaricare), editor sedi con checklist dei documenti richiesti; (2) schermata "Iscrizione inviata!" con i token del design system; (3) `PasswordInput`: mantiene il focus sul campo e segnala quando il valore è dell'autofill del browser (che resta mascherato a prescindere dal type); (4) Calcola CF tollerante in `computeFiscalCode` (maiuscole, accenti, spazi, provincia per nome o "Comune (XX)", tentativo senza provincia, messaggi distinti per comune ambiguo/non trovato).

## IN CORSO / DA VERIFICARE A INIZIO SESSIONE

- Nessun task in corso. Prossimo: M10.1 (schema sedi da confermare prima della migrazione).
- Da verificare a mano su Lovable: la policy password in Cloud → Users & Auth deve coincidere con `src/lib/auth/password.ts` (8+ caratteri, maiuscola, minuscola, numero).

## BACKLOG — M10 (prossima milestone grossa, perimetro confermato)

Obiettivo: l'admin gestisce le sedi in autonomia, senza interventi sul codice.

- [x] **M10.1 — Sedi nel database** (2026-09-04). Migrazione `20260903150000_m10_locations.sql`: tabelle `locations` (tipo, stato bozza/pubblicata, anagrafica, contatti, `pricing` jsonb, orari/attività/servizi/documenti richiesti in text[], badge/giornata tipo/FAQ in jsonb, logo_path, note admin), `location_weeks` (codice stabile = vecchio id `w1…`, numero, etichetta, date reali, posti; unique (location_id, code)) e `location_extras` (codice stabile, etichetta, prezzo); seed = le 9 sedi di locations.ts, tutte pubblicate; FK `enrollments.location_slug → locations.slug`; trigger che blocca il cambio slug dopo la pubblicazione; RLS lettura pubblica delle pubblicate + bozze solo admin, scrittura solo admin; funzione security definer `location_week_occupancy()` (solo conteggi) per la disponibilità, che NON è memorizzata ma sempre calcolata dalle iscrizioni confermate per settimana. Migrazione `20260903150100_m10_location_logos_storage.sql`: policy del bucket **privato** `location-logos` (Lovable Cloud blocca i bucket pubblici: select per anon/authenticated limitata al bucket, scrittura solo admin) + GRANT su tabelle e funzione della M10.1 (già dati a mano su Lovable, ripetuti per riproducibilità). Loghi serviti con URL firmati (24 h) generati server-side nei loader di lista/dettaglio e nell'editor. Codice: `src/data/locations.ts` = tipi + mapping da DB; query in `src/lib/locations/queries.ts`; server function `listLocations`/`getLocation`/`saveLocation` (zod + audit log); editor admin `/area-admin/sedi` e `/area-admin/sedi/$id` (crea/modifica/bozza/pubblica, settimane, extra, badge, giornata tipo, FAQ, logo; slug bloccato dopo la pubblicazione); lista, dettaglio, wizard, aree admin/staff/genitori, CSV e PDF leggono dal DB. Tipi Supabase aggiornati a mano in `src/lib/supabase/types.ts`.
  - [ ] Far aggiornare via Lovable la edge function email: nome sede dal DB (tabella `locations`) invece della mappa hardcoded in `supabase/functions/send-transactional-email/index.ts`.
  - [ ] Logo del comune nell'intestazione dei PDF generati: rimandato a M10.4 (già previsto lì).
- [ ] **M10.2 — Cartelle documenti per sede.** Tabella `location_documents` + cartella nel bucket; upload admin dalla scheda sede (regolamento, moduli vuoti, informative, template PDF per overlay); esposizione automatica nella pagina pubblica della sede e nel wizard.
- [ ] **M10.3 — Campi personalizzati per sede.** Definizioni admin (tipi: testo, sì/no, scelta da elenco, data; etichetta; obbligatorio) + step wizard "Informazioni richieste dalla sede"; risposte in jsonb sull'iscrizione; incluse in CSV e in appendice ai PDF. Limiti espliciti: i campi custom non influenzano prezzi o logica; modificarli non tocca le risposte già raccolte.
- [ ] **M10.4 — Rifiniture collegate.** Dialog "Aggiungi figlio": gestire minori senza CF italiano (toggle esteri o avviso che rimanda al wizard). PDF puliti con intestazione logo Sportivissimo + logo comune per le sedi senza modulo cartaceo.

## BACKLOG — Pre-lancio (bloccanti prima delle famiglie vere)

- [ ] Privacy policy e cookie policy reali (dati di minori: prerequisito legale, non rifinitura) + pagina informativa trattamento dati linkata nel wizard.
- [ ] Prezzi/settimane reali delle altre 8 sedi (dall'associazione) — finché mancano, valutare di nasconderle o marcarle "iscrizioni in apertura".
- [x] CF del sodalizio in `pdf-templates/config.ts` (91018400282, dal modulo ACSI ufficiale).
- [ ] Verifica backup database (piano Supabase/Lovable Cloud) prima dei dati reali.
- [ ] Giro completo dei test end-to-end (piano in chat: 8 test, con test RLS a due account).

## BACKLOG — Rifiniture (post-lancio ok)

- [ ] Pagine pubbliche mancanti: Doposcuola, Progetti per le Scuole, Corsi e Attività (le card in homepage puntano tutte a /centri-estivi).
- [ ] favicon (404 in produzione), meta description su tutte le route, `prefers-reduced-motion`.
- [ ] Audit accessibilità e responsive mobile del wizard.
- [ ] Bozze wizard: valutare persistenza server-side per utenti loggati (abilita promemoria bozza via email — oggi impossibile perché la bozza è solo nel browser).
- [ ] Test automatici sulle funzioni critiche (validazione CF, calcolo costi, policy di stato).

## Regole di consegna

Una milestone alla volta, commit atomici, verifiche (tsc/build/lint) a ogni chiusura, riepilogo finale con: file modificati, eventuale migrazione da applicare su Lovable, task spuntati in questo file, regressioni escluse, prossimo task consigliato. Mai push: si ferma e consegna.
