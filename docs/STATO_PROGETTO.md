# Sportivissimo Hub — Stato del progetto

Fotografia sintetica, aggiornata a fine sessione. Fonte di dettaglio: `docs/PIANO_LAVORI.md` (task) e `docs/REGISTRO_COMMIT.md` (storico per il cliente).

**Aggiornato al:** 2026-09-12 · ultimo commit di sviluppo su `main`: vedi `git log`.

## In produzione (sito pubblicato)

- Il live si aggiorna solo col publish manuale su Lovable: **data dell'ultimo publish da confermare dal cliente**. L'ultimo test end-to-end sul sito pubblicato è del 2026-09-04 (prima delle correzioni `68967d2`).
- Funzioni certamente live: sito pubblico, accesso e registrazione, modulo di iscrizione, aree genitori/staff/amministrazione, documenti, PDF precompilati (M1–M9.3, M10.1).

## Committato e in preview, da pubblicare

- `68967d2` correzioni dal test end-to-end (documenti del wizard, schermata finale, password, codice fiscale).
- `601d6f1` + `fdfb094` M10.2 documenti della sede.
- `b55124d` M10.3 domande personalizzate per sede.
- `a441ec1` M10.4 figli senza CF italiano dall'area genitori, intestazione PDF con loghi.
- `10ebfa5` documentazione di progetto (`docs/`), piano M11.
- Firma elettronica semplice (`9e11de0`, correzione audit `44438bb`): richiede la migrazione qui sotto.
- M11.1 schema del registro sede: solo database e tipi, nessuna schermata nuova. Richiede la migrazione qui sotto.

## Migrazioni in attesa di applicazione su Lovable

- Nessuna arretrata: M10.1, M10.1b, M10.2 e M10.3 risultano applicate (commit Lovable `eb0b151`, `22acd9c`, `478bc7b`).
- **Nuova con la firma elettronica:** `supabase/migrations/20260907120000_signatures.sql` (tabella `enrollment_signatures`, RLS, GRANT, funzione security definer `log_enrollment_signature` per la voce di audit; audit_log resta chiuso ai client). Da applicare via prompt su Lovable prima di pubblicare.
- **Nuova con M11.1:** `supabase/migrations/20260912100000_m11_1_registro_sede.sql` (codici di frequenza per sede con seed, celle bambino × settimana, addebiti extra, pagamenti, cassa, presenze staff, pasti, colonna `mark` su `attendance`, funzione `location_registry_totals`). Da applicare **dopo** quella della firma, nell'ordine dei file.

## Task in corso

- M11 (registro sede) avviata: M11.1 schema consegnato. Le schermate arrivano con M11.2.

## Prossimo task

- **M11.2 — Griglia iscrizioni per sede** (`/area-admin/sedi/$slug/registro`): righe bambini, colonne settimane, cella con il codice di frequenza, colonne quota/gita/versato/saldo calcolate dal database con `location_registry_totals`, riepilogo conteggi per settimana e testo che spiega i codici. Prerequisito: la migrazione M11.1 applicata su Lovable.

## Bloccanti pre-lancio (prima delle famiglie vere)

| Voce | Responsabile | Stato |
|---|---|---|
| Privacy policy e cookie policy reali + informativa trattamento dati linkata nel wizard | Cliente (testi legali) → Sviluppo (pagine e link) | Da fare |
| Prezzi e settimane reali delle altre 8 sedi (oggi placeholder segnalati in `admin_notes`) | Cliente (dati) → inseribili dal pannello sedi senza sviluppo | Da fare |
| Attivazione email transazionali su Lovable (dominio, template auth, tre app email + trigger, un solo test) | Cliente (Cloud → Emails) → Sviluppo (prompt a Lovable) | Da fare |
| Verifica backup del database (piano Lovable Cloud) | Cliente con Lovable | Da fare |
| Giro completo dei test end-to-end (8 test, RLS a due account) | Cliente + Sviluppo | Giro M10 fatto il 2026-09-04; da ripetere dopo il publish con M10.2–M10.4 e firma |
| Policy password in Cloud → Users & Auth allineata a 8+ caratteri, maiuscola, minuscola, numero | Cliente | Da verificare |

## Note operative

- Lovable rigenera `src/routeTree.gen.ts` senza il blocco `declare module`: non committare quella differenza se non ci sono route nuove.
- I bucket sono tutti privati (la piattaforma blocca quelli pubblici): loghi e documenti passano da URL firmati generati dal server.
