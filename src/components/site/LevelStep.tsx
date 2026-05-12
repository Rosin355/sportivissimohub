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
        <div className={`w-16 h-16 rounded-blob grid place-items-center shadow-sticker ${colorClass[color]}`}>
          <Icon className="w-7 h-7" />
        </div>
        <span className="absolute -top-2 -right-2 font-hand text-sm bg-white border border-foreground/15 rounded-full px-2 py-0.5 shadow-card">
          {level}
        </span>
      </div>
      <div className="flex-1 bg-white rounded-doodle border border-foreground/10 shadow-card p-4">
        <div className="font-display text-lg font-bold">{title}</div>
        <p className="text-sm text-foreground/75 mt-0.5">{description}</p>
      </div>
    </div>
  );
}
