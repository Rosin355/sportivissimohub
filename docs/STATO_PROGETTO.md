# Sportivissimo Hub — Stato del progetto

Fotografia sintetica, aggiornata a fine sessione. Fonte di dettaglio: `docs/PIANO_LAVORI.md` (task) e `docs/REGISTRO_COMMIT.md` (storico per il cliente).

**Aggiornato al:** 2026-09-15 · ultimo commit di sviluppo su `main`: vedi `git log`.

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
- M11.1 schema del registro sede (`ac169d0`): migrazione **applicata** su Lovable il 2026-09-12.
- M11.2 griglia del registro sede (`4041d7c`): nuova pagina `/area-admin/sedi/<sede>/registro`, nessuna migrazione.
- M11.2b editor dei codici di frequenza nella scheda sede (`44ab4da`, già su `origin/main`).
- M11.3 pagamenti e cassa: scheda pagamenti dal registro e nuova pagina `/area-admin/sedi/<sede>/cassa`, nessuna migrazione.
- M11.3b archiviazione ed eliminazione sicura nel pannello admin, nuova pagina `/area-admin/figli-duplicati`: richiede la migrazione `20260915120000_m11_3b_archiviazione.sql` prima del push.
- Il ramo locale include il merge `4fdd4d9` dei commit Lovable fino a `66260e2`; tsc e build verificati dopo il merge.

## Migrazioni in attesa di applicazione su Lovable

- Nessuna arretrata: M10.1, M10.1b, M10.2 e M10.3 risultano applicate (commit Lovable `eb0b151`, `22acd9c`, `478bc7b`).
- **Nessuna in attesa.** Le due ultime (firma elettronica `20260907120000_signatures.sql` e registro sede `20260912100000_m11_1_registro_sede.sql`) sono state applicate su Lovable il 2026-09-12 e verificate: il contenuto applicato coincide con i file del repository (commit Lovable `66260e2`, copie in `drizzle/migrations/0005` e `0006`).
- M11.2, M11.2b e M11.3 non introducono migrazioni.
- **Nuova con M11.3b:** `supabase/migrations/20260915120000_m11_3b_archiviazione.sql` (colonna `locations.archived_at` con vincolo, blocco slug esteso, trigger di guardia sulle eliminazioni, regole di eliminazione admin su iscrizioni e figli, regola di storage per i file dei documenti delle iscrizioni). **Va applicata su Lovable prima del push**: il codice legge `archived_at` e, senza la colonna, le pagine che caricano le sedi (sito pubblico compreso) rispondono con errore. Verificato in locale contro il database attuale.

## Task in corso

- M11 (registro sede) in corso: consegnati M11.1 (schema), M11.2 (griglia iscrizioni), M11.2b (editor codici di frequenza) e M11.3 (pagamenti e cassa) e M11.3b (archiviazione ed eliminazione sicura). M11.4 rimandata a dopo la M13.

## Prossimo task

- **Applicare su Lovable la migrazione M11.3b, poi il push.** L'ordine conta: vedi sopra.
- **M11.5 — Export Excel** col layout dei fogli del cliente: è l'ultimo task della M11 eseguibile subito.
- **M11.4 — Presenze giornaliere estese** è rimandata: dipende dalla M13 (tabella `assignments` per il collegamento staff→sede) e va eseguita dopo.

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
