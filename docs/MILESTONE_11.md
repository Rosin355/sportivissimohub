# MILESTONE 11 — Registro sede (replica digitale del gestionale Excel del cliente)

> **Prerequisito:** M10.1 (sedi nel DB) completata e M10.3 conclusa. Prima di iniziare: `git pull`, leggere `PIANO_LAVORI.md`, confrontare con `git log`. Flusso di lavoro invariato: commit atomici, mai push autonomo, migrazioni segnalate nel riepilogo per applicazione via Lovable (una alla volta).

## Decisioni di prodotto confermate dal cliente

1. **Gita = voce separata**, fuori dal calcolo della quota settimanale: addebito a parte sull'iscrizione (tabella `extra_charges`), coerente con l'impianto dell'Excel. Il saldo diventa `quota + gita − versato`.
2. **Codici di frequenza e prezzi configurabili per sede** (tabella `location_frequency_codes`), con seed degli 8 codici standard ai prezzi Asigliano come default modificabili. Niente hardcoding. In interfaccia, una breve descrizione spiega all'admin cosa sono i codici di frequenza.

## Contesto

Il cliente gestisce oggi i centri estivi con file Excel (riferimento: `asigliano_2026.xlsx` compilato e template vuoto `ELENCO_CRE_2026.xlsx`). Questa milestone replica quel metodo nel pannello admin, correggendone i difetti noti. Il suo modello:

- **Foglio ISCRIZIONI**: matrice bambini × settimane (9 colonne settimana). In ogni cella un **codice frequenza** che determina il prezzo dalla legenda:
  - `MC` Mezza primaria convenzione (€30), `IC` Intera primaria convenzione (€60)
  - `M` Mezza primaria no convenzione (€55), `I` Intera primaria no convenzione (€90)
  - `AMC`/`AIC` Mezza/Intera asilo convenzione (€30/€60), `AM`/`AI` Mezza/Intera asilo no convenzione (€55/€90)
  - "Convenzione" = residente/convenzionato col comune (equivale al tier residenti già in `pricing` M9). La legenda codici→prezzi vive in un blocco in fondo al foglio: i prezzi sono di fatto configurabili per sede.
- **QUOTA** = Σ (COUNTIF settimane per codice × prezzo del codice) + tessera (`TESS`, €10). La **GITA** (col. N, €30-35) è **voce separata, NON entra nella quota**.
- **Pagamenti**: 8 colonne alternate BON.1-4 / CONT.1-4 (bonifico/contanti, fino a 4 rate per canale), inclusi importi negativi come rimborsi (es. -10 con nota "restituiti soldi"). **SALDO** = quota − rate versate. Il file del cliente ha un bug: la formula SALDO salta le colonne BON.3/CONT.3 — **da correggere, non replicare**.
- **Riepilogo in fondo al foglio** (righe 78-93): conteggi per settimana per categoria (mezza/intera × primaria/asilo, "TOTALE INTERA (PASTI)" per ordinare i pasti), totali cassa per metodo, spese con data e consegne contanti, saldo cassa residuo.
- **Foglio PRESENZE**: matrice bambini × giorni (5 gg per blocco settimana, colonna vuota di separazione). Marcature P/A/I/M/pomeriggio (attenzione: nei fogli del cliente "P" è ambiguo tra presente e pomeriggio). In fondo: riga PASTI ORDINATI per giorno + riga "ok" di conferma, righe presenze animatori con gli stessi codici, riga PASTI ANIMATORI.

## Sotto-task

### M11.1 — Schema (una migrazione)

- **`location_frequency_codes`**: location_id (FK), code (es. MC, unique per sede), label, categoria (primaria/asilo), fascia (mezza/intera), convenzione boolean, prezzo numeric, active boolean, sort_order. Seed: gli 8 codici standard con i prezzi Asigliano per ogni sede esistente, modificabili dall'editor. RLS: lettura admin/staff, scrittura solo admin. GRANT come per le altre tabelle (su questo progetto i default non bastano).
- **`enrollment_week_codes`**: enrollment_id (FK), week_code (coerente con `location_weeks.code`), frequency_code; unique (enrollment_id, week_code). È la "cella" della matrice del cliente: quale codice frequenza ha quel bambino in quella settimana. Popolamento iniziale derivato da `enrollments.week_ids` + residenza + fascia oraria dell'iscrizione, poi modificabile dall'admin (con audit_log).
- **`extra_charges`**: enrollment_id (FK), tipo (per ora 'gita'), descrizione, importo, created_at. Fuori dalla formula quota.
- **`payments`**: enrollment_id (FK), importo (negativi ammessi = rimborsi), metodo (bonifico/contanti), data, nota, created_by. Sostituisce le 8 colonne fisse: N rate.
- **Movimenti di cassa non legati a iscrizioni** (spese, consegne contanti): valutare in implementazione `payments` con enrollment_id null e tipo dedicato, oppure tabella `cash_movements`; documentare la scelta nel riepilogo.
- **Estensione presenze**: su `attendance` colonna `mark` (enum con valori distinti per presente/assente/intera/mattina/pomeriggio — disambiguare la "P" del cliente pur mostrando in UI le etichette che conosce). Nuove tabelle `staff_attendance` (location_id, staff_name, giorno, mark) e `daily_meals` (location_id, giorno, pasti_bambini calcolato, pasti_staff manuale, stato da_ordinare/ordinato/confermato).
- Vincoli: quota SEMPRE calcolata server-side (mai fidarsi del client); i genitori non vedono né modificano nulla di questo modulo, salvo i propri pagamenti in sola lettura.

### M11.2 — Griglia iscrizioni (`/area-admin/sedi/$slug/registro`)

- Righe = bambini iscritti alla sede, colonne = settimane della sede. Cella = select dei codici frequenza attivi della sede (+ vuoto). Modifica admin con scrittura su `enrollment_week_codes` e audit_log.
- Colonne calcolate server-side: QUOTA (Σ settimane×prezzo + tessera), GITA (da extra_charges, separata), VERSATO (Σ payments), SALDO = quota + gita − versato (formula corretta, senza il bug BON3/CONT3). Colonna note.
- Sotto la griglia, il riepilogo del cliente: per ogni settimana, conteggi per categoria/fascia (mezza/intera × primaria/asilo), totale intera = pasti previsti, totali complessivi. Replica il pannello righe 78-93 del file.
- Breve testo informativo in testa alla griglia che spiega i codici frequenza e rimanda alla configurazione per sede.

### M11.2b — Editor dei codici di frequenza per sede

- Sezione "Codici di frequenza" nella scheda sede (`/area-admin/sedi/$id`), solo admin, con breve spiegazione di cosa sono i codici e di come entrano nella quota.
- Per ogni codice si modificano: etichetta, categoria (primaria/asilo), fascia (mezza/intera), convenzione, prezzo, attivo/disattivo.
- **Codice e sede immutabili** (già garantito dal trigger `location_frequency_codes_lock` della M11.1): l'interfaccia non li rende modificabili e la server function non li accetta.
- Un codice non si elimina: si disattiva. Un codice disattivato sparisce dalle tendine della griglia ma resta valido nelle caselle già compilate.
- Ogni creazione e modifica finisce in `audit_log` con i valori precedenti e quelli nuovi.
- Avviso esplicito in interfaccia: prezzo, categoria e fascia valgono anche per le caselle già compilate, quindi quote e riepilogo si aggiornano subito (come cambiando la legenda nel file Excel). Accanto a ogni codice, il numero di caselle che lo usano.
- Aggiunta di un nuovo codice (il codice si sceglie alla creazione e poi non cambia) e, per le sedi che non hanno ancora nessun codice, caricamento degli 8 codici standard: le sedi create dal pannello dopo la M11.1 non hanno ricevuto il seed.
- Nessuna migrazione: tabella, vincoli e RLS esistono dalla M11.1.

### M11.3 — Pagamenti

- Drawer/dialog per bambino: lista rate (data, metodo, importo, nota), aggiunta/modifica/eliminazione con audit. Importi negativi ammessi con etichetta "rimborso".
- Vista cassa per sede: totali per metodo, filtro periodo, elenco movimenti, registrazione spese/uscite e consegne contanti.
- Gita gestita da `extra_charges`: aggiunta/rimozione dall'admin, visibile nella griglia come colonna distinta.

### M11.3b — CRUD completo nel pannello admin, con archiviazione come default

**Principio.** Dove esiste storico collegato, "elimina" significa **archivia**: l'entità sparisce dagli elenchi operativi ma resta per storico ed export. L'**eliminazione definitiva** è consentita solo se l'entità non ha dipendenze, con un dialogo di conferma che elenca cosa verrà rimosso, e viene tracciata in `audit_log`. Le dipendenze si verificano nell'app **e** nel database (trigger di guardia prima dell'eliminazione), così una richiesta diretta non può aggirarle.

**Stato di partenza verificato nel codice (2026-09-15)**, per limitarsi a ciò che manca davvero:

| Entità | Già presente | Da fare |
|---|---|---|
| Sedi | niente | archiviazione e ripristino; eliminazione definitiva solo senza iscrizioni |
| Documenti di sede | eliminazione con rimozione del file, conferma e audit (M10.2) | nulla: non hanno storico collegato |
| Campi personalizzati | disattivazione (M10.3) | eliminazione definitiva solo se nessuna iscrizione ha una risposta |
| Iscrizioni | annullamento come stato, con audit | eliminazione definitiva solo senza pagamenti né presenze |
| Figli duplicati | niente lato admin | elenco dei possibili duplicati ed eliminazione solo del figlio senza iscrizioni |
| Codici di frequenza | disattivazione (M11.2b) | eliminazione definitiva solo se nessuna casella li usa |

**Sedi.**
- Archiviazione sempre disponibile: la sede torna in bozza (quindi sparisce da sito, wizard e area staff) e riceve la data di archiviazione. Una sede archiviata non si può pubblicare e il suo slug resta bloccato. Ripristino dall'elenco: torna una bozza normale, da ripubblicare esplicitamente.
- Nell'elenco admin le archiviate stanno in una sezione separata; nel filtro sedi dell'area iscrizioni restano, marcate come archiviate, perché le loro iscrizioni sono storico.
- Eliminazione definitiva solo con zero iscrizioni; per coerenza col principio bloccano anche movimenti di cassa, presenze staff e pasti registrati. Il dialogo elenca settimane, servizi extra, documenti con i relativi file, campi personalizzati, codici di frequenza e logo, che vengono rimossi insieme alla sede.

**Iscrizioni.** L'annullamento resta lo stato da usare. Eliminazione definitiva solo se non ci sono pagamenti né presenze; blocca anche una firma elettronica, perché è un'evidenza da conservare. Il dialogo elenca documenti caricati con i relativi file, delegati al ritiro, caselle del registro e addebiti extra, che vengono rimossi.

**Figli duplicati.** Pagina admin con i possibili duplicati per famiglia: stesso codice fiscale, oppure stesso nome, cognome e data di nascita. Si elimina solo il figlio che non ha iscrizioni; l'unione di due schede con iscrizioni non fa parte di questo task.

**Campi personalizzati e codici di frequenza.** Restano disattivabili come oggi. Il pulsante di eliminazione compare solo quando non ci sono risposte raccolte (campi) o caselle che usano il codice (codici).

**Migrazione** (una): colonna `locations.archived_at` con vincolo "archiviata ⇒ non pubblicata", blocco dello slug esteso alle archiviate, trigger di guardia prima dell'eliminazione su sedi, iscrizioni, figli, campi personalizzati e codici di frequenza, regola di eliminazione admin su iscrizioni e figli, regola di storage per rimuovere i file dei documenti delle iscrizioni (mai quelli della cartella firme).

### M11.4 — Presenze giornaliere estese

> **Dipende da M13, da eseguire dopo.** L'accesso dello staff limitato alla propria sede richiede il collegamento staff→sede, che sarà la tabella `assignments` della M13 (progetti e sedi, con periodo e gerarchia). Non anticiparlo qui: si rifarebbe e si toccherebbero due volte le RLS delle presenze.

- Griglia giorno per giorno della settimana corrente (evoluzione della vista staff M8): mark per bambino con i codici configurati, righe staff/animatori, riga pasti (bambini "intera" presenti + pasti staff), pulsante "segna ordinato" → stato daily_meals.
- Accesso staff limitato alla propria sede (RLS esistente), admin ovunque.

### M11.5 — Export Excel

- Export `.xlsx` per sede che replica **il layout esatto dei fogli del cliente**: foglio ISCRIZIONI (matrice codici, quota, gita, rate, saldo, legenda prezzi in fondo, riepilogo conteggi) e foglio PRESENZE (matrice giorni, pasti, staff). Libreria già presente o `exceljs` (segnalare se serve nuova dipendenza). I valori sono quelli calcolati dal DB (numeri, non formule — il DB è la fonte di verità).
- Per questo task usare come riferimento di layout il template vuoto `assets/reference/ELENCO_CRE_2026.xlsx` (il file compilato contiene dati personali e NON va committato).

## Regole di consegna

Come da `PIANO_LAVORI.md`: un sotto-task alla volta, `npx tsc --noEmit` + `npm run build` + `npm run lint` a ogni chiusura, riepilogo finale con file modificati, SQL delle migrazioni da applicare su Lovable, caselle spuntate in PIANO_LAVORI.md, regressioni escluse (wizard genitori, aree M5-M8 invariate), prossimo task consigliato. Mai push.
