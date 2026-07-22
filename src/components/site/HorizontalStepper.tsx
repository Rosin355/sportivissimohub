import type { LucideIcon } from "lucide-react";

export type StepperStep = {
  number: number;
  icon: LucideIcon;
  title: string;
  description: string;
};

export function HorizontalStepper({ steps }: { steps: StepperStep[] }) {
  return (
    <>
      {/* Desktop: horizontal row with dotted connector */}
      <div className="hidden md:flex items-start justify-between relative">
        {/* Dotted connector line — sits at vertical centre of the numbered circles */}
        <div className="absolute top-[68px] left-[8%] right-[8%] border-t-2 border-dashed border-primary/25 z-0" />

        {steps.map((step) => (
          <div
            key={step.number}
            className="flex flex-col items-center text-center flex-1 relative z-10 px-2"
          >
            {/* Icon badge above the number circle */}
            <div className="w-10 h-10 rounded-xl bg-primary/10 grid place-items-center mb-2">
              <step.icon className="w-5 h-5 text-primary" />
            </div>
            {/* Numbered circle */}
            <div className="w-14 h-14 rounded-full bg-primary text-white font-display text-2xl font-bold grid place-items-center shadow-sticker mb-4">
              {step.number}
            </div>
            {/* Title */}
            <div className="font-display text-base font-bold text-foreground leading-tight mb-1">
              {step.title}
            </div>
            {/* Description */}
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[130px]">
              {step.description}
            </p>
          </div>
        ))}
      </div>

      {/* Mobile: vertical stack */}
      <div className="md:hidden space-y-1">
        {steps.map((step, i) => (
          <div key={step.number} className="flex items-start gap-4">
            {/* Circle + connector */}
            <div className="flex flex-col items-center shrink-0">
              <div className="w-12 h-12 rounded-full bg-primary text-white font-display text-xl font-bold grid place-items-center shadow-sticker">
                {step.number}
              </div>
              {i < steps.length - 1 && (
                <div className="w-px flex-1 my-1 border-l-2 border-dashed border-primary/25 min-h-[2rem]" />
              )}
            </div>
            {/* Text */}
            <div className="flex-1 pt-2 pb-4">
              <div className="font-display text-lg font-bold text-foreground">{step.title}</div>
              <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
