import { Check } from "lucide-react";

export function WizardProgress({
  current,
  total,
  labels,
}: {
  current: number; // 1-based
  total: number;
  labels: string[];
}) {
  const pct = Math.round(((current - 1) / (total - 1)) * 100);
  const cheer =
    current === 1
      ? "Si parte! Prima missione."
      : current === total
        ? "Missione completata: pronta da inviare!"
        : current >= total - 1
          ? "Sei quasi al traguardo!"
          : "Ottimo lavoro, continua così!";
  return (
    <div className="rounded-2xl bg-white border border-border shadow-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-pixel text-muted-foreground">Missione iscrizione</div>
          <div className="font-display text-xl font-bold">
            Step {current} di {total} · {labels[current - 1]}
          </div>
        </div>
        <div className="font-pixel bg-grass/10 text-grass border border-grass/30 rounded-lg px-3 py-1">
          {cheer}
        </div>
      </div>
      <div className="h-3 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-grass rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ol className="mt-4 grid grid-cols-3 md:grid-cols-6 gap-2">
        {labels.map((l, i) => {
          const n = i + 1;
          const done = n < current;
          const active = n === current;
          return (
            <li
              key={l}
              className={`text-xs font-semibold text-center rounded-xl border px-2 py-2 flex flex-col items-center gap-1 transition-colors ${
                active
                  ? "bg-primary/10 border-primary text-primary"
                  : done
                    ? "bg-grass/10 border-grass/30 text-grass"
                    : "bg-secondary border-border text-muted-foreground"
              }`}
            >
              <span
                className={`w-6 h-6 grid place-items-center rounded-full text-[10px] font-bold ${active ? "bg-primary text-primary-foreground" : done ? "bg-grass text-grass-foreground" : "bg-white border border-border text-muted-foreground"}`}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : n}
              </span>
              <span className="leading-tight">{l}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
