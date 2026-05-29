## Ridurre altezza card servizi e sfumare il taglio superiore delle immagini

In `src/routes/index.tsx`, nelle 4 card servizi:

1. **Altezza immagine**: ridurre la tile da `h-48` a `h-40` (riduzione di ~32px) per card più compatte.

2. **Sfumatura superiore dell'immagine**: aggiungere un overlay con gradiente bianco→trasparente sopra l'immagine per eliminare il taglio netto orizzontale che si vede tra il blocco testo bianco e l'inizio della tinta di sfondo dell'immagine.
   - Aggiungere un `<div>` posizionato `absolute inset-x-0 top-0 h-12` con `bg-gradient-to-b from-white to-transparent pointer-events-none z-10` dentro il contenitore della tile, sopra l'`<img>`.
   - Questo crea una dissolvenza morbida nella parte alta dell'immagine senza modificare il resto.

3. **Spaziatura**: ridurre leggermente `mt-6` del contenitore tile a `mt-4` per bilanciare la nuova altezza ridotta.

Nessun'altra modifica al layout, alle dimensioni del testo o agli altri elementi della pagina.
