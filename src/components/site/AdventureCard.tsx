import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

type Variant = "sun" | "grass" | "magic" | "royal";

const variantMap: Record<Variant, string> = {
  sun:   "bg-gradient-sun text-sun-foreground",
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
      className="group relative block rounded-2xl bg-white shadow-pop border border-border hover:-translate-y-2 hover:shadow-glow transition-all duration-300 overflow-hidden"
    >
      {/* Gradient header */}
      <div className={`p-5 ${variantMap[variant]}`}>
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm grid place-items-center group-hover:scale-110 transition-transform">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <span className="bg-white/25 backdrop-blur-sm text-white font-pixel px-2.5 py-1 rounded-lg">
            {badge}
          </span>
        </div>
        <h3 className="mt-4 font-display text-2xl font-bold leading-tight text-white">{title}</h3>
      </div>

      {/* Body */}
      <div className="p-5 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="shrink-0 w-9 h-9 rounded-full bg-secondary border border-border grid place-items-center group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
}
