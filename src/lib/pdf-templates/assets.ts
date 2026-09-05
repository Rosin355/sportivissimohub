// Template dei moduli cartacei, incorporati nel bundle server come data URL
// (il Worker non ha filesystem). Importare SOLO da codice eseguito nelle
// server function: il file pesa ~1 MB e non deve finire nel bundle client.
import galzignano2026DataUrl from "../../../assets/pdf-templates/galzignano-2026.pdf?inline";
// Logo Sportivissimo per l'intestazione dei PDF puliti (ricavato dal modulo
// ufficiale; sostituibile con un file a risoluzione maggiore, stesso nome).
import sportivissimoLogoDataUrl from "../../../assets/pdf-templates/logo-sportivissimo.png?inline";

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const comma = dataUrl.indexOf(",");
  const binary = atob(comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

let galzignanoCache: Uint8Array | undefined;
let logoCache: Uint8Array | undefined;

export function loadSportivissimoLogo(): Uint8Array {
  if (!logoCache) logoCache = dataUrlToBytes(sportivissimoLogoDataUrl);
  return logoCache;
}

export function loadGalzignano2026Template(): Uint8Array {
  if (!galzignanoCache) galzignanoCache = dataUrlToBytes(galzignano2026DataUrl);
  return galzignanoCache;
}
