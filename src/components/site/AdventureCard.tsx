import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

type Variant = "sun" | "grass" | "magic" | "royal";

const variantMap: Record<Variant, string> = {
  sun: "bg-gradient-sun text-sun-foreground",
  grass: "bg-gradient-grass text-grass-foreground",
  magic: "bg-gradient-magic text-magic-foreground",
  royal: "bg-gradient-royal text-primary-foreground",
};

export function AdventureCard({
  title,
  description,
  icon: Icon,
  badge,
  to,
  variant,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  badge: string;
  to: string;
  variant: Variant;
}) {
  return (
    <Link
      to={to}
      className="group relative block rounded-3xl border-[3px] border-foreground/90 bg-white shadow-pop hover:-translate-y-1 transition-transform overflow-hidden"
    >
      <div className={`p-5 ${variantMap[variant]}`}>
        <div className="flex items-start justify-between">
          <div className="w-14 h-14 rounded-2xl bg-white/95 text-foreground grid place-items-center border-[3px] border-foreground/90 shadow-sticker group-hover:rotate-[-6deg] transition-transform">
            <Icon className="w-7 h-7" />
          </div>
          <span className="bg-white text-foreground text-xs font-pixel px-2 py-1 rounded-full border-2 border-foreground/90">
            {badge}
          </span>
        </div>
        <h3 className="mt-4 font-display text-2xl font-bold leading-tight">{title}</h3>
      </div>
      <div className="p-5 flex items-center justify-between gap-3">
        <p className="text-sm text-foreground/80">{description}</p>
        <div className="shrink-0 w-10 h-10 rounded-full bg-foreground text-background grid place-items-center group-hover:translate-x-1 transition-transform">
          <ArrowRight className="w-5 h-5" />
        </div>
      </div>
    </Link>
  );
}
