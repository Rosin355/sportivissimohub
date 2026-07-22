# Supabase — istruzioni operative

## Applicare le migrazioni

Con la CLI Supabase (consigliato):

```bash
supabase link --project-ref <PROJECT_REF>
supabase db push
```

In alternativa: incolla i file di `migrations/` **in ordine** nel SQL Editor del
dashboard Supabase ed eseguili.

## Variabili d'ambiente dell'app

Copia `.env.example` in `.env` nella root del repo e compila:

- `VITE_SUPABASE_URL` — Project Settings → API → Project URL
- `VITE_SUPABASE_ANON_KEY` — Project Settings → API → anon public key

Mai usare la service key nel codice dell'app.

## Primo admin

I nuovi utenti registrati ricevono automaticamente il ruolo `genitore`.
Il primo admin si assegna a mano dal SQL Editor:

```sql
insert into public.user_roles (user_id, role)
values ('<UUID-utente-da-auth.users>', 'admin');
```

Stessa cosa per lo staff, con `'staff'`.

## Edge Function email (M7)

La funzione `send-transactional-email` usa Resend. Configura il secret:

```bash
supabase secrets set RESEND_API_KEY=<chiave> EMAIL_FROM="Sportivissimo <noreply@tuodominio.it>"
supabase functions deploy send-transactional-email
```
