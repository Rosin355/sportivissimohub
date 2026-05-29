## Aggiustamenti finali hero banner

### 1. Ridurre altezza della hero
- Sostituire `h-screen min-h-[640px]` con un'altezza più contenuta (es. `min-h-[520px] h-[70vh] max-h-[700px]`)
- L'immagine deve adattarsi proporzionalmente alla nuova altezza (`object-cover`, `object-position` centrato o a destra)

### 2. Ingrandire il testo e i bottoni
- Titolo: aumentare da `text-4xl md:text-5xl lg:text-6xl` a `text-5xl md:text-6xl lg:text-7xl`
- Sottotitolo: da `text-lg` a `text-xl` o `text-2xl`
- Bottoni: ingrandire padding e testo (`text-lg` → `text-xl`, `px-7 py-3.5` → `px-8 py-4`)
- Spaziatura tra elementi (`mt-5`, `mt-8`) da incrementare leggermente per bilanciare il testo più grande

### 3. Verifica responsive
- Assicurarsi che su mobile il layout resti leggibile con i font ingranditi
- Il blocco testo rimane allineato a sinistra sul cielo azzurro dell'immagine

### File toccato
- `src/components/site/HeroGameSection.tsx`