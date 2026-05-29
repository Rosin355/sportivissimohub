## Sostituire le illustrazioni delle card servizi

Nella home (`src/routes/index.tsx`) le 4 card servizi mostrano icone Lucide (palla, penna, persone, grafico) come illustrazione di sfondo. Le sostituiamo con le 4 immagini caricate, abbinate per nome al servizio corrispondente.

### Mappatura
| Card servizio | Immagine caricata |
|---|---|
| Centri Estivi | `centri estivi.png` |
| Doposcuola | `dopo scuola.png` |
| Progetti per le Scuole | `Progetti per le Scuole.png` |
| Corsi e Attività | `Corsi e Attività.png` |

### Modifiche

1. **Copiare le 4 immagini** in `src/assets/` con nomi normalizzati:
   - `src/assets/service-centri-estivi.png`
   - `src/assets/service-doposcuola.png`
   - `src/assets/service-progetti-scuole.png`
   - `src/assets/service-corsi-attivita.png`

2. **`src/routes/index.tsx`**:
   - Importare le 4 immagini come moduli ES6.
   - Nell'array `services`, sostituire i campi `illo` (icona Lucide) e `illoColor` con un campo `img` (URL importato).
   - Nel rendering della card, sostituire l'`<s.illo>` con un `<img src={s.img} alt={s.title} />` che riempie la tile inferiore (`object-cover`, `w-full h-full`, `absolute inset-0`) così l'immagine si adatta bene allo slot da `h-48`.
   - Rimuovere il padding `pb-4` dal contenitore tile e il `flex items-end justify-center` (non più necessari con immagine full-bleed); mantenere `rounded` e `overflow-hidden` (già garantito dal wrapper della card).

3. **Tinte di sfondo (`s.tile`)**: restano invariate come fallback sotto l'immagine (bordi/transizioni). L'immagine copre interamente l'area quindi non si vedrà, ma manteniamo la classe per evitare flash durante il caricamento.

Nessun'altra modifica alla home, alla hero o ad altre sezioni.
