## Obiettivo
Allineare la hero al riferimento: immagine grande che occupa ~metà schermo, attaccata al bordo destro senza padding, e blocco testo/CTA ben allineato al contenitore della pagina.

## Modifiche a `src/components/site/HeroGameSection.tsx`

1. **Rimuovere il `max-w-[1600px] mx-auto` dalla `<section>`** e togliere il padding orizzontale destro, così l'immagine può toccare il bordo viewport.
   - Nuovo wrapper: `<section className="relative pt-8 pb-32">` con un contenitore interno solo per il testo.

2. **Struttura a due colonne full-width:**
   ```
   <div class="grid lg:grid-cols-2 items-center">
     <div class="pl-6 lg:pl-12 xl:pl-24 max-w-[640px] ml-auto w-full"> testo </div>
     <div class="w-full"> <img class="w-full h-auto" /> </div>
   </div>
   ```
   - Colonna sinistra: padding-left coerente con la nav, contenuto ancorato a destra della colonna così risulta allineato verticalmente con il logo "Sportivissimo" della navbar (asse a ~`max-w-[1400px]` centrato).
   - Colonna destra: nessun padding, immagine `w-full h-auto` che riempie tutta la metà destra fino al bordo viewport (padding-right = 0).

3. **Immagine:**
   - `object-contain` con `object-right`, altezza naturale per occupare l'intera metà.
   - Rimuovere i margini negativi (`-mr-12 xl:-mr-24`) ora superflui.

4. **Testo e CTA:**
   - Mantenere le dimensioni attuali (h1 `text-4xl md:text-5xl lg:text-6xl`, p `text-lg`, bottoni `px-7 py-3.5 text-lg`) che già stanno nel viewport.
   - Allineare la colonna sinistra alla stessa griglia della navbar/footer (`max-w-[1400px]` centrato) usando `ml-auto` sulla card di testo dentro la metà sinistra.

5. **Mobile (`<lg`):** layout una colonna, immagine sotto al testo a tutta larghezza, padding orizzontale standard.

## Stats banner
Resta invariato (già centrato con `max-w-5xl mx-auto -mt-24`).

## File toccati
- `src/components/site/HeroGameSection.tsx` (solo markup/classi)
