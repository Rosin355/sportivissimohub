export function GamifiedProgressBar({ value, label }: { value: number; label?: string }) {
  const barClass =
    value >= 100 ? "bg-gradient-grass" : value >= 75 ? "bg-gradient-royal" : "bg-gradient-sun";
  return (
    <div>
      {label && (
        <div className="flex justify-between text-xs font-semibold mb-1.5">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-pixel text-foreground/70">{value}%</span>
        </div>
      )}
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barClass}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
