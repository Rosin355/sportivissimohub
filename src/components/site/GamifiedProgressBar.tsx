export function GamifiedProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div>
      {label && (
        <div className="flex justify-between text-xs font-bold mb-1">
          <span>{label}</span>
          <span className="font-pixel text-[10px]">{value}%</span>
        </div>
      )}
      <div className="h-4 bg-secondary rounded-full overflow-hidden border-2 border-foreground/90 relative">
        <div className="h-full bg-gradient-sun transition-all" style={{ width: `${value}%` }} />
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(255,255,255,.25)_6px,rgba(255,255,255,.25)_12px)] opacity-60 pointer-events-none" />
      </div>
    </div>
  );
}
