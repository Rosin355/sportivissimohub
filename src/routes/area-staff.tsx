import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { MapPin, AlertTriangle, UserCheck, UserX, Users, Phone, HeartPulse } from "lucide-react";
import { LOCATIONS, getLocationBySlug } from "@/data/locations";
import { requireRole } from "@/lib/supabase/auth";
import {
  getConfirmedChildren,
  checkIn,
  checkOut,
  currentWeekId,
  todayKey,
  type StaffChild,
} from "@/lib/enrollments/staff";

export const Route = createFileRoute("/area-staff")({
  beforeLoad: ({ context, location }) => ({
    auth: requireRole(context.auth, "staff", location.href),
  }),
  head: () => ({ meta: [{ title: "Area Staff — Sportivissimo" }] }),
  component: AreaStaff,
});

function AreaStaff() {
  const [locationSlug, setLocationSlug] = useState(LOCATIONS[0]?.slug ?? "");
  const loc = getLocationBySlug(locationSlug);
  const [weekId, setWeekId] = useState(() => (loc ? currentWeekId(loc) : ""));
  const [children, setChildren] = useState<StaffChild[]>([]);
  const [loading, setLoading] = useState(false);
  const day = todayKey();

  // Cambiando sede si riparte dalla settimana corrente di quella sede.
  function changeLocation(slug: string) {
    setLocationSlug(slug);
    const nextLoc = getLocationBySlug(slug);
    setWeekId(nextLoc ? currentWeekId(nextLoc) : "");
  }

  const refresh = useCallback(() => {
    if (!locationSlug || !weekId) return;
    setLoading(true);
    getConfirmedChildren(locationSlug, weekId, day)
      .then(setChildren)
      .catch((e: Error) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [locationSlug, weekId, day]);
  useEffect(() => {
    refresh();
  }, [refresh]);

  const present = children.filter((c) => c.attendance?.checkedInAt && !c.attendance.checkedOutAt);
  const week = loc?.weeks.find((w) => w.id === weekId);

  async function handleCheckIn(c: StaffChild) {
    try {
      await checkIn(c.enrollmentId, day);
      toast.success(`${c.firstName}: check-in registrato.`);
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleCheckOut(c: StaffChild) {
    if (!c.attendance) return;
    try {
      await checkOut(c.attendance.id);
      toast.success(`${c.firstName}: check-out registrato.`);
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        {/* Sede selector */}
        <div className="rounded-2xl bg-gradient-grass text-grass-foreground p-5 shadow-pop relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-[50px] pointer-events-none" />
          <div className="flex items-center gap-3 relative">
            <div className="w-12 h-12 rounded-xl bg-white/20 grid place-items-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="font-pixel text-white/60 mb-0.5">Sede oggi</div>
              <select
                value={locationSlug}
                onChange={(e) => changeLocation(e.target.value)}
                className="w-full bg-white/15 border border-white/25 text-white font-display text-lg font-bold rounded-xl px-3 py-1.5 [&>option]:text-foreground"
              >
                {LOCATIONS.map((l) => (
                  <option key={l.slug} value={l.slug}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3 relative">
            <select
              value={weekId}
              onChange={(e) => setWeekId(e.target.value)}
              className="w-full bg-white/15 border border-white/25 text-white text-sm font-semibold rounded-xl px-3 py-1.5 [&>option]:text-foreground"
            >
              {loc?.weeks.map((w) => (
                <option key={w.id} value={w.id}>
                  Settimana {w.number} · {w.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center relative">
            <Mini label="Iscritti" value={String(children.length)} />
            <Mini label="Presenti" value={String(present.length)} />
            <Mini label="Assenti" value={String(children.length - present.length)} />
          </div>
        </div>

        {/* Lista bambini */}
        <h2 className="font-display text-2xl font-bold mt-8 mb-4 flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" /> Lista bambini ·{" "}
          {week ? week.label : "settimana"}
        </h2>
        <div className="space-y-3">
          {loading && (
            <div className="rounded-xl border border-border bg-white p-4 text-sm text-muted-foreground">
              Caricamento…
            </div>
          )}
          {!loading && children.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-white p-6 text-center text-muted-foreground text-sm">
              Nessuna iscrizione confermata per questa sede e settimana.
            </div>
          )}
          {children.map((c) => {
            const isIn = Boolean(c.attendance?.checkedInAt) && !c.attendance?.checkedOutAt;
            const isOut = Boolean(c.attendance?.checkedOutAt);
            return (
              <div
                key={c.enrollmentId}
                className="rounded-xl border border-border bg-white shadow-card p-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl grid place-items-center font-display font-bold text-lg shrink-0 ${
                      isIn
                        ? "bg-gradient-grass text-grass-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {c.firstName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">
                      {c.firstName} {c.lastName}{" "}
                      <span className="text-muted-foreground font-normal">· {c.age}a</span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{c.timeSlot}</div>
                    {c.allergies && (
                      <div className="text-xs font-semibold text-flame inline-flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="w-3 h-3" /> Allergie: {c.allergies}
                      </div>
                    )}
                  </div>
                  {isOut ? (
                    <span className="rounded-xl border border-border bg-secondary px-3 py-2 font-bold text-sm text-muted-foreground">
                      Uscito/a
                    </span>
                  ) : isIn ? (
                    <button
                      onClick={() => handleCheckOut(c)}
                      className="rounded-xl border px-3 py-2 font-bold text-sm inline-flex items-center gap-1.5 transition-colors bg-grass/15 text-grass border-grass/30 hover:bg-grass hover:text-grass-foreground"
                    >
                      <UserCheck className="w-4 h-4" /> Check-out
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCheckIn(c)}
                      className="rounded-xl border px-3 py-2 font-bold text-sm inline-flex items-center gap-1.5 transition-colors bg-secondary border-border text-muted-foreground hover:bg-secondary/70"
                    >
                      <UserX className="w-4 h-4" /> Check-in
                    </button>
                  )}
                </div>
                {(c.medicalNotes || c.specialNeeds) && (
                  <div className="mt-2 text-xs text-muted-foreground flex items-start gap-1.5">
                    <HeartPulse className="w-3.5 h-3.5 text-magic shrink-0 mt-0.5" />
                    <span>{[c.medicalNotes, c.specialNeeds].filter(Boolean).join(" · ")}</span>
                  </div>
                )}
                {c.delegates.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground flex items-start gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span>
                      Ritiro: {c.delegates.map((d) => `${d.name} (${d.phone})`).join(" · ")}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/20 backdrop-blur-sm text-white rounded-xl py-2.5">
      <div className="font-display text-2xl font-bold">{value}</div>
      <div className="font-pixel text-white/70 mt-0.5">{label}</div>
    </div>
  );
}
