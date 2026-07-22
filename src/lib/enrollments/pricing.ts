import { getLocationBySlug, type Location, type LocationPricing } from "@/data/locations";
import type { Enrollment } from "@/data/enrollments";
import type { TesseraTipo } from "@/lib/supabase/types";

// Le fasce orarie sono stringhe libere: la mezza giornata si riconosce
// dall'etichetta (vale sia per le vecchie "mezza giornata" che per le nuove).
export function isHalfDay(timeSlot: string): boolean {
  return /mezza/i.test(timeSlot);
}

export type CostEstimate = {
  weeks: number;
  perWeek: number;
  siblingDiscountPerWeek: number;
  membership: number;
  extras: number;
  total: number;
};

export function computeEstimate(opts: {
  pricing: LocationPricing;
  weeksCount: number;
  halfDay: boolean;
  residente: boolean;
  tessera: TesseraTipo;
  figlioOrdine: number;
  extrasCost: number;
}): CostEstimate {
  const { pricing } = opts;
  const perWeek = opts.residente
    ? opts.halfDay
      ? pricing.residentHalfDay
      : pricing.residentFullDay
    : opts.halfDay
      ? pricing.nonResidentHalfDay
      : pricing.nonResidentFullDay;
  const siblingDiscountPerWeek =
    opts.figlioOrdine > 1
      ? opts.halfDay
        ? pricing.siblingDiscountHalfDay
        : pricing.siblingDiscountFullDay
      : 0;
  const membership =
    pricing.membershipBase +
    (opts.tessera === "super_integrativa" ? pricing.membershipSuperIntegrativa : 0);
  const total =
    opts.weeksCount * Math.max(perWeek - siblingDiscountPerWeek, 0) + membership + opts.extrasCost;
  return {
    weeks: opts.weeksCount,
    perWeek,
    siblingDiscountPerWeek,
    membership,
    extras: opts.extrasCost,
    total,
  };
}

export function extrasCostFor(loc: Location, extras: string[], weeksCount: number): number {
  return extras.reduce((acc, id) => {
    const e = loc.extraServices.find((x) => x.id === id);
    return acc + (e ? e.price * weeksCount : 0);
  }, 0);
}

// Stima del costo di un'iscrizione già salvata (usata da area admin e PDF).
export function estimateForEnrollment(e: Enrollment): CostEstimate | null {
  const loc = getLocationBySlug(e.session.locationSlug);
  if (!loc) return null;
  return computeEstimate({
    pricing: loc.pricing,
    weeksCount: e.session.weekIds.length,
    halfDay: isHalfDay(e.session.timeSlot),
    residente: e.session.residenteNelComune,
    tessera: e.session.tesseraTipo,
    figlioOrdine: e.figlioOrdine,
    extrasCost: extrasCostFor(loc, e.session.extras, e.session.weekIds.length),
  });
}
