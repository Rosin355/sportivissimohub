import type { LucideIcon } from "lucide-react";

const gradientClass: Record<string, string> = {
  sun: "bg-gradient-sun text-sun-foreground",
  grass: "bg-gradient-grass text-grass-foreground",
  magic: "bg-gradient-magic text-magic-foreground",
  flame: "bg-gradient-flame text-flame-foreground",
  royal: "bg-gradient-royal text-primary-foreground",
};

const accentBorder: Record<string, string> = {
  sun: "border-l-sun",
  grass: "border-l-grass",
  magic: "border-l-magic",
  flame: "border-l-flame",
  royal: "border-l-primary",
};

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
  return (
    <div className="relative flex gap-4 items-start">
      {/* Icon + level badge */}
      <div className="relative shrink-0">
        <div
          className={`w-14 h-14 rounded-xl grid place-items-center shadow-sticker ${gradientClass[color]}`}
        >
          <Icon className="w-6 h-6" />
        </div>
        <span className="absolute -top-2 -right-2 w-6 h-6 font-display text-sm font-bold bg-white border border-border rounded-full flex items-center justify-center shadow-card text-foreground">
          {level}
        </span>
      </div>

      {/* Card with left colour accent */}
      <div
        className={`flex-1 bg-white rounded-xl border border-border border-l-[3px] ${accentBorder[color]} shadow-card p-4`}
      >
        <div className="font-display text-lg font-bold">{title}</div>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}
