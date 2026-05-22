# Centri Estivi — Dettaglio sede, iscrizione multi-step e gestione admin

Mantengo intatto lo stile attuale (palette crayon/cartoon, badge, card arrotondate, shadow soft, font Patrick Hand/Caveat). Aggiungo solo i nuovi flussi.

## 1. Backend (Lovable Cloud / Supabase)

Abilito Lovable Cloud e creo lo schema:

- `locations` — sede (slug, nome, comune, indirizzo, fascia età, descrizione, prezzo base, settimane totali, posti totali, attività, servizi inclusi/extra, documenti richiesti, contatti, faq, immagine).
- `camp_weeks` — settimane disponibili per location (numero, data inizio/fine, posti disponibili).
- `guardians` — dati genitore collegati a `auth.users`.
- `children` — dati bambino collegati al genitore.
- `enrollments` — iscrizione (location_id, child_id, guardian_id, fascia oraria, servizi extra JSON, stato, note admin, totale, created_at).
- `enrollment_weeks` — pivot enrollment ↔ camp_week.
- `pickup_authorizations` — delegati al ritiro (nome, telefono, documento).
- `enrollment_consents` — consensi (privacy, foto/video, uscite, regolamento).
- `enrollment_documents` — documenti caricati (tipo, file_path in storage).
- `user_roles` + enum `app_role('admin','staff','parent')` + funzione `has_role()` (security definer, anti-recursion).
- Bucket Storage `enrollment-docs` (privato) con policy per genitore (cartella `userId/...`) e admin via `has_role`.

RLS:
- Genitori vedono/modificano solo proprie righe.
- Admin (via `has_role`) accede a tutto.
- `locations` e `camp_weeks` lettura pubblica.

Seed: popolo `locations` + `camp_weeks` con le 9 sedi già presenti nella pagina.

## 2. Dettaglio sede

- Route dinamica `src/routes/centri-estivi.$slug.tsx` con loader che usa `createServerFn` (admin client, lettura pubblica).
- LocationCard diventa `<Link to="/centri-estivi/$slug">`.
- Layout in stile crayon: hero colorato con nome/comune/età, griglia info-card (settimane, orario, attività, prezzo, servizi, documenti), badge attività, "routine della giornata" come step orizzontali (stile LevelStep esistente), FAQ accordion, sezione contatti.
- CTA primaria "Iscrivi tuo figlio" → `/centri-estivi/$slug/iscrizione`. Secondaria "Richiedi informazioni" → mailto/form contatti.

## 3. Form iscrizione multi-step

- Route `src/routes/centri-estivi.$slug.iscrizione.tsx` (sotto layout `_authenticated` o con redirect a `/login` se non loggato).
- Componente `EnrollmentWizard` con 6 step + progress bar gamificata ("Missione 3 di 6 — quasi fatto!").
- Stato gestito con `react-hook-form` + `zod` schema per step; bozza salvata in `localStorage` con chiave per slug+userId.
- Step 1 genitore, Step 2 bambino, Step 3 sede (pre-fill) + settimane (checkbox da `camp_weeks`) + fascia oraria + servizi extra, Step 4 delegati (array dinamico) + consensi (checkbox obbligatori), Step 5 upload documenti su Storage, Step 6 riepilogo.
- Submit: serverFn `submitEnrollment` (auth) che crea/aggiorna `guardians`, `children`, `enrollments`, righe pivot, consensi, delegati, documenti.
- Schermata di conferma allegra con confetti CSS + CTA "Vai alla mia area".

## 4. Area genitori

- Aggiorno `area-genitori.tsx` per elencare le iscrizioni dell'utente (stato, sede, settimane, documenti) leggendo via serverFn auth.

## 5. Area admin

- Aggiorno `area-admin.tsx`: tabella iscrizioni con filtri per sede/stato, badge stato colorati (riusando `EnrollmentStatusBadge`).
- Detail drawer (shadcn Sheet) con dati completi, selettore stato, note interne, link ai documenti (signed URL via serverFn admin).
- Protetto da `has_role(auth.uid(),'admin')` + redirect lato client se non admin.

## 6. Auth

- Login email/password + Google (broker Lovable). Pagina `/login` minimale in stile crayon.
- Layout `_authenticated.tsx` con guard.
- Trigger SQL: alla creazione utente in `auth.users` → riga in `guardians` e ruolo `parent` in `user_roles`.

## 7. Note tecniche

- ServerFn in `src/lib/*.functions.ts` (locations, enrollments, admin).
- `attachSupabaseAuth` già richiesto per chiamate auth-protette: verifico `src/start.ts`.
- Storage upload lato client con `supabase.storage.from('enrollment-docs').upload(\`${userId}/${enrollmentId}/...\`)`.
- Tutti gli input validati con Zod (limiti lunghezza, regex CF, email).
- Stile invariato: uso classi/token esistenti (`rounded-doodle`, `shadow-card`, `font-display`, `font-pixel`, `bg-gradient-*`).

## Cosa NON cambia

- Homepage, nav, footer, palette, tipografia, componenti hero/level/adventure restano identici.
- Nessun redesign della pagina elenco `/centri-estivi`: solo le card diventano cliccabili.