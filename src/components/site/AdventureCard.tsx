import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

export type Variant = "sun" | "grass" | "magic" | "royal";

const iconBg: Record<Variant, string> = {
  sun:   "bg-flame",
  grass: "bg-grass",
  royal: "bg-primary",
  magic: "bg-magic",
};

const bottomBg: Record<Variant, string> = {
  sun:   "bg-flame/10",
  grass: "bg-grass/10",
  royal: "bg-primary/10",
  magic: "bg-magic/10",
};

/* Wavy SVG separator between white text area and coloured illustration area */
function WaveTop({ className }: { className?: string }) {
  return (
    <svg
      className={`absolute top-0 left-0 w-full ${className ?? ""}`}
      viewBox="0 0 400 24"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M0 24 Q100 0 200 12 Q300 24 400 8 L400 24 Z" className="fill-white" />
    </svg>
  );
}

export function AdventureCard({
  title,
  description,
  icon: Icon,
  badge,
  to,
  variant,
  image,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  badge: string;
  to: string;
  variant: Variant;
  image: string;
}) {
  return (
    <Link
      to={to}
      className="group relative flex flex-col rounded-2xl bg-white shadow-card border border-border hover:-translate-y-2 hover:shadow-pop transition-all duration-300 overflow-hidden"
    >
      {/* Top text area */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-11 h-11 rounded-xl grid place-items-center shrink-0 ${iconBg[variant]}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <span className="mt-1 bg-secondary text-muted-foreground font-pixel px-2.5 py-0.5 rounded-lg self-start">
            {badge}
          </span>
        </div>
        <h3 className="font-display text-xl font-bold text-foreground leading-tight">{title}</h3>
        <p className="text-sm text-muted-foreground mt-2 flex-1">{description}</p>
        <div className="mt-4 flex items-center gap-1 text-primary font-bold text-sm group-hover:gap-2 transition-all">
          Scopri <ArrowRight className="w-4 h-4" />
        </div>
      </div>

      {/* Bottom illustration area */}
      <div className={`relative h-40 overflow-hidden ${bottomBg[variant]}`}>
        <WaveTop />
        <img
          src={image}
          alt={title}
          className="absolute bottom-0 right-4 h-[92%] w-auto object-contain"
        />
      </div>
    </Link>
  );
}
