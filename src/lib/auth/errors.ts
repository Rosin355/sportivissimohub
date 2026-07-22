// Mappatura errori Supabase Auth → messaggi italiani utente-friendly.
// Sorgenti: error.code (nuovi SDK), status HTTP, error.message (fallback regex).

export type AuthErrorKind =
  | "invalid_credentials"
  | "email_not_confirmed"
  | "email_exists"
  | "weak_password"
  | "password_requirements"
  | "rate_limit"
  | "network"
  | "session_missing"
  | "same_password"
  | "invalid_email"
  | "unknown";

export type MappedAuthError = { kind: AuthErrorKind; message: string };

const MESSAGES: Record<AuthErrorKind, string> = {
  invalid_credentials: "Email o password non corretti.",
  email_not_confirmed:
    "Conferma la tua email prima di accedere: controlla la casella di posta.",
  email_exists:
    "Questa email è già registrata. Prova ad accedere o recupera la password.",
  weak_password:
    "Questa password è comparsa in violazioni di dati note, scegline un'altra.",
  password_requirements: "La password non rispetta i requisiti indicati.",
  rate_limit: "Troppi tentativi, attendi qualche minuto.",
  network: "Problema di connessione: controlla la rete e riprova.",
  session_missing: "Sessione scaduta o mancante. Accedi di nuovo.",
  same_password: "La nuova password deve essere diversa da quella attuale.",
  invalid_email: "Indirizzo email non valido.",
  unknown: "Si è verificato un errore. Riprova tra qualche istante.",
};

type AnyError =
  | {
      message?: string;
      code?: string;
      status?: number;
      name?: string;
    }
  | string
  | null
  | undefined;

function classify(err: AnyError): AuthErrorKind {
  if (!err) return "unknown";
  const obj = typeof err === "string" ? { message: err } : err;
  const code = (obj.code ?? "").toLowerCase();
  const msg = (obj.message ?? "").toLowerCase();
  const status = obj.status;

  // Codici ufficiali Supabase Auth.
  if (code === "invalid_credentials") return "invalid_credentials";
  if (code === "email_not_confirmed") return "email_not_confirmed";
  if (code === "user_already_exists" || code === "email_exists") return "email_exists";
  if (code === "weak_password" || code === "pwned_password") return "weak_password";
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit")
    return "rate_limit";
  if (code === "same_password") return "same_password";
  if (code === "validation_failed" && /password/.test(msg)) return "password_requirements";

  // Rete / offline / fetch fallito.
  if (
    obj.name === "AuthRetryableFetchError" ||
    /failed to fetch|networkerror|network request failed/.test(msg)
  )
    return "network";

  // Fallback su regex per SDK/versioni che non popolano code.
  if (/invalid login credentials/.test(msg)) return "invalid_credentials";
  if (/email not confirmed/.test(msg)) return "email_not_confirmed";
  if (/already registered|already exists|user already/.test(msg)) return "email_exists";
  if (/pwned|compromised|data breach/.test(msg)) return "weak_password";
  if (/password.*(short|least|characters|requirements|weak)/.test(msg))
    return "password_requirements";
  if (status === 429 || /rate limit|too many requests/.test(msg)) return "rate_limit";
  if (/auth session missing/.test(msg)) return "session_missing";
  if (/same password|new password should be different/.test(msg)) return "same_password";
  if (/unable to validate email|invalid.*email/.test(msg)) return "invalid_email";

  return "unknown";
}

export function mapAuthError(err: AnyError): MappedAuthError {
  const kind = classify(err);
  if (kind === "unknown" && err) {
    // Logga il codice originale per il debug quando è ignoto.
    const obj = typeof err === "string" ? { message: err } : err;
    console.warn("[auth] unmapped error", {
      code: obj.code,
      status: obj.status,
      message: obj.message,
    });
  }
  return { kind, message: MESSAGES[kind] };
}