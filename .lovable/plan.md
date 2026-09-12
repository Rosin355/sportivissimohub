# Applicazione delle due migrazioni caricate

Applico il contenuto SQL dei due file esattamente com'è, in ordine di data. Nessuna migrazione scritta da me, nessuna modifica al codice dell'app.

## Ordine

1. `20260907120000_signatures.sql` — firma elettronica dei moduli
   - tipo `signer_role`, tabella `enrollment_signatures` (append-only) con indice e vincoli
   - RLS: il genitore legge/inserisce solo sulle proprie iscrizioni, l'admin legge tutto
   - grant a `authenticated`
   - funzione `log_enrollment_signature` (security definer, idempotente) che scrive la voce in `audit_log`
   - ricreazione della policy di storage "genitore elimina i propri file": i file nella cartella `firme` non sono più eliminabili

2. `20260912100000_m11_1_registro_sede.sql` — registro di sede
   - nuovi tipi: categorie/fasce di frequenza, addebiti extra, metodo di pagamento, movimenti di cassa, marcatura presenza, stato ordine pasti
   - nuove tabelle: `location_frequency_codes`, `enrollment_week_codes`, `extra_charges`, `payments`, `cash_movements`, `staff_attendance`, `daily_meals`
   - nuova colonna `attendance.mark` (nullable, non tocca le righe esistenti)
   - trigger di validazione e di immutabilità, funzione `location_registry_totals` (solo admin)
   - RLS e grant su tutte le nuove tabelle
   - popolamento iniziale incluso nel file: gli 8 codici di frequenza standard per ogni sede e le celle settimana/codice derivate dalle iscrizioni esistenti

## Note tecniche

- Il file delle firme contiene un `drop policy if exists` sulla policy di eliminazione dei file del bucket `documents`, subito ricreata nella versione più restrittiva: è parte del file, la applico senza modifiche.
- Il file del registro include istruzioni `insert` di popolamento: restano nel file così com'è, come previsto dalla migrazione.
- Se una delle due fallisce, mi fermo e ti riporto l'errore esatto senza correggere nulla di mia iniziativa.
- Al termine: elenco tabelle create, policy RLS attive e funzioni aggiunte.
