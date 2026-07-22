## Obiettivo
Portare in Lovable Cloud tutto il backend già scritto nel repo, senza toccare il frontend né aggiungere nuove migrazioni.

## Passi

1. **Migrazione 1 — `20260722000001_auth_profiles.sql`**
   Propongo il contenuto integrale (enum `app_role`, tabelle `profiles` e `user_roles`, funzione `has_role`, trigger `handle_new_user`, RLS + policy) nel blocco SQL per la tua approvazione. Applico solo dopo il tuo OK.

2. **Migrazione 2 — `20260722000002_core_schema.sql` (in due parti)**
   Il file originale contiene sia DDL/RLS sia la creazione del bucket storage. Le API di Lovable Cloud non accettano `INSERT INTO storage.buckets` dentro una migrazione, quindi lo spezzo — il contenuto SQL resta identico a quello del file, solo diviso:
   - **2a**: enum (`enrollment_status`, `document_status`, `payment_status`), tabelle `children`, `enrollments`, `pickup_delegates`, `enrollment_documents`, `audit_log`, trigger `updated_at`, generatore `code`, tutte le RLS/policy delle tabelle public.
   - **2b (dopo il passo 3)**: solo le 4 policy su `storage.objects` per il bucket `documents`.

3. **Bucket `documents`**
   Creato via tool dedicato (`storage_create_bucket`) come privato. Poi verifico che esista e applico 2b con le policy di accesso (genitore legge/carica/elimina i propri file sotto `{uid}/…`, admin legge tutto).

4. **Migrazione 3 — `20260722000003_attendance.sql`**
   Tabella `attendance` con RLS e policy staff/admin, proposta integrale per approvazione.

5. **Edge function `send-transactional-email`**
   Deploy così com'è da `supabase/functions/send-transactional-email/`. Nessuna modifica al codice.
   Nota: i secret `RESEND_API_KEY` e `EMAIL_FROM` non risultano configurati — te li chiederò con `add_secret` dopo il deploy (senza di essi la funzione risponde 500).

6. **Database Webhook su `enrollments`**
   Non esiste un tool Lovable per creare Database Webhooks a livello di API Supabase. Non posso configurarlo automaticamente. Ti fornirò le istruzioni precise (endpoint della edge function, header, eventi `INSERT`/`UPDATE`, tabella `public.enrollments`) e lo dovrai creare a mano nella dashboard Supabase — oppure, se preferisci, posso proporre in alternativa un trigger DB via `pg_net` come migrazione aggiuntiva (ma esce dal vincolo "nessuna nuova migrazione", quindi lo faccio solo se me lo confermi).

7. **Riepilogo finale**
   Al termine elenco: tabelle create, policy RLS attive per tabella, bucket + policy storage, edge function deployata, stato secret, stato webhook.

## Vincoli rispettati
- Nessun file frontend toccato.
- Nessuna migrazione nuova creata sotto `supabase/migrations/` — le SQL applicate sono quelle esistenti (la sola divisione della #2 è per compatibilità con l'API bucket, contenuto invariato).
- Edge function deployata as-is.

Confermi per procedere con la migrazione 1?