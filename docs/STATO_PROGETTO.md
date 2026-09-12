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
- M11.1 schema del registro sede (`ac169d0`): migrazione **applicata** su Lovable il 2026-09-12.
- M11.2 griglia del registro sede: nuova pagina `/area-admin/sedi/<sede>/registro`, nessuna migrazione.

## Migrazioni in attesa di applicazione su Lovable

- Nessuna arretrata: M10.1, M10.1b, M10.2 e M10.3 risultano applicate (commit Lovable `eb0b151`, `22acd9c`, `478bc7b`).
- **Nessuna in attesa.** Le due ultime (firma elettronica `20260907120000_signatures.sql` e registro sede `20260912100000_m11_1_registro_sede.sql`) sono state applicate su Lovable il 2026-09-12 e verificate: il contenuto applicato coincide con i file del repository (commit Lovable `66260e2`, copie in `drizzle/migrations/0005` e `0006`).
- M11.2 non introduce migrazioni.

## Task in corso

- M11 (registro sede) in corso: consegnati M11.1 (schema) e M11.2 (griglia iscrizioni).

## Prossimo task

- **M11.3 — Pagamenti e cassa per sede**: dialogo rate per bambino (data, metodo, importo, nota, rimborsi con importo negativo), vista cassa con totali per metodo e registrazione di spese e consegne contanti, gestione della gita come addebito extra. Nessuna migrazione prevista: le tabelle esistono già dalla M11.1.
- Da valutare prima o insieme alla M11.3: **editor dei codici di frequenza nella scheda sede**. Oggi i codici e i prezzi esistono con i valori del seed e la griglia li mostra, ma non c'è ancora una schermata per modificarli, che la decisione di prodotto prevede.

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
