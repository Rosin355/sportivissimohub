# Centri Estivi — Dettaglio sede, iscrizione multi-step e gestione admin (solo frontend)

Niente DB/Supabase per ora. Dati delle sedi in un modulo TypeScript statico, iscrizioni salvate in `localStorage` come mock. Stile crayon/cartoon attuale invariato.

## 1. Dati statici

- `src/data/locations.ts`: array `LOCATIONS` (9 sedi attuali) con campi completi — slug, nome, comune, indirizzo, fascia età, descrizione, prezzo settimanale, settimane (numero, date, posti), orario giornaliero, attività, badge, servizi inclusi, servizi extra, documenti richiesti, contatti, FAQ, colore tema.
- `src/data/enrollments.ts`: helper `saveEnrollment` / `getEnrollments` su `localStorage` (chiave `sportivissimo:enrollments`) + tipi `Enrollment`, `EnrollmentStatus`. Seed iniziale con 3–4 iscrizioni demo per popolare l'admin.

## 2. Dettaglio sede

- Route `src/routes/centri-estivi.$slug.tsx`: legge da `LOCATIONS` per slug, `notFound()` se mancante.
- Hero crayon con nome sede, comune, fascia età, badge attività, posti disponibili (progress bar gamificata).
- Griglia info-card: settimane disponibili, orario, prezzo, servizi inclusi, servizi extra, documenti richiesti.
- "La giornata tipo" come step orizzontali riutilizzando `LevelStep`.
- FAQ con `Accordion` shadcn.
- Card contatti (telefono, email, indirizzo).
- CTA primaria "Iscrivi tuo figlio" → `/centri-estivi/$slug/iscrizione`. Secondaria "Richiedi informazioni" → mailto.
- `LocationCard` aggiornata: diventa `<Link to="/centri-estivi/$slug" params={...}>`.

## 3. Form iscrizione multi-step

- Route `src/routes/centri-estivi.$slug.iscrizione.tsx`.
- Componente `EnrollmentWizard` (6 step) + `WizardProgress` con frasi gamificate ("Missione 3 di 6 — sei quasi al traguardo!").
- `react-hook-form` + `zod` per validazione per-step.
- Stato persistente in `localStorage` come bozza (`sportivissimo:draft:<slug>`).
- Step:
  1. Dati genitore/tutore
  2. Dati bambino/a (con calcolo età da data nascita)
  3. Sede (pre-fill read-only) + settimane (checkbox dalla sede) + fascia oraria (radio) + servizi extra
  4. Delegati al ritiro (field array dinamico "Aggiungi delegato") + consensi (checkbox obbligatori)
  5. Upload documenti — input file, file salvati come metadata mock (nome + size, niente upload reale)
  6. Riepilogo + CTA "Invia iscrizione"
- Submit: `saveEnrollment()` su localStorage con stato `Nuova`, pulisce bozza, mostra schermata conferma allegra (stelle/confetti CSS) + CTA "Torna alle sedi" / "Vai alla mia area".

## 4. Area admin

- Aggiorno `src/routes/area-admin.tsx`: tabella iscrizioni (`getEnrollments`), filtri per sede e stato, badge stato colorati riusando `EnrollmentStatusBadge`.
- `Sheet` shadcn per dettaglio: dati genitore, bambino, sede, settimane, servizi, consensi, documenti, delegati. Selettore stato che aggiorna localStorage, textarea note admin interne.

## 5. Area genitori

- Aggiorno `src/routes/area-genitori.tsx`: lista iscrizioni demo (tutte quelle in localStorage) con stato, sede, settimane e CTA "Iscrivi un altro bambino" → `/centri-estivi`. Nota: senza auth è demo per tutti.

## 6. Componenti nuovi

- `src/components/site/WizardProgress.tsx`
- `src/components/site/EnrollmentWizard.tsx` (+ step files in `src/components/site/enrollment/Step*.tsx`)
- `src/components/site/LocationDetailHero.tsx`
- `src/components/site/FaqAccordion.tsx`

## Cosa NON cambia

- Homepage, nav, footer, palette, tipografia, hero/level/adventure card.
- Lista `/centri-estivi`: stesse card, solo cliccabili.

## Backend

Rimandato. Quando si vorrà persistere davvero basterà sostituire i due moduli `src/data/*` con serverFn + Supabase, mantenendo invariati i componenti UI.