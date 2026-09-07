# Sportivissimo — Product Requirements Document

**Versione:** 1.0  
**Stato:** Design e consolidamento frontend  
**Prodotto:** Piattaforma web per centri estivi, doposcuola, progetti scolastici e corsi  
**Brand:** Sportivissimo A.S.D.

---

## 1. Visione del prodotto

Sportivissimo è una piattaforma digitale dedicata alla promozione e alla gestione di attività sportive, educative e ricreative rivolte a bambini, ragazzi, famiglie, scuole e adulti.

Il prodotto deve unire due anime:

1. **Sito pubblico**, capace di spiegare l’offerta, trasmettere fiducia e accompagnare le famiglie verso la scelta di una sede o l’iscrizione.
2. **Area operativa**, dedicata a genitori, staff e amministratori, nella quale gestire iscrizioni, dati, documenti, consensi e attività organizzative.

La nuova esperienza visiva deve apparire luminosa, rassicurante, sportiva e professionale, senza alterare i flussi e la logica applicativa già esistenti.

---

## 2. Obiettivi

### Obiettivi principali

- Rendere immediatamente comprensibile l’offerta Sportivissimo.
- Aumentare le conversioni verso iscrizione e ricerca delle sedi.
- Comunicare sicurezza, organizzazione e qualità educativa.
- Offrire una UI coerente tra homepage, pagine pubbliche e aree riservate.
- Conservare integralmente logica, dati, validazioni, autenticazione e flussi esistenti.
- Costruire un design system riutilizzabile ed estendibile.

### Obiettivi secondari

- Migliorare accessibilità e leggibilità.
- Garantire una resa responsive di qualità.
- Ottimizzare immagini e animazioni decorative.
- Ridurre duplicazioni di componenti e stili.
- Preparare una base chiara per le evoluzioni future.

---

## 3. Pubblico

### Genitori

Devono comprendere rapidamente:

- quali attività sono disponibili;
- dove si svolgono;
- per quali fasce d’età;
- quanto è semplice iscriversi;
- come vengono gestiti sicurezza, documenti e comunicazioni.

### Bambini e ragazzi

Devono percepire:

- divertimento;
- amicizia;
- movimento;
- scoperta;
- piccole conquiste personali.

### Scuole

Devono trovare:

- progetti educativi e sportivi;
- percorsi personalizzabili;
- informazioni organizzative;
- contatti chiari.

### Adulti

Devono poter scoprire corsi dedicati, tra cui attività come ginnastica dolce.

### Staff e amministratori

Devono continuare a utilizzare strumenti chiari, efficienti e coerenti con il brand, senza un’estetica eccessivamente giocosa.

---

## 4. Proposta di valore

**Sportivissimo trasforma sport, educazione e crescita in un’avventura sicura, organizzata e coinvolgente.**

Pilastri del prodotto:

- esperienza;
- sicurezza;
- semplicità;
- trasparenza;
- crescita;
- movimento;
- inclusione;
- rapporto con famiglie e scuole.

---

## 5. Ambito del redesign

Il redesign non deve modificare il comportamento del prodotto.

### Da preservare

- routing;
- autenticazione;
- ruoli e permessi;
- logica amministrativa;
- iscrizioni;
- validazioni;
- caricamento documenti;
- consensi;
- chiamate API;
- integrazioni backend;
- database;
- modelli dati;
- stato applicativo;
- eventuali flussi di pagamento o conferma già esistenti.

### Modifiche consentite

- layout;
- componenti visivi;
- tipografia;
- colori;
- spaziature;
- icone;
- immagini;
- responsive design;
- accessibilità;
- animazioni non funzionali;
- organizzazione dei componenti UI, purché non ne alteri il comportamento.

---

## 6. Architettura informativa

### Navigazione principale

- Centri Estivi
- Come funziona
- Genitori
- Staff
- Admin
- Iscriviti ora

Le destinazioni esistenti devono essere riutilizzate senza cambiare gli URL, salvo problemi già documentati nel progetto.

### Pagine da armonizzare

- Homepage
- Centri Estivi
- Doposcuola
- Progetti per le Scuole
- Corsi e Attività
- Dettaglio sede
- Genitori
- Staff
- Login
- Iscrizione
- Area genitore
- Area staff
- Area amministrativa

---

## 7. Homepage

### 7.1 Header

- logo Sportivissimo a sinistra;
- navigazione centrale;
- CTA arancione “Iscriviti ora”;
- comportamento responsive;
- menu mobile accessibile;
- eventuale stato sticky discreto;
- focus states visibili.

### 7.2 Hero

**Titolo:**  
“Dove gioco, sport e crescita diventano avventura”

La parola “avventura” deve essere evidenziata in arancione con accento grafico giallo.

**Descrizione:**  
“Centri estivi, doposcuola e attività educative per bambini e ragazzi in un ambiente sicuro, professionale e pieno di entusiasmo.”

**CTA:**

- Iscrivi tuo figlio
- Scopri i centri

L’illustrazione deve apparire sulla destra, contenuta in una forma organica con taglio inferiore curvo.

### 7.3 Statistiche

- 1.200+ famiglie che ci scelgono
- 10 sedi nel Veneto
- 12 anni di esperienza

I dati dovranno essere resi configurabili o collegati alle fonti esistenti, evitando duplicazioni arbitrarie.

### 7.4 Servizi

Quattro card:

#### Centri Estivi
Giornate di sport, giochi, laboratori e uscite alla scoperta di nuove passioni.

#### Doposcuola
Supporto allo studio e attività sportive per crescere insieme, ogni pomeriggio.

#### Progetti per le Scuole
Percorsi educativi e sportivi su misura per scuole di ogni ordine e grado.

#### Corsi e Attività
Corsi sportivi e attività educative durante tutto l’anno per ogni età.

La card “Corsi e Attività” deve poter rappresentare anche corsi per adulti, come ginnastica dolce.

### 7.5 Come funziona

Cinque passaggi:

1. Scegli la sede.
2. Aggiungi i dati del bambino.
3. Carica documenti e consensi.
4. Conferma l’iscrizione.
5. Vivi l’avventura.

Questa sezione spiega visivamente il flusso, ma non sostituisce né modifica il flusso applicativo reale.

### 7.6 Perché piace ai bambini

- Divertimento
- Squadra
- Movimento
- Piccole conquiste

Ogni card comprende icona, titolo, breve testo e illustrazione inferiore.

### 7.7 Perché piace ai genitori

- Iscrizione semplice
- Comunicazioni chiare
- Documenti al sicuro
- Sicurezza prima di tutto
- Organizzazione trasparente
- Esperienza vera

### 7.8 CTA finale

Titolo:

“Pronto per una nuova avventura?”

Contenuto:

- bambino a sinistra con zaino e pollice alzato;
- bambina a destra con pallone da basket e mano alzata;
- coriandoli;
- CTA iscrizione;
- CTA scoperta centri;
- animazioni leggere e opzionali;
- rispetto di `prefers-reduced-motion`.

### 7.9 Footer

- logo;
- descrizione;
- contatti;
- link utili;
- informazioni;
- newsletter;
- social;
- Privacy Policy;
- Cookie Policy;
- dati legali.

I contenuti reali del progetto devono prevalere sui placeholder del mockup.

---

## 8. Design system

### Palette

- Blu primario: autorevole, sportivo e rassicurante.
- Arancione: CTA ed energia.
- Verde: crescita, sedi e collaborazione.
- Giallo: conquista, esperienza e positività.
- Bianco e azzurro molto chiaro: fondi.
- Blu notte: footer e aree ad alta enfasi.

I colori esatti devono essere centralizzati in token CSS o nel sistema di tema esistente.

### Tipografia

- sans serif moderna;
- titoli morbidi ma solidi;
- corpo testo leggibile;
- pesi limitati e coerenti;
- contrasto conforme alle buone pratiche WCAG.

### Componenti riutilizzabili

Da creare o consolidare:

- `MarketingPageLayout`
- `SectionHeader`
- `PrimaryButton`
- `SecondaryButton`
- `IconBadge`
- `StatItem`
- `ServiceCard`
- `StepItem`
- `BenefitCard`
- `ParentBenefitItem`
- `CTASection`
- `SiteHeader`
- `SiteFooter`
- `PageHero`
- `EmptyState`
- `FormSection`
- `DataCard`

I nomi possono essere adattati alle convenzioni reali del repository.

---

## 9. Immagini e animazioni

### Asset previsti

- hero principale;
- quattro illustrazioni servizi;
- quattro illustrazioni benefici bambini;
- personaggio CTA sinistra;
- personaggio CTA destra.

### Requisiti tecnici

- WebP o AVIF dove appropriato;
- fallback PNG se serve trasparenza;
- dimensioni responsive;
- `alt` descrittivo;
- lazy loading sotto la piega;
- evitare immagini remote instabili;
- nessun testo incorporato nelle immagini;
- trasparenza reale per i personaggi CTA.

### Animazioni

Le animazioni dei personaggi devono essere:

- brevi;
- in loop;
- non invasive;
- coerenti con l’immagine originale;
- senza morphing del volto;
- senza variazioni di abiti o colori;
- disattivabili con `prefers-reduced-motion`.

---

## 10. Responsive design

### Desktop

- hero a due colonne;
- griglie complete;
- stepper orizzontale;
- CTA con personaggi ai lati;
- footer multicolonna.

### Tablet

- griglie 2×2;
- hero ridimensionato;
- stepper adattato;
- footer semplificato.

### Mobile

- hero verticale;
- CTA impilate;
- card a una colonna;
- timeline verticale;
- menu mobile;
- nessun overflow orizzontale;
- target touch adeguati;
- immagini che non coprano testi o controlli.

---

## 11. Accessibilità

- semantica HTML corretta;
- navigazione da tastiera;
- focus visibile;
- contrasto adeguato;
- `aria-label` dove necessario;
- menu mobile accessibile;
- testi alternativi;
- rispetto di `prefers-reduced-motion`;
- errori form comprensibili;
- nessuna informazione affidata solo al colore.

---

## 12. SEO e performance

Preservare l’implementazione SEO esistente.

Verificare:

- title e meta description;
- gerarchia H1–H3;
- canonical;
- Open Graph;
- dati strutturati se presenti;
- immagini ottimizzate;
- layout shift ridotto;
- caricamento font;
- code splitting;
- assenza di dipendenze superflue;
- Core Web Vitals.

---

## 13. Aree riservate e amministrative

Le aree operative devono usare lo stesso brand, ma con un tono più funzionale.

Principi:

- superfici pulite;
- tabelle leggibili;
- form ordinati;
- stati chiari;
- gerarchia visiva;
- meno illustrazioni;
- uso contenuto dei colori;
- nessuna modifica a ruoli, permessi o logica.

---

## 14. Criteri di accettazione

### Visuali

- La homepage segue fedelmente il concept approvato.
- Tutte le sezioni hanno spaziatura, tipografia e componenti coerenti.
- Gli asset sono integrati correttamente.
- Le pagine pubbliche sembrano parte dello stesso prodotto.

### Funzionali

- Nessun flusso esistente è stato alterato.
- Tutte le route continuano a funzionare.
- Form e validazioni mantengono il comportamento precedente.
- Auth, ruoli e dashboard restano operativi.
- Non ci sono regressioni backend.

### Tecnici

- Build completata con successo.
- Typecheck completato.
- Test esistenti superati.
- Nessun errore console rilevante.
- Nessun overflow alle viewport principali.
- Nessuna nuova dipendenza non necessaria.

---

## 15. Task ancora da completare

La lista va verificata rispetto allo stato reale del repository.

### Priorità alta

- [ ] Analizzare stack, struttura, route e flussi esistenti.
- [ ] Identificare homepage e componenti attualmente utilizzati.
- [ ] Salvare una baseline visuale e funzionale prima del redesign.
- [ ] Definire token di colore, spaziatura, radius, ombre e tipografia.
- [ ] Implementare header responsive.
- [ ] Implementare hero con taglio organico corretto.
- [ ] Integrare gli asset definitivi.
- [ ] Implementare statistiche, servizi, timeline e benefit.
- [ ] Implementare CTA finale con personaggi trasparenti.
- [ ] Implementare footer con contenuti reali.
- [ ] Verificare che iscrizione, autenticazione e area admin non abbiano regressioni.
- [ ] Eseguire build, typecheck e test.

### Priorità media

- [ ] Uniformare tutte le pagine pubbliche.
- [ ] Creare layout e componenti condivisi.
- [ ] Uniformare form, input, errori e stati vuoti.
- [ ] Migliorare responsive tablet e mobile.
- [ ] Ottimizzare immagini e lazy loading.
- [ ] Implementare animazioni leggere dei personaggi CTA.
- [ ] Aggiungere gestione `prefers-reduced-motion`.
- [ ] Eseguire audit accessibilità.
- [ ] Eseguire audit SEO e metadati.

### Priorità successiva

- [ ] Rifinire area genitori.
- [ ] Rifinire area staff.
- [ ] Rifinire area amministrativa.
- [ ] Centralizzare i contenuti modificabili.
- [ ] Verificare analytics e tracking conversioni.
- [ ] Aggiungere test visuali o screenshot regression.
- [ ] Documentare il design system.
- [ ] Preparare linee guida per nuove pagine e asset.

---

## 16. Elementi da verificare nel repository

Claude Code deve confermare, senza presumere:

- framework e versione;
- sistema CSS;
- libreria icone;
- routing;
- backend;
- autenticazione;
- ruoli;
- pagine esistenti;
- flusso di iscrizione;
- gestione documenti;
- presenza di pagamenti;
- posizione degli asset;
- contenuti reali;
- comandi di build, lint e test;
- convenzioni del repository.

---

## 17. Fuori ambito

Salvo richiesta esplicita:

- modifica schema database;
- sostituzione backend;
- modifica ruoli;
- rifacimento autenticazione;
- modifica regole di business;
- nuovi sistemi di pagamento;
- migrazione completa di stack;
- introduzione di un nuovo CMS;
- riscrittura dell’app da zero.

---

## 18. Strategia di consegna

Procedere per milestone:

1. Audit del progetto.
2. Fondazioni del design system.
3. Homepage.
4. Verifica funzionale.
5. Pagine pubbliche.
6. Aree riservate.
7. Accessibilità, SEO e performance.
8. QA finale e documentazione.

Ogni milestone deve concludersi con:

- riepilogo file modificati;
- motivazione delle modifiche;
- controlli eseguiti;
- regressioni escluse;
- task residui.
