import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { EnrollmentWizard } from "@/components/site/EnrollmentWizard";
import { getLocationBySlug, type Location } from "@/data/locations";

export const Route = createFileRoute("/centri-estivi_/$slug_/iscrizione")({
  head: ({ params }) => {
    const loc = getLocationBySlug(params.slug);
    const title = loc
      ? `Iscrivi tuo figlio · ${loc.name} — Sportivissimo`
      : "Iscrizione — Sportivissimo";
    return {
      meta: [
        { title },
        { name: "description", content: "Modulo di iscrizione al centro estivo Sportivissimo." },
      ],
    };
  },
  loader: ({ params }) => {
    const loc = getLocationBySlug(params.slug);
    if (!loc) throw notFound();
    return loc;
  },
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1 container mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-4xl font-bold mb-3">Sede non trovata</h1>
        <Link
          to="/centri-estivi"
          className="inline-flex items-center gap-2 bg-gradient-royal text-primary-foreground rounded-xl px-5 py-3 font-display font-bold shadow-sticker"
        >
          Torna alle sedi
        </Link>
      </main>
      <SiteFooter />
    </div>
  ),
  errorComponent: ({ error, reset }) => (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1 container mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold mb-3">Ops!</h1>
        <p className="text-muted-foreground mb-6">{error.message}</p>
        <button
          onClick={reset}
          className="bg-gradient-royal text-primary-foreground rounded-xl px-5 py-3 font-display font-bold shadow-sticker"
        >
          Riprova
        </button>
      </main>
      <SiteFooter />
    </div>
  ),
  component: EnrollmentPage,
});

function EnrollmentPage() {
  const loc = Route.useLoaderData() as Location;
  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-5xl">
        <Link
          to="/centri-estivi/$slug"
          params={{ slug: loc.slug }}
          className="text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          ← Torna al dettaglio sede
        </Link>
        <h1 className="font-display text-3xl md:text-4xl font-bold mt-2 mb-6">
          Iscrivi tuo figlio a <span className="text-flame">{loc.name}</span>
        </h1>
        <EnrollmentWizard location={loc} />
      </main>
      <SiteFooter />
    </div>
  );
}
