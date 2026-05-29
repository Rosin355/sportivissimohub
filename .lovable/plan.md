## Sistemare il banner contatori

**Problema:** il banner stats (`-mt-24`) si sovrappone ai bottoni CTA della hero, coprendo "Scopri i centri".

### Modifiche a `src/components/site/HeroGameSection.tsx`

1. **Rimuovere la sovrapposizione**: cambiare `-mt-24` in un margine positivo (es. `mt-12 md:mt-16`) così il banner si posiziona sotto la hero senza coprire i bottoni.
2. **Mantenere l'effetto "card che galleggia"**: conservare `rounded-[2rem]`, ombra e bordo attuali.
3. **Allineare width al contenuto hero**: portare `max-w-5xl` → `max-w-6xl` per coerenza con il contenitore della hero.
4. **Migliorare padding interno responsive**: `p-8` → `p-6 md:p-8` per evitare contenuto troppo stretto su mobile.
5. **Spaziatura sotto**: aggiungere `mb-12` per separare dalla sezione successiva.

Nessun'altra modifica alla hero o ai testi/bottoni (già approvati).
