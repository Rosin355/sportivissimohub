## Obiettivo
Ridisegnare la sezione hero (prima sezione della homepage) in modo che corrisponda esattamente al mockup allegato, mantenendo testi, link e logica invariati.

## Differenze tra l'attuale e il mockup

**Attuale**
- Immagine hero racchiusa in una card con bordi arrotondati e ombra, dentro una griglia 2 colonne.
- Pill "Stagione 2026 aperta!" sopra il titolo.
- Pulsante primario arancione/scuro con stile `shadow-pop`, secondario con bordo grigio.
- Card statistiche bianca, centrata, larga max-2xl, badge colorati piccoli con icone quadrate.

**Mockup (target)**
- Nessuna pill sopra il titolo: si parte direttamente con l'H1.
- Immagine hero **a tutta altezza sul lato destro**, senza card/ombra/bordi: si fonde col background (sky → erba verde), come illustrazione full-bleed.
- Pulsante primario blu navy pieno arrotondato (pill), pulsante secondario bianco con bordo blu navy, entrambi pill (rounded-full).
- Card statistiche **a tutta larghezza del container**, bianca con bordi arrotondati grandi, divisori verticali sottili tra le 3 stat, icone cerchio più grandi, numeri grandi in display bold + label sotto in muted.
- Stats: "1.200+ famiglie che ci scelgono" / "10 sedi nel Veneto" / "12 anni di esperienza" — numero su riga grande, descrizione su riga sotto.

## Modifiche

### `src/components/site/HeroGameSection.tsx`
1. Rimuovere la pill "Stagione 2026 aperta!".
2. Immagine destra: rimuovere wrapper `rounded-2xl overflow-hidden shadow-pop`; renderla full-bleed che esce verso destra (overflow visibile, oggetto contain in basso). Mantenere `heroImg`.
3. Pulsanti CTA: 
   - Primario: `rounded-full bg-primary text-primary-foreground` (blu navy), padding ampio, freccia a destra.
   - Secondario: `rounded-full bg-white border-2 border-primary text-primary`, con icona `MapPin` rossa/arancione.
4. Card statistiche: 
   - Larghezza piena del container (no `max-w-2xl`).
   - Layout: 3 colonne con `divide-x` per i separatori verticali.
   - Ogni stat: icona cerchio colorata (più grande, ~w-12 h-12) a sinistra + colonna testo con numero grande (font-display, text-3xl/4xl bold) e label piccola muted sotto.
   - Posizionata sotto, con leggero overlap sull'immagine (z-10, margine negativo).

### Nessun altro file modificato
- `SiteNav.tsx`, link, route, dati: invariati.
- Testi: invariati ("Dove gioco, sport e crescita diventano avventura", paragrafo, CTA labels, stats).
- Token colore: usare quelli esistenti in `styles.css` (primary, flame, grass, sun). Nessun colore custom inline.

## Risultato atteso
Hero visivamente identica al mockup: titolo grande a sinistra, illustrazione full-bleed a destra che si fonde con lo sfondo, due CTA pill (blu pieno + bianco bordato), card stats a tutta larghezza con 3 colonne separate da divisori.
