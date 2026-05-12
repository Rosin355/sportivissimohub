import type { LucideIcon } from "lucide-react";

export function LevelStep({
  level,
  title,
  description,
  icon: Icon,
  color,
}: {
  level: number;
  title: string;
  description: string;
  icon: LucideIcon;
  color: "sun" | "grass" | "magic" | "flame" | "royal";
}) {
  const colorClass: Record<string, string> = {
    sun: "bg-sun text-sun-foreground",
    grass: "bg-grass text-grass-foreground",
    magic: "bg-magic text-magic-foreground",
    flame: "bg-flame text-flame-foreground",
    royal: "bg-primary text-primary-foreground",
  };
  return (
    <div className="relative flex gap-4 items-start">
      <div className="relative">
        <div className={`w-16 h-16 rounded-2xl grid place-items-center border-[3px] border-foreground/90 shadow-sticker ${colorClass[color]}`}>
          <Icon className="w-7 h-7" />
        </div>
        <span className="absolute -top-2 -right-2 font-pixel text-[10px] bg-white border-2 border-foreground/90 rounded-full px-1.5 py-0.5">
          L{level}
        </span>
      </div>
      <div className="flex-1 bg-white rounded-2xl border-[3px] border-foreground/90 shadow-card p-4">
        <div className="font-display text-lg font-bold">{title}</div>
        <p className="text-sm text-foreground/75 mt-0.5">{description}</p>
      </div>
    </div>
  );
}
