# MILESTONE 12 — Catalogo progetti

> **Prerequisiti:** M11.3b completata. Precede M13 (persone e ruoli), perché le assegnazioni dei responsabili si agganciano ai progetti creati qui. Flusso invariato: `git pull`, leggere `PIANO_LAVORI.md` e confrontare con `git log`, commit atomici, mai push, migrazioni segnalate nel riepilogo per applicazione via Lovable una alla volta.

## Contesto

Oggi il database ha un solo livello: `locations`, con un campo tipo introdotto in M10.1. L'associazione però ragiona per **progetti**, ognuno svolto in più sedi. Fonte: il documento "Sportivissimo progettazione" fornito dal cliente (2026), che sostituisce le informazioni ricavabili dal vecchio sito.

**Struttura richiesta:** progetto → sedi. Cliccando un progetto nel pannello admin si vedono le sedi dove si svolge; il pubblico vede la pagina del progetto con l'elenco delle sedi attive.

**Il punto critico:** non tutti i progetti hanno iscrizioni delle famiglie. I tre progetti scolastici sono venduti alle scuole, con preventivo costruito sul numero di bambini e nessun wizard di iscrizione. Il catalogo deve gestire quattro modelli distinti:

| Modello | Significato | Progetti |
|---|---|---|
| `settimane` | iscrizione per settimane, con codici frequenza e registro (M11) | Centri estivi |
| `periodo` | iscrizione a periodo o abbonamento ricorrente | Corsi fitness, Doposcuola |
| `ciclo_incontri` | numero chiuso di incontri, famiglia iscritta in blocco | Let's Play Together |
| `vetrina` | nessuna iscrizione online: pagina informativa + modulo richiesta contatto per le scuole | Cuccioli Sprint, Felici di crescere così, Tutti a scuola con lo Sport |

In questa milestone si costruiscono catalogo, pagine e modello `vetrina`. I flussi `periodo` e `ciclo_incontri` sono **fuori ambito** e vanno in M14: qui basta che il campo esista e che la pagina pubblica rimandi al contatto finché il flusso non c'è.

## Task

### M12.1 — Schema e seed

Migrazione unica.

- **`programs`**: id, slug, nome, categoria (`scolastico`/`extrascolastico`), modello_iscrizione (enum sopra), sottotitolo, descrizione breve, descrizione lunga (testo ricco, modificabile), fascia d'età, target (nido, infanzia, primaria, secondaria, adulti, famiglie), durata/periodo indicativo, immagine di copertina, colore identificativo, ordine, stato bozza/pubblicato/archiviato. RLS: lettura pubblica dei pubblicati, scrittura solo admin.
- **`locations.program_id`** FK, con migrazione dei dati: le sedi esistenti (tutte centri estivi) vanno collegate al progetto Centri estivi. Il campo tipo di M10.1 resta per compatibilità o viene deprecato, documentando la scelta.
- **Seed**: i sette progetti con i testi della sezione "Testi di seed" qui sotto. Sono contenuti iniziali, **tutti modificabili dall'admin**: non vanno hardcodati in nessun componente.
- Ogni creazione, modifica, duplicazione e archiviazione in `audit_log`.

### M12.2 — Admin: catalogo progetti

- Elenco progetti raggruppato per categoria, con numero di sedi attive e stato.
- Editor completo: tutti i campi sopra, con i testi lunghi modificabili in un campo adeguato (textarea o editor semplice — nessuna nuova dipendenza pesante).
- **CRUD completo secondo il principio di M11.3b**: archiviazione come default, eliminazione definitiva solo se il progetto non ha sedi né iscrizioni collegate, con dialogo che elenca cosa verrà rimosso.
- **Duplica progetto**: crea una copia in bozza con slug derivato e testi identici, senza sedi collegate.
- Scheda progetto con l'elenco delle sue sedi e collegamento diretto alla scheda di ciascuna.

### M12.3 — Duplica sede

Richiesta esplicita del cliente. Dalla scheda o dall'elenco sedi, "Duplica" crea una nuova sede **in bozza** copiando struttura e configurazione — settimane, struttura prezzi, codici frequenza, campi personalizzati, documenti richiesti, contatti — e **non** copiando iscrizioni, pagamenti, presenze, celle registro, logo del comune. Nome e slug ricevono un suffisso modificabile. Serve a creare la stagione nuova o una sede simile senza riconfigurare tutto a mano.

### M12.4 — Pagine pubbliche dei progetti

- Indice progetti diviso in programmi scolastici ed extrascolastici, con le card che portano alla pagina del progetto.
- Pagina progetto: testi dal database, elenco sedi dove si svolge (solo pubblicate), CTA coerente col modello di iscrizione — iscrizione per `settimane`, richiesta contatto per `vetrina`, avviso "iscrizioni in apertura" per `periodo` e `ciclo_incontri` finché M14 non esiste.
- Le card della homepage che oggi puntano tutte a `/centri-estivi` vanno collegate ai progetti reali (voce già a backlog in `PIANO_LAVORI.md`).
- URL esistenti dei centri estivi **invariati**.

### M12.5 — Logo

Sostituire il logo attuale con quello ufficiale fornito dal cliente (`logo_sportivissimo.jpg`, S rossa stilizzata). Verificare la resa su header chiaro, footer blu notte e intestazione dei PDF generati; se serve, produrre una variante su fondo scuro. **Segnalare nel riepilogo** se il rosso del logo stona con la palette blu/arancione del design system: è una decisione di brand che spetta al cliente, non una correzione da fare in autonomia.

## Testi di seed

Contenuti iniziali derivati dal documento del cliente. Modificabili dall'admin.

### Cuccioli Sprint
*Categoria:* scolastico · *Modello:* vetrina · *Target:* nido, 20 mesi – 3 anni
**Sottotitolo:** La nostra proposta per il nido
**Breve:** Psicomotricità per i più piccoli: un percorso di attività cognitivo-motoria pensato per i bambini dai 20 mesi ai tre anni.
**Lunga:** Alle bambine e ai bambini del nido proponiamo un percorso che tiene insieme gioco, movimento, emozioni e relazione. L'attività non è solo motoria: coinvolge la sfera ludica, psicologica, affettiva, cognitiva e sociale, perché a questa età ogni gesto è anche scoperta di sé e degli altri. Lavoriamo sugli schemi motori di base, sulle capacità senso-percettive e coordinative, e su obiettivi educativi come l'ascolto, il rispetto dei compagni e delle regole, la collaborazione. Gli incontri sono curati da insegnanti qualificati e organizzati intorno a tre elementi: uno spazio sicuro e accogliente, tempi inseriti nella programmazione della struttura, materiali adatti e in quantità sufficiente perché ogni bambino abbia il proprio attrezzo con cui giocare.

### Felici di crescere così
*Categoria:* scolastico · *Modello:* vetrina · *Target:* scuola dell'infanzia, 3 – 5 anni
**Sottotitolo:** La nostra proposta per la scuola dell'infanzia
**Breve:** Attività cognitivo-motoria per le scuole dell'infanzia, su tutte le fasce d'età, per circa 30 settimane da ottobre a maggio.
**Lunga:** Il progetto accompagna i bambini di 3, 4 e 5 anni con proposte che cambiano secondo la maturità del gruppo, nel rispetto del percorso educativo della scuola e con attenzione ai bambini con disabilità o difficoltà cognitive. Gli obiettivi sono ampi: dare un bagaglio motorio solido su cui costruire le esperienze sportive future, far conoscere le realtà sportive del territorio, prevenire l'abbandono precoce dello sport, formare la personalità dentro il gruppo. Il percorso si sviluppa in genere su 30-31 settimane, da ottobre a maggio secondo il calendario scolastico, e si chiude con un momento di festa o un saggio, da integrare se la scuola lo desidera alla festa di fine anno. Sono previste lezioni aperte ai genitori durante l'anno e la possibilità di condurre parte delle attività in lingua inglese. Durata e struttura si adattano alle esigenze dell'istituto: il preventivo si definisce dopo un incontro, in base al numero di bambini coinvolti.

### Let's Play Together
*Categoria:* scolastico · *Modello:* ciclo_incontri · *Target:* famiglie, bambini con almeno un genitore
**Sottotitolo:** Il gioco come strumento educativo
**Breve:** Quattro incontri per giocare insieme, genitori e figli, e scoprire come il gioco diventa uno strumento educativo.
**Lunga:** Nato dagli anni di lavoro nelle scuole dell'infanzia, questo percorso avvicina le famiglie alla nostra associazione con una proposta rivolta a bambini e genitori insieme. L'obiettivo è dare alcune basi e alcuni concetti di gioco perché i genitori possano giocare con i propri figli in modo più mirato e produttivo. Il progetto si articola in quattro incontri: uno teorico di apertura e tre pratici, preferibilmente il sabato mattina, della durata di un'ora ciascuno. Ogni incontro è condotto da un insegnante di educazione fisica dell'associazione, affiancato da esperte del settore psicologico-pedagogico che spiegano ai genitori gli aspetti educativi, relazionali e affettivi di ogni proposta. Si alternano giochi genitore-figlio, gruppo genitori e gruppo figli, e gruppi misti.

### Tutti a scuola con lo Sport
*Categoria:* scolastico · *Modello:* vetrina · *Target:* scuola primaria, 6 – 11 anni
**Sottotitolo:** La nostra proposta per la scuola primaria
**Breve:** Integrazione motoria nella scuola primaria: gioco-sport, schemi motori e capacità coordinative nell'età d'oro dell'apprendimento.
**Lunga:** Tra i 5-6 e i 10-11 anni si colloca la fase più sensibile per lo sviluppo delle capacità coordinative e degli schemi motori. Il progetto porta nelle scuole primarie una formazione cognitivo-motoria di base che integra le leggi della psicocinetica alle regole dei giochi sportivi, senza separare l'aspetto tecnico dalla formazione della personalità. Il lavoro si articola su quattro elementi: strutturazione dello schema corporeo, sviluppo degli schemi motori di base, formazione delle capacità coordinative, crescita della sfera psico-sociale e affettiva. Le proposte si differenziano tra primo ciclo (6-7 anni) e secondo ciclo (8-11 anni). Tra i gioco-sport trattati: gioco-attrezzo, giocatletica, minibasket, gioco-pallamano, minivolley, minitennis, giochi con la palla, acrogym e, dove possibile, accompagnamento ai corsi di nuoto. Le lezioni si svolgono in orario curricolare, in presenza dell'insegnante scolastico, in palestre scolastiche o comunali. A conclusione del ciclo si può organizzare una manifestazione finale o una lezione aperta ai genitori. Per ogni attività non presente in elenco, l'associazione mette a disposizione istruttori preparati e insegnanti qualificati.

### Centri estivi
*Categoria:* extrascolastico · *Modello:* settimane · *Target:* dall'infanzia alla secondaria di primo grado
**Sottotitolo:** La nostra proposta per l'estate
**Breve:** Estate di sport, giochi, laboratori e uscite nelle province di Padova, Vicenza e Verona.
**Lunga:** Le giornate iniziano con l'accoglienza dalle 7:45 e proseguono fino alle 16:15, tra gioco libero e organizzato, attività sportive e laboratori creativi, con proposte differenziate per età e bambini seguiti a piccoli gruppi. Tra le attività: tiro con l'arco, escursioni, equitazione, piscina, giochi d'acqua, grandi tornei, giochi di aggregazione ispirati a temi sempre nuovi, laboratori di teatro, lingua straniera, manipolazione, pittura e cartapesta, con mostra finale dei lavori. A chiudere, una festa con mostra fotografica. È previsto il servizio mensa. L'équipe di animatori lavora insieme da oltre dieci anni: persone maggiorenni, insegnanti, allenatori ed educatori, selezionate e formate, che accompagnano i bambini dall'arrivo del mattino alla fine delle attività.

### Corsi fitness
*Categoria:* extrascolastico · *Modello:* periodo · *Target:* adulti
**Sottotitolo:** La nostra proposta per tenersi in forma
**Breve:** Zumba, ginnastica dolce e allungamento vertebrale: corsi per adulti, in palestra, vicino a casa.
**Lunga:** **Zumba** — un'attività dinamica a ritmo di musica per muoversi, divertirsi e restare in forma, tonificare il fisico e scaricare le tensioni della giornata in compagnia. La prima lezione di prova è gratuita. **Ginnastica dolce** — un mix di esercizi aerobici e di tonificazione che mantiene funzionali articolazioni e struttura muscolo-legamentosa e, attraverso il controllo della respirazione, allena cuore e polmoni. Serve solo un certificato medico e voglia di stare bene. **Allungamento vertebrale** — un corso di cinque incontri per capire come evitare i problemi legati all'uso scorretto della schiena e come gestire lombalgie, dorsalgie e cervicalgie con pochi esercizi quotidiani di scarico della colonna e semplici accorgimenti posturali. Per sapere se c'è un corso vicino a casa tua, scrivici.

### Doposcuola
*Categoria:* extrascolastico · *Modello:* periodo · *Target:* bambini in età scolare
**Sottotitolo:** Quando il tempo non è mai abbastanza arriviamo noi
**Breve:** Dal ritiro a scuola ai compiti del pomeriggio, un servizio costruito sulle esigenze di ogni territorio.
**Lunga:** Dopo dieci anni di esperienza nel territorio termale di Abano, prepariamo il servizio su misura del contesto in cui operiamo. Si parte dal ritiro dei bambini all'uscita da scuola, si prosegue con l'assistenza durante il pranzo e il momento di svago, poi con l'aiuto ai compiti pomeridiani e i laboratori, sia ludici sia sportivo-motori. Ogni progetto viene costruito insieme, in base alle necessità della famiglia o dell'amministrazione che lo richiede.

## Note per l'implementazione

- **Discrepanza col vecchio sito**: sul sito attuale la voce "Let's play together" rimanda alla pagina dell'allungamento vertebrale. Sono due cose diverse — un percorso genitori-figli e un corso fitness per adulti. Il catalogo segue il documento del cliente, non il sito.
- **Referenti** citati nel documento: Prof. Davide Vezzù e Prof.ssa Sandra Lazzarini. Non inserirli come dati di contatto pubblici senza conferma.
- I testi qui sopra sono **seed iniziale**. Prima della pubblicazione vanno rivisti da Davide dall'editor: il documento di origine contiene refusi e alcune informazioni datate (nomi di istruttori, giorni e sedi dei corsi).

## Regole di consegna

Un sotto-task alla volta, `npx tsc --noEmit`, `npm run build`, `npm run lint` a ogni chiusura, riepilogo con file modificati, SQL delle migrazioni da applicare su Lovable, caselle spuntate in `PIANO_LAVORI.md`, regressioni escluse (iscrizioni centri estivi, registro, cassa e URL esistenti invariati). Mai push.
