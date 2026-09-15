# MILESTONE 13 — Persone, ruoli, assegnazioni e documenti

> **Prerequisiti:** M11 completata e M12 (catalogo progetti) completata — le assegnazioni si agganciano ai progetti, che devono esistere nel database. Flusso invariato: `git pull`, leggere `PIANO_LAVORI.md` e confrontare con `git log`, commit atomici, mai push, migrazioni segnalate nel riepilogo per applicazione via Lovable una alla volta.
>
> **Questa è la milestone più rischiosa del progetto.** Riscrive le regole di accesso su tabelle che contengono dati di minori. Nessun task va considerato chiuso senza il piano di test multi-account descritto in fondo.

## Modello concettuale

Tre assi indipendenti sulla stessa persona. Non vanno mai collassati in un unico campo:

1. **Ruolo funzionale** — cosa la persona può fare: `admin`, `responsabile`, `insegnante`, `collaboratore`, `genitore`. Una persona può averne più di uno contemporaneamente (un insegnante può essere anche genitore di un iscritto).
2. **Appartenenza associativa** — è socio/tesserato, con eventuale scadenza. È un **dato anagrafico, non un permesso**. Governa unicamente l'accesso all'archivio documenti soci.
3. **Assegnazione** — a quale progetto, a quale sede, in quale periodo. **È qui che nascono i permessi operativi**, non nel ruolo: un responsabile non ha poteri "in generale", li ha sui progetti che l'admin gli ha assegnato.

Regola d'oro: `permesso = ruolo × assegnazione`. Fuori dal perimetro assegnato, la persona non vede nulla.

## Decisioni di prodotto confermate dal cliente

- **Solo l'admin (Davide) vede quote, saldi, pagamenti e cassa.** La funzione `location_registry_totals` resta admin-only come da M11.1. Nessun ruolo introdotto qui accede alla parte economica.
- **Solo l'admin modifica dati anagrafici e di contatto** delle persone, staff compreso.
- **Solo l'admin crea ruoli e assegna i responsabili.** Un responsabile non può promuovere sé stesso né allargare il proprio perimetro.
- Un responsabile, **sui soli progetti assegnatigli**, può: vedere e modificare le assegnazioni degli insegnanti e collaboratori sotto di lui; registrare e approvare le presenze (entrate/uscite di bambini e corsisti); vedere lo **stato** dei documenti degli iscritti e dello staff sotto di lui.
- **Archivio documenti soci: cartella unica gestita dall'admin**, con stato bozza/pubblicato. I tesserati vedono solo i pubblicati. Niente permessi per cartella.

## Da confermare in implementazione (proporre il default, non decidere da soli)

- **Verifica documenti**: il default proposto è che il responsabile veda lo stato (mancante/caricato/verificato/rifiutato) e possa sollecitare, mentre **la verifica e il rifiuto restano all'admin** come da M6. Segnalarlo nel riepilogo per conferma.
- **Contenuto dei documenti**: il responsabile vede lo *stato*, non scarica i file degli iscritti. Fanno eccezione le informazioni già esposte allo staff in M8 e necessarie alla sicurezza durante l'attività (allergie, note mediche, delegati al ritiro). Non ampliare oltre.

## Task

### M13.1 — Schema

Migrazione unica. Estende, non sostituisce, `user_roles` e `has_role()`: la migrazione deve mappare i ruoli esistenti (genitore/staff/admin) nel nuovo modello senza perdere accessi.

- **Estensione ruoli**: `responsabile`, `insegnante`, `collaboratore` accanto a quelli esistenti. `staff` esistente va mappato sul ruolo più prudente e documentato nel commento.
- **`assignments`**: id, user_id FK, program_id FK (nullable se l'assegnazione è a una singola sede), location_id FK (nullable), ruolo nell'assegnazione, data inizio/fine (nullable = a tempo indeterminato), created_by. Un responsabile può avere più righe = più progetti. Vincolo: almeno uno tra program_id e location_id valorizzato.
- **`memberships`**: user_id, stato tesseramento, numero tessera, data inizio/scadenza. Nessun effetto sui permessi operativi.
- **`staff_documents`**: user_id, tipo documento, file nel bucket privato, stato, scadenza. **Dati sensibili**: RLS stretta — l'interessato vede i propri, il responsabile vede solo *stato e scadenza* dello staff sotto di lui, l'admin tutto.
- **`member_documents`**: archivio unico soci — titolo, descrizione, file, stato bozza/pubblicato, data. Lettura: tesserati attivi sui soli pubblicati. Scrittura: solo admin.
- **Funzioni di supporto** security definer, da usare in tutte le policy nuove: `is_admin()`, `can_manage_program(program_id)` (vero se admin, o responsabile con assegnazione attiva su quel progetto), `supervises_user(user_id)` (vero se l'utente ha un'assegnazione dentro il perimetro del chiamante).
- **Riscrittura RLS** su iscrizioni, presenze, documenti e celle registro per usare le nuove funzioni, **senza allargare l'accesso dei genitori** e **senza esporre importi a ruoli diversi dall'admin**.

Ogni creazione, modifica o revoca di ruolo e assegnazione va in `audit_log`.

### M13.2 — Elenco persone (admin)

Pagina admin con tutte le persone: nome, contatti, ruoli, stato tesseramento, assegnazioni attive, stato documenti personali — i privilegi visibili a colpo d'occhio, come chiesto dal cliente. Filtri per ruolo, progetto, sede, stato tessera. Da qui l'admin assegna e revoca ruoli, assegna persone a progetti e sedi, gestisce il tesseramento. Anagrafica e contatti modificabili **solo** da questa pagina.

### M13.3 — Area responsabile

Visibile solo ai progetti assegnati; se il responsabile ne ha più di uno, selettore di progetto. Contiene:

- **Presenze**: registrazione entrate/uscite di bambini e corsisti, per sede e giornata, e approvazione delle presenze registrate dagli insegnanti. Si appoggia alla griglia presenze di M11.4.
- **Stato documenti degli iscritti** del suo progetto: chi è a posto e chi manca, con possibilità di sollecitare. Nessun importo, nessun saldo, nessun download dei file.
- **Il suo staff**: insegnanti e collaboratori assegnati, con stato e scadenza dei loro documenti, e gestione delle loro assegnazioni a sedi e turni dentro il perimetro.

### M13.4 — Area insegnante/collaboratore

Vista ridotta: solo le attività assegnate — sedi, giornate, elenco iscritti del gruppo, registrazione presenze. Nessun accesso ad altri progetti, ad altre sedi, agli importi o all'anagrafica altrui.

### M13.5 — Archivio documenti soci

Lato admin: caricamento, titolo, descrizione, bozza/pubblicato. Lato socio: elenco dei soli documenti pubblicati, download via URL firmati. Nessuna gerarchia di cartelle.

## Piano di test obbligatorio

Da eseguire come in M11.1 (Postgres temporaneo + sessioni reali), documentando l'esito nel riepilogo. Casi minimi:

| Caso | Atteso |
|---|---|
| Responsabile sul progetto A apre dati del progetto B | nessuna riga |
| Responsabile apre quote, saldi, pagamenti, cassa | negato su ogni via, funzione totali inclusa |
| Responsabile modifica anagrafica di un suo insegnante | negato |
| Responsabile modifica assegnazione di un suo insegnante | consentito e tracciato |
| Responsabile scarica un documento di un iscritto | negato; vede solo lo stato |
| Insegnante apre una sede non assegnata | nessuna riga |
| Genitore dopo la riscrittura RLS | vede esattamente quanto prima, né più né meno |
| Socio non tesserato / tessera scaduta sull'archivio | nessuna riga |
| Socio sull'archivio con documenti in bozza | vede solo i pubblicati |
| Persona con doppio ruolo (insegnante + genitore) | vede il proprio figlio come genitore e il gruppo assegnato come insegnante, senza incroci |

## Regole di consegna

Un sotto-task alla volta, `npx tsc --noEmit`, `npm run build`, `npm run lint` a ogni chiusura, riepilogo con file modificati, SQL delle migrazioni da applicare su Lovable, caselle spuntate in `PIANO_LAVORI.md`, regressioni escluse (wizard genitori e aree M5–M8 invariate) ed esito della tabella di test qui sopra. Mai push.
