# Sportivissimo Hub — Registro dei lavori

**Progetto:** Sportivissimo Hub, portale per centri estivi, doposcuola, progetti scolastici e corsi.
**Cliente:** Associazione Sportivissimo A.S.D.
**Sviluppo:** Romesh (Digital Yogin). Grafica e infrastruttura cloud con Lovable.

Una voce per ogni commit di sviluppo, dal più recente al più vecchio. Le voci delle modifiche automatiche di Lovable e di sola formattazione sono su una riga.

Convenzione: l'hash di un commit si conosce solo dopo averlo creato, quindi la voce più recente nasce con hash `……` e viene completata dal commit successivo.

## Legenda delle milestone

| Sigla | Contenuto | Periodo |
|---|---|---|
| Setup / UI | Creazione del progetto, prototipo grafico, homepage e pagine pubbliche | maggio–giugno 2026 |
| M1 | Accesso, registrazione, aree riservate per ruolo | 22 luglio 2026 |
| M2 | Database con regole di sicurezza e spazio documenti privato | 22 luglio 2026 |
| M3 | Modulo di iscrizione online collegato al database | 22 luglio 2026 |
| M4 | Caricamento reale dei documenti | 22 luglio 2026 |
| M5 | Area genitori con dati reali | 22 luglio 2026 |
| M6 | Area amministrazione | 22 luglio 2026 |
| M7 | Email automatiche (poi passate a Lovable Emails) | 22 luglio 2026 |
| M8 | Area staff e presenze | 22 luglio 2026 |
| M9 | Dati completi per la modulistica, PDF precompilati, moduli originali | luglio–settembre 2026 |
| M10 | Sedi, documenti e domande personalizzate gestiti dal pannello | settembre 2026 |
| Fix | Correzioni dai test sul sito | settembre 2026 |
| Docs | Documentazione di progetto | settembre 2026 |
| Firma | Firma elettronica semplice dei moduli | settembre 2026 |
| M11 | Registro sede (replica digitale del gestionale Excel) | settembre 2026 |

## Voci

### 2026-09-15 · `……` · M11 — Archiviazione ed eliminazione sicura nel pannello

Nel pannello di amministrazione "elimina" ora segue una regola sola: quello che ha uno storico si archivia, e si cancella davvero solo ciò che non ha nulla di collegato. Una sede finita si archivia: sparisce dal sito, dal modulo di iscrizione e dall'area animatori, ma iscrizioni, pagamenti e presenze restano consultabili, e la si può ripristinare. Si può eliminare definitivamente solo una sede senza iscrizioni né movimenti.

Lo stesso vale per le iscrizioni, che si annullano e si eliminano solo se non hanno pagamenti, presenze o firme; per le domande personalizzate e i codici di frequenza, che si eliminano solo se mai usati. Una nuova pagina mostra le schede dei figli inserite due volte dallo stesso genitore e permette di togliere quella doppia senza iscrizioni. Prima di ogni eliminazione una finestra elenca esattamente cosa verrà rimosso, oppure spiega perché non si può e cosa fare invece. Ogni operazione resta nel registro delle azioni.

### 2026-09-15 · `e6a56b1` · M11 — Cassa: rate di iscrizioni annullate evidenziate

Nella cassa di sede le rate di iscrizioni poi annullate restano conteggiate, perché sono soldi davvero incassati o restituiti. Adesso però quelle righe sono evidenziate con la scritta "iscrizione annullata" e una nota spiega perché compaiono. Aggiornato anche il piano: le presenze giornaliere estese si faranno dopo la gestione dei progetti e delle assegnazioni del personale, da cui dipende chi dello staff vede quale sede.

### 2026-09-15 · `2a3d88c` · M11 — Registro sede: pagamenti e cassa

Dal registro di ogni sede si apre la scheda pagamenti di un bambino, cliccando sulle colonne della gita o del versato. Lì si registrano le rate con data, bonifico o contanti, importo e una nota, e si segnano i rimborsi. Le rate sono libere: non c'è più il limite delle quattro colonne per canale del file Excel. Nella stessa scheda si aggiungono o tolgono la gita e gli altri addebiti a parte. In alto si vedono quota, gita, versato e saldo, ricalcolati dal sistema a ogni modifica.

Nuova anche la pagina della cassa di sede. Mostra, per un periodo a scelta o per tutta la stagione, quanto è entrato con bonifico e in contanti, i rimborsi, le spese e le consegne di contanti, con l'elenco di tutti i movimenti. Da qui si registrano le spese e le consegne. Ogni inserimento, modifica o cancellazione resta tracciato nel registro delle azioni. Pagamenti, quote e cassa li vede solo l'amministrazione.

### 2026-09-13 · `44ab4da` · M11 — Registro sede: codici di frequenza modificabili

Nella scheda di ogni sede c'è ora la sezione dei codici di frequenza, cioè la legenda del registro. Per ogni codice si possono cambiare descrizione, prezzo, se è della primaria o dell'asilo, se è mezza giornata o giornata intera e se vale la convenzione col comune, oppure disattivarlo. La sigla del codice invece non cambia mai, perché è quella scritta nelle caselle del registro. Un codice non si cancella: disattivato, non si può più scegliere ma resta valido dove è già stato usato.

La pagina avvisa che un nuovo prezzo vale anche per le caselle già compilate, e mostra quante caselle usano ogni codice, così l'effetto sulle quote è chiaro prima di salvare. Si possono aggiungere codici nuovi, e le sedi create da poco, che non hanno ancora nessun codice, possono caricare con un clic gli otto codici standard. Ogni modifica resta tracciata nel registro delle azioni.

### 2026-09-12 · `4041d7c` · M11 — Registro sede: la griglia delle iscrizioni

Arriva la schermata vera e propria del registro, una per sede, che replica il foglio ISCRIZIONI del file Excel. Nelle righe i bambini iscritti, nelle colonne le settimane, e in ogni casella si sceglie il codice di frequenza da una tendina. Accanto compaiono quota, gita, versato e saldo, calcolati dal sistema e aggiornati appena si cambia una casella. Sotto la griglia c'è il riepilogo per settimana: quanti bambini a mezza giornata e quanti a giornata intera, divisi tra primaria e asilo, con la riga dei pasti da ordinare.

Ogni modifica di casella resta tracciata nel registro delle azioni, con il valore di prima e quello dopo. Le sedi che non hanno ancora settimane o codici configurati non danno errore: la pagina lo dice e indica dove sistemarli. Le caselle ancora da assegnare sono evidenziate, così si vede a colpo d'occhio cosa manca.

### 2026-09-12 · `ac169d0` · M11 — Registro sede: impianto dei dati

Prima parte del registro di sede, la versione digitale del gestionale Excel usato oggi. Preparata la struttura dati che regge tutto il resto: la legenda dei codici di frequenza con i relativi prezzi, configurabile sede per sede (di partenza gli otto codici in uso con i prezzi di Asigliano, tutti modificabili); la casella che dice quale codice ha ogni bambino in ogni settimana; la gita come voce separata dalla quota; i pagamenti a rate libere, con la possibilità di registrare rimborsi; la cassa di sede con spese e consegne di contante; le presenze di bambini e animatori e i pasti ordinati ogni giorno.

La quota non viene mai scritta a mano: la calcola il sistema sommando le settimane e la tessera. Il saldo somma la gita e sottrae tutte le rate versate, correggendo l'errore del file Excel attuale, dove la formula del saldo dimenticava la terza rata di ogni canale. Chi vede cosa: l'amministrazione gestisce tutto, gli animatori vedono solo ciò che serve alle presenze e mai gli importi, il genitore vede soltanto i propri pagamenti e in sola lettura. Non cambia ancora nulla nelle schermate: qui si costruiscono le fondamenta.

### 2026-09-07 · `44438bb` · Firma — Registro delle azioni chiuso ai client

Correzione di sicurezza sulla firma: il registro delle azioni non accetta più scritture dirette dagli account genitore. La voce "firma apposta" viene scritta da una funzione del database che verifica da sola che la firma esista e appartenga a chi la registra, e annota solo quei dati. Nessun cambiamento visibile per chi usa il sito.

### 2026-09-07 · `9e11de0` · Firma — Firma elettronica semplice dei moduli

Dall'area genitori si possono firmare i moduli con il dito o con il mouse, dopo aver visto cosa si firma (moduli e consensi) e spuntato una dichiarazione esplicita. Firmano il titolare dell'account e, se indicato, il secondo genitore, anche in momenti diversi. Ogni firma resta conservata come evidenza (chi, quando, cosa ha dichiarato) e viene inserita nei PDF con data e dicitura "Firmato elettronicamente da … il …"; l'amministrazione vede se i moduli sono firmati. La firma non è obbligatoria per iscriversi.

### 2026-09-07 · `10ebfa5` · Docs — Sistema di documentazione e piano M11

Creata la cartella `docs/` con il piano lavori, la specifica della M11, il PRD, questo registro dei lavori per il cliente e la fotografia dello stato del progetto. Le istruzioni di progetto ora impongono di aggiornare la documentazione a ogni commit. Nel piano: giro di test M10 spuntato, sezione M11 (registro sede) con le decisioni di prodotto confermate.

### 2026-09-05 · `a441ec1` · M10.4 — Rifiniture: figli senza CF e intestazione PDF

Dall'area genitori si possono aggiungere anche figli senza codice fiscale italiano. I PDF hanno l'intestazione con il logo Sportivissimo e il logo del comune della sede.

- 2026-09-05 · `478bc7b` · M10.2/M10.3 · Attivato bucket M10.2 e M10.3 — Spazi file e migrazioni M10.2 e M10.3 attivati su Lovable Cloud.
- 2026-09-05 · `b5137ca` · M10 · Changes — Lovable: registrata la migrazione applicata sul database.
- 2026-09-05 · `e638198` · M10 · Changes — Lovable: registrata la migrazione applicata sul database.

### 2026-09-04 · `b55124d` · M10.3 — Domande personalizzate per sede

L'amministrazione può aggiungere domande specifiche per sede (testo, sì/no, scelta da elenco, data) che compaiono nel modulo di iscrizione. Le risposte si vedono in amministrazione, nell'area genitori, nell'export e nei PDF. Le domande non influenzano prezzi o posti.

### 2026-09-04 · `fdfb094` · M10.2 — Download documenti senza chiavi privilegiate

Il download dei documenti della sede resta controllato dal server ma senza usare chiavi privilegiate: le regole di accesso stanno direttamente sullo spazio file.

### 2026-09-04 · `601d6f1` · M10.2 — Documenti della sede

Ogni sede ha i suoi documenti (regolamento, moduli vuoti, informative), caricati dall'amministrazione dalla scheda sede e scaricabili dai genitori nella pagina della sede e durante l'iscrizione. I file interni non sono mai visibili al pubblico.

### 2026-09-04 · `68967d2` · Fix — Correzioni dal test sul sito

Quattro correzioni emerse dal test: i documenti caricati nel modulo ora compaiono nell'area genitori e restano salvati anche se ci si registra a metà; la schermata di conferma è leggibile; il pulsante mostra/nascondi password funziona e spiega quando è il browser a mascherare; il calcolo del codice fiscale riconosce più comuni e province.

- 2026-09-04 · `46b8d75` · M10.1 · Aggiornata edge function email — Email automatiche aggiornate: nome della sede letto dal database (Lovable).
- 2026-09-04 · `9ef4cbb` · M10.1 · Changes — Lovable: aggiornamento delle email automatiche.
- 2026-09-04 · `6d0e3ef` · M10.1 · Changes — Lovable: aggiornamento delle email automatiche.
- 2026-09-04 · `c470402` · M10.1 · Changes — Lovable: aggiornamento delle email automatiche.
- 2026-09-04 · `02ebcd6` · M10 · Changes — Lovable: registrata la migrazione applicata sul database.

### 2026-09-04 · `cd2a156` · M10.1 — Loghi dei comuni in modo sicuro

I loghi dei comuni vengono mostrati tramite link temporanei sicuri, per rispettare i limiti della piattaforma che non consente spazi file pubblici.

- 2026-09-04 · `22acd9c` · M10.1 · Aggiunti permessi e bucket — Permessi di lettura e spazio loghi creati su Lovable Cloud.
- 2026-09-04 · `3acbd12` · M10 · Changes — Lovable: registrata la migrazione applicata sul database.
- 2026-09-04 · `eb0b151` · M10.1 · Applicata migrazione M10.1 — Applicata su Lovable Cloud la migrazione delle sedi (M10.1).
- 2026-09-04 · `aef5066` · M10 · Changes — Lovable: registrata la migrazione applicata sul database.
- 2026-09-04 · `02a83b5` · M10 · Changes — Ritocchi automatici di Lovable durante l'attivazione della M10.
- 2026-09-04 · `9629493` · M10 · Work in progress — Ritocchi automatici di Lovable durante l'attivazione della M10.

### 2026-09-04 · `89ff461` · M10.1 — Sedi gestite dal pannello

Le sedi si gestiscono dal pannello amministrazione senza interventi tecnici: dati, settimane con date, prezzi, servizi extra, badge, giornata tipo, FAQ, logo del comune, stato bozza o pubblicata. I posti disponibili si calcolano dalle iscrizioni confermate.

### 2026-09-03 · `9e9e362` · M9.3 — Moduli cartacei originali compilati automaticamente

Il modulo cartaceo ufficiale di Galzignano (regolamento, note sanitarie, iscrizione, tesseramento ACSI) viene compilato automaticamente con i dati dell'iscrizione: il genitore scarica l'originale già pronto da firmare. Inserito il codice fiscale dell'associazione nei PDF.

### 2026-09-03 · `65d3ce3` · Docs — Documenti di progetto nel repository

Piano lavori e istruzioni di progetto portati nel repository; verificata la rifinitura dell'accesso fatta su Lovable (mostra/nascondi password, requisiti password, messaggi di errore in italiano).

- 2026-07-22 · `42e0c22` · M9 · Refinitura auth completata — Rifinitura dell'accesso: mostra/nascondi password, requisiti password, messaggi in italiano (Lovable).
- 2026-07-22 · `319a384` · M8/M9 · Changes — Ritocchi su Lovable durante l'attivazione del backend e la rifinitura dell'accesso.
- 2026-07-22 · `c9c0dad` · M8/M9 · Changes — Ritocchi su Lovable durante l'attivazione del backend e la rifinitura dell'accesso.
- 2026-07-22 · `78caba4` · M8/M9 · Changes — Ritocchi su Lovable durante l'attivazione del backend e la rifinitura dell'accesso.
- 2026-07-22 · `ea1dadc` · M8/M9 · Changes — Ritocchi su Lovable durante l'attivazione del backend e la rifinitura dell'accesso.
- 2026-07-22 · `8313f87` · M8/M9 · Changes — Ritocchi su Lovable durante l'attivazione del backend e la rifinitura dell'accesso.
- 2026-07-22 · `2af240d` · M8/M9 · Changes — Ritocchi su Lovable durante l'attivazione del backend e la rifinitura dell'accesso.
- 2026-07-22 · `c731e5f` · M8/M9 · Changes — Ritocchi su Lovable durante l'attivazione del backend e la rifinitura dell'accesso.
- 2026-07-22 · `6b0ecd0` · M8/M9 · Changes — Ritocchi su Lovable durante l'attivazione del backend e la rifinitura dell'accesso.
- 2026-07-22 · `1403264` · M9.1 · Appl. migrazione dati estesi — Applicata su Lovable Cloud la migrazione dei dati completi (M9.1).
- 2026-07-22 · `62b92e1` · M8/M9 · Changes — Ritocchi su Lovable durante l'attivazione del backend e la rifinitura dell'accesso.
- 2026-07-22 · `fa17f7e` · M9.1 · Changes — Lovable Cloud: applicata la migrazione dei dati completi (M9.1).

### 2026-07-22 · `92d11e9` · M9.2 — Moduli PDF precompilati

Genitori e amministrazione scaricano i moduli PDF già compilati con i dati dell'iscrizione: tesseramento ACSI del minore e modulo di iscrizione. Generati al momento, senza copie salvate.

### 2026-07-22 · `1aed251` · M9.1 — Dati completi per la modulistica

Il modulo di iscrizione raccoglie tutto ciò che serve ai moduli ufficiali: sesso e luogo di nascita, bambini senza codice fiscale italiano, secondo genitore, residenza, tipo di tessera ACSI, consensi. Prezzi reali 2026 di Galzignano, calcolo e verifica automatica del codice fiscale, costo stimato in tempo reale.

### 2026-07-22 · `ea725db` · M8 — Allineamento tecnico

Allineamento tecnico dei file di progetto dopo le modifiche fatte su Lovable (nessuna novità visibile).

- 2026-07-22 · `66a396d` · M8 · Aggiunta animazione confetti — Animazione coriandoli a iscrizione inviata (Lovable).
- 2026-07-22 · `5416ef3` · M8/M9 · Changes — Ritocchi su Lovable durante l'attivazione del backend e la rifinitura dell'accesso.
- 2026-07-22 · `70015b1` · M8/M9 · Changes — Ritocchi su Lovable durante l'attivazione del backend e la rifinitura dell'accesso.
- 2026-07-22 · `30b1c7c` · M8/M9 · Changes — Ritocchi su Lovable durante l'attivazione del backend e la rifinitura dell'accesso.
- 2026-07-22 · `babb537` · M8 · Corretto colore testi in dettaglio — Corretto il colore dei testi nel dettaglio sede (Lovable).
- 2026-07-22 · `039a68c` · M8/M9 · Changes — Ritocchi su Lovable durante l'attivazione del backend e la rifinitura dell'accesso.
- 2026-07-22 · `eae1b43` · M8 · De-annidata route centri-estivi — Corretta la navigazione delle pagine sedi (Lovable).
- 2026-07-22 · `80f86a9` · M8/M9 · Changes — Ritocchi su Lovable durante l'attivazione del backend e la rifinitura dell'accesso.
- 2026-07-22 · `a4bf7d6` · M8/M9 · Changes — Ritocchi su Lovable durante l'attivazione del backend e la rifinitura dell'accesso.
- 2026-07-22 · `4849051` · M8 · Migrato bucket storage RLS — Regole di sicurezza dello spazio documenti applicate su Lovable Cloud.
- 2026-07-22 · `f33a0c0` · M1–M8 · Changes — Lovable Cloud: applicata una migrazione del database.
- 2026-07-22 · `c554d50` · M1–M8 · Changes — Lovable Cloud: applicata una migrazione del database.
- 2026-07-22 · `01bc5c5` · M1–M8 · Changes — Lovable Cloud: applicata una migrazione del database.
- 2026-07-22 · `74a3653` · M1–M8 · Changes — Lovable Cloud: applicata una migrazione del database.
- 2026-07-22 · `1abe55c` · M8/M9 · Changes — Ritocchi su Lovable durante l'attivazione del backend e la rifinitura dell'accesso.
- 2026-07-22 · `0396d81` · M8/M9 · Changes — Ritocchi su Lovable durante l'attivazione del backend e la rifinitura dell'accesso.

### 2026-07-22 · `fbc6424` · M8 — Unione con Lovable Cloud

Unito il lavoro sul backend con l'attivazione di Lovable Cloud (database e servizi gestiti dalla piattaforma).

- 2026-07-22 · `de19019` · M8 · Attivato Lovable Cloud — Attivato Lovable Cloud: database e servizi gestiti dalla piattaforma.
- 2026-07-22 · `23636e4` · M8/M9 · Changes — Ritocchi su Lovable durante l'attivazione del backend e la rifinitura dell'accesso.
- 2026-07-22 · `da0d37d` · M8/M9 · Work in progress — Ritocchi su Lovable durante l'attivazione del backend e la rifinitura dell'accesso.
- 2026-07-22 · `94fff7f` · M8 · Lovable update — Aggiornamento automatico Lovable.
- 2026-07-22 · `ad14ac4` · M8/M9 · Work in progress — Ritocchi su Lovable durante l'attivazione del backend e la rifinitura dell'accesso.

### 2026-07-22 · `00e48b7` · M8 — Formattazione

Sola formattazione del codice, nessuna modifica funzionale.

### 2026-07-22 · `6e4a371` · M8 — Area staff e presenze

Area staff: scelta sede e settimana, elenco bambini confermati con allergie e delegati al ritiro, registrazione presenze con check-in e check-out.

### 2026-07-22 · `d6b4685` · M7 — Prime email automatiche

Prima versione delle email automatiche (conferma iscrizione, cambio stato, sollecito documenti). Sostituita in seguito dal sistema email integrato di Lovable, che non richiede servizi esterni.

### 2026-07-22 · `5711835` · M6 — Area amministrazione

Pannello amministrazione con elenco iscrizioni e filtri, cambio stato e note, verifica o rifiuto dei documenti, stato pagamento, esportazione CSV per Excel e riepilogo posti per settimana. Ogni azione resta tracciata nel registro.

### 2026-07-22 · `388f36f` · M5 — Area genitori con dati reali

L'area genitori mostra i dati veri: figli, iscrizioni con stato, avanzamento dei documenti richiesti dalla sede, comunicazioni. Gestione di più figli.

### 2026-07-22 · `bf1e5db` · M4 — Caricamento documenti

I genitori caricano davvero i documenti richiesti (PDF o foto, max 10 MB) in uno spazio privato. Download solo con link protetti a scadenza; stati caricato, verificato, rifiutato.

### 2026-07-22 · `10ca415` · M3 — Iscrizione online sul database

Il modulo di iscrizione salva davvero i dati sul database. La bozza resta sul dispositivo del genitore e non si perde se deve accedere o registrarsi a metà percorso.

### 2026-07-22 · `2c617e0` · M2 — Database e regole di sicurezza

Creato il database vero e proprio: figli, iscrizioni, delegati al ritiro, documenti e registro delle azioni. Ogni tabella ha regole di sicurezza che impediscono a chiunque di vedere dati non suoi; i documenti stanno in uno spazio privato.

### 2026-07-22 · `4490ae1` · M1 — Accesso e registrazione

Gli utenti possono registrarsi, accedere e recuperare la password. Le aree genitori, staff e amministrazione sono riservate e ogni utente vede solo ciò che compete al suo ruolo.

- 2026-06-04 · `749ca08` · UI · Spostato import Google Fonts — Spostato il caricamento dei font (Lovable).
- 2026-06-04 · `2af3934` · UI · Changes — Ritocchi grafici (Lovable).
- 2026-06-04 · `bcba342` · UI · Changes — Ritocchi grafici (Lovable).
- 2026-06-04 · `60f74af` · UI · Update plan — Ritocchi grafici (Lovable).
- 2026-06-04 · `89c0c4a` · UI · Work in progress — Ritocchi grafici (Lovable).
- 2026-05-29 · `2ae3bf0` · UI · Reverted to commit 42aa30469e2b398a95bed4ba96d71f185ab2bde6 — Ripristinata la versione precedente dell'apertura (Lovable).
- 2026-05-29 · `ee18d23` · UI · Fast Visual Edit — Modifica visuale rapida (Lovable).
- 2026-05-29 · `f956089` · UI · Changes — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `18927f5` · UI · Added white gradient overlay — Sfumatura bianca sull'apertura (Lovable).
- 2026-05-29 · `36f76ce` · UI · Changes — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `a9a0f42` · UI · Changes — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `291fb79` · UI · Work in progress — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `42aa304` · UI · Fixed activity icon names — Corretti i nomi delle icone attività (Lovable).
- 2026-05-29 · `4e611fc` · UI · Changes — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `37ffe2f` · UI · Changes — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `c0adab5` · UI · Changes — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `e42e655` · UI · Adattato layout mobile — Layout adattato al mobile (Lovable).
- 2026-05-29 · `03445d5` · UI · Changes — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `ab71d7a` · UI · Allineato banner sotto hero — Banner allineato sotto l'apertura (Lovable).
- 2026-05-29 · `990d328` · UI · Changes — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `665d66f` · UI · Changes — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `f8660e7` · UI · Update plan — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `56494a8` · UI · Work in progress — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `e3a44e3` · UI · Refined hero section layout — Layout dell'apertura rifinito (Lovable).
- 2026-05-29 · `e8e179c` · UI · Changes — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `899e2bc` · UI · Aggiunto hero full-screen — Apertura a tutto schermo (Lovable).
- 2026-05-29 · `294d544` · UI · Changes — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `9415066` · UI · Changes — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `6d740bf` · UI · Allineato testo alla griglia — Testi allineati alla griglia (Lovable).
- 2026-05-29 · `e79497e` · UI · Changes — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `5f7e1d5` · UI · Changes — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `2ab1f3b` · UI · Ridimensionato hero banner — Banner di apertura ridimensionato (Lovable).
- 2026-05-29 · `218af65` · UI · Changes — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `4c8d8a8` · UI · Changes — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `0407fc4` · UI · Riavviato dev server fonts — Riavvio ambiente per i font (Lovable).
- 2026-05-29 · `d0a10f0` · UI · Changes — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `f810af2` · UI · Applicato design completo — Design completo applicato (Lovable).
- 2026-05-29 · `e70387b` · UI · Changes — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `d083643` · UI · Changes — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `a337e99` · UI · Changes — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `b55c883` · UI · Changes — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `fad288e` · UI · Changes — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `f07f73f` · UI · Removed background, enlarged hero — Apertura ingrandita senza sfondo (Lovable).
- 2026-05-29 · `2947084` · UI · Changes — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `7cf8dbc` · UI · Changes — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `071c8f8` · UI · Fixed hero image cropping — Corretto il ritaglio dell'immagine di apertura (Lovable).
- 2026-05-29 · `dc2a8bf` · UI · Changes — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `722fb29` · UI · Changes — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `bf35823` · UI · Aggiunta mask curva al layout — Maschera curva nel layout (Lovable).
- 2026-05-29 · `6154a00` · UI · Changes — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `0311b7b` · UI · Changes — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `1872f75` · UI · Aggiunta curva sottile hero — Curva decorativa nell'apertura (Lovable).
- 2026-05-29 · `3182bca` · UI · Changes — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `e2b47a5` · UI · Changes — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `acf8b70` · UI · Changes — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `04ce18f` · UI · Redisegnato Hero section — Sezione di apertura ridisegnata (Lovable).
- 2026-05-29 · `c46d3b3` · UI · Changes — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `a9a8ada` · UI · Changes — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `ceb5345` · UI · Update plan — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `2e381dc` · UI · Work in progress — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).

### 2026-05-29 · `88c3b18` · UI — Anteprima Lovable sbloccata

Corretti errori tecnici che impedivano a Lovable di mostrare l'anteprima del sito.

### 2026-05-29 · `4d4dbae` · UI — Unione del lavoro grafico

Unite le modifiche grafiche fatte su Lovable con quelle locali: mantenuta la versione fedele al mockup, recuperate immagini e pagine nuove.

### 2026-05-29 · `db6f065` · UI — Homepage fedele al mockup

Homepage rifatta seguendo il mockup grafico approvato: intestazione chiara, card illustrate dei servizi, percorso "come funziona" a passi orizzontali.

- 2026-05-29 · `2e856c7` · UI · Redisigned homepage to mockup — Homepage ridisegnata sul mockup (Lovable).
- 2026-05-29 · `1f18857` · UI · Changes — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `1ddbe48` · UI · Changes — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `7827b23` · UI · Changes — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `1eecca2` · UI · Changes — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `170ba42` · UI · Changes — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `1d5399d` · UI · Changes — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-29 · `8ae72a2` · UI · Work in progress — Iterazione grafica della homepage: apertura, layout, mobile (Lovable).
- 2026-05-22 · `14011bf` · UI · Aggiunti dati e wizard — Dati di prova e modulo di iscrizione a passi (Lovable, prototipo).
- 2026-05-22 · `f13b115` · UI · Changes — Iterazione sul prototipo: pagine sedi e modulo di iscrizione con dati di prova (Lovable).
- 2026-05-22 · `e923436` · UI · Changes — Iterazione sul prototipo: pagine sedi e modulo di iscrizione con dati di prova (Lovable).
- 2026-05-22 · `39945b7` · UI · Changes — Iterazione sul prototipo: pagine sedi e modulo di iscrizione con dati di prova (Lovable).
- 2026-05-22 · `eced89b` · UI · Changes — Iterazione sul prototipo: pagine sedi e modulo di iscrizione con dati di prova (Lovable).
- 2026-05-22 · `f2e366d` · UI · Changes — Iterazione sul prototipo: pagine sedi e modulo di iscrizione con dati di prova (Lovable).
- 2026-05-22 · `8bc987a` · UI · Changes — Iterazione sul prototipo: pagine sedi e modulo di iscrizione con dati di prova (Lovable).
- 2026-05-22 · `33fd612` · UI · Changes — Iterazione sul prototipo: pagine sedi e modulo di iscrizione con dati di prova (Lovable).
- 2026-05-22 · `588c50d` · UI · Changes — Iterazione sul prototipo: pagine sedi e modulo di iscrizione con dati di prova (Lovable).
- 2026-05-22 · `28fe066` · UI · Changes — Iterazione sul prototipo: pagine sedi e modulo di iscrizione con dati di prova (Lovable).
- 2026-05-22 · `a81457c` · UI · Changes — Iterazione sul prototipo: pagine sedi e modulo di iscrizione con dati di prova (Lovable).
- 2026-05-22 · `bbef495` · UI · Changes — Iterazione sul prototipo: pagine sedi e modulo di iscrizione con dati di prova (Lovable).
- 2026-05-22 · `6b4edc7` · UI · Changes — Iterazione sul prototipo: pagine sedi e modulo di iscrizione con dati di prova (Lovable).
- 2026-05-22 · `ddf0334` · UI · Rimosso DB/Supabase — Rimosso il database provvisorio: prototipo solo grafico (Lovable).
- 2026-05-22 · `f45c902` · UI · Changes — Iterazione sul prototipo: pagine sedi e modulo di iscrizione con dati di prova (Lovable).
- 2026-05-22 · `313c9b6` · UI · Added location detail views — Pagine di dettaglio delle sedi (Lovable, prototipo).
- 2026-05-22 · `a3bed28` · UI · Changes — Iterazione sul prototipo: pagine sedi e modulo di iscrizione con dati di prova (Lovable).
- 2026-05-22 · `c60b82c` · UI · Changed hero image to no text — Immagine di apertura senza testo (Lovable).
- 2026-05-22 · `8e3d90a` · UI · Changes — Iterazione sul prototipo: pagine sedi e modulo di iscrizione con dati di prova (Lovable).
- 2026-05-22 · `4bae1d0` · UI · Changes — Iterazione sul prototipo: pagine sedi e modulo di iscrizione con dati di prova (Lovable).
- 2026-05-22 · `ea4e3f3` · UI · Work in progress — Iterazione sul prototipo: pagine sedi e modulo di iscrizione con dati di prova (Lovable).
- 2026-05-18 · `b81cf93` · UI · Update site info for publish — Prima pubblicazione: informazioni del sito (Lovable).

### 2026-05-18 · `183fbfd` · UI — Nuova veste grafica

Nuova veste grafica del sito: stile sportivo e moderno al posto del tema "pastello" iniziale. Interessa tutte le pagine pubbliche.

- 2026-05-12 · `2c2f476` · UI · Applied crayon style to UI — Stile grafico "pastello" applicato (Lovable).
- 2026-05-12 · `f977a9c` · UI · Changes — Iterazione grafica del prototipo iniziale (Lovable).
- 2026-05-12 · `4e96db3` · UI · Changes — Iterazione grafica del prototipo iniziale (Lovable).
- 2026-05-12 · `80e3728` · UI · Changes — Iterazione grafica del prototipo iniziale (Lovable).
- 2026-05-12 · `62e7c9e` · UI · Changes — Iterazione grafica del prototipo iniziale (Lovable).
- 2026-05-12 · `d65da72` · UI · Changes — Iterazione grafica del prototipo iniziale (Lovable).
- 2026-05-12 · `e407d25` · UI · Changes — Iterazione grafica del prototipo iniziale (Lovable).
- 2026-05-12 · `e06c1c2` · UI · Ha creato il portale gamificato — Prima bozza del portale (Lovable).
- 2026-05-12 · `30e9854` · UI · Changes — Iterazione grafica del prototipo iniziale (Lovable).
- 2026-05-12 · `c3e816a` · UI · Changes — Iterazione grafica del prototipo iniziale (Lovable).
- 2026-05-12 · `e9859ca` · UI · Changes — Iterazione grafica del prototipo iniziale (Lovable).
- 2026-05-12 · `ae5cf51` · UI · Changes — Iterazione grafica del prototipo iniziale (Lovable).
- 2026-05-12 · `9f12b51` · UI · Changes — Iterazione grafica del prototipo iniziale (Lovable).
- 2026-05-12 · `a2ca18e` · UI · Changes — Iterazione grafica del prototipo iniziale (Lovable).
- 2026-05-12 · `f040421` · UI · Changes — Iterazione grafica del prototipo iniziale (Lovable).
- 2026-05-12 · `acae46b` · UI · Changes — Iterazione grafica del prototipo iniziale (Lovable).
- 2026-05-12 · `9d7ce22` · UI · Changes — Iterazione grafica del prototipo iniziale (Lovable).
- 2026-05-12 · `f3a9b78` · UI · Changes — Iterazione grafica del prototipo iniziale (Lovable).
- 2025-01-01 · `ba20ba6` · Setup · template: tanstack_start_ts_2026-05-06 — Progetto creato dal template Lovable.
