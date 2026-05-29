## Obiettivo
Allineare la hero al mockup 2: nuova illustrazione con effetto mask a curva morbida in basso, e dare più respiro alla pill "I nostri servizi".

## Modifiche

### 1. Nuova immagine hero
- Copiare `user-uploads://hero_home_image-2.png` in `src/assets/hero-home.png`.
- In `HeroGameSection.tsx` sostituire l'import `heroImg` con il nuovo asset.

### 2. Effetto mask curvo sull'immagine (come mockup)
Nel mockup l'immagine occupa il lato destro con un bordo curvo morbido in basso/sinistra che la "ritaglia" sopra lo sfondo bianco della pagina, sotto la card stats.

Implementazione in `HeroGameSection.tsx`:
- Wrapper immagine: rendere il contenitore destro più ampio (full bleed verso destra) con `clip-path` CSS per creare la curva morbida in basso a sinistra:
  ```
  style={{ clipPath: "ellipse(120% 95% at 75% 5%)" }}
  ```
  oppure usare un SVG mask con curva concava in basso. Tuning della curva fino a corrispondere al mockup.
- L'immagine `object-cover` per riempire tutto il box mascherato senza spazi bianchi.
- Sfondo sezione: cambiare `bg-gradient-hero` in bianco/quasi bianco per matchare il mockup 2 (no celeste pieno sotto). Il celeste rimane solo dentro l'immagine.

### 3. Spaziatura pill "I nostri servizi"
In `src/routes/index.tsx`, componente `SectionTitle`:
- Aggiungere padding orizzontale maggiore alla pill: da `px-3 py-1` a `px-4 py-1.5` (o `px-5`) per dare più respiro al testo.

### 4. Nessuna altra modifica
- Testi, link, CTA, stats, logica: invariati.
- Altre sezioni: invariate.

## Risultato atteso
Hero identica al mockup 2: illustrazione nuova con bordo curvo morbido in basso, sfondo pagina pulito, pill servizi con padding più generoso.
