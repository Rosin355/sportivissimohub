import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Location } from "@/data/locations";

/* ---------- settimana corrente dalle label delle sedi ---------- */

const MONTHS: Record<string, number> = {
  gennaio: 0,
  gen: 0,
  febbraio: 1,
  feb: 1,
  marzo: 2,
  mar: 2,
  aprile: 3,
  apr: 3,
  maggio: 4,
  mag: 4,
  giugno: 5,
  giu: 5,
  luglio: 6,
  lug: 6,
  agosto: 7,
  ago: 7,
  settembre: 8,
  set: 8,
  ottobre: 9,
  ott: 9,
  novembre: 10,
  nov: 10,
  dicembre: 11,
  dic: 11,
};

// Label tipo "10 - 14 giugno" o "29 lug - 2 ago" (anno: quello corrente).
export function parseWeekRange(label: string, year: number): { start: Date; end: Date } | null {
  const m = label.toLowerCase().match(/(\d+)\s*([a-zà-ù]+)?\s*-\s*(\d+)\s*([a-zà-ù]+)/);
  if (!m) return null;
  const endMonth = MONTHS[m[4]];
  if (endMonth === undefined) return null;
  const startMonth = m[2] !== undefined ? (MONTHS[m[2]] ?? endMonth) : endMonth;
  const start = new Date(year, startMonth, parseInt(m[1], 10));
  const end = new Date(year, endMonth, parseInt(m[3], 10), 23, 59, 59);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return { start, end };
}

// Settimana che contiene oggi; altrimenti la prossima in arrivo; altrimenti
// l'ultima disponibile.
export function currentWeekId(loc: Location, today: Date = new Date()): string {
  const year = today.getFullYear();
  let upcoming: { id: string; start: Date } | null = null;
  for (const w of loc.weeks) {
    const range = parseWeekRange(w.label, year);
    if (!range) continue;
    if (today >= range.start && today <= range.end) return w.id;
    if (range.start > today && (!upcoming || range.start < upcoming.start)) {
      upcoming = { id: w.id, start: range.start };
    }
  }
  return upcoming?.id ?? loc.weeks[loc.weeks.length - 1]?.id ?? "";
}

export function todayKey(d: Date = new Date()): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/* ---------- bambini confermati per sede+settimana ---------- */

export type StaffAttendance = {
  id: string;
  checkedInAt: string | null;
  checkedOutAt: string | null;
};

export type StaffChild = {
  enrollmentId: string;
  firstName: string;
  lastName: string;
  age: number;
  allergies: string;
  medicalNotes: string;
  specialNeeds: string;
  timeSlot: string;
  delegates: Array<{ name: string; phone: string }>;
  attendance: StaffAttendance | null;
};

type StaffRow = {
  id: string;
  time_slot: string;
  children: {
    first_name: string;
    last_name: string;
    birth_date: string;
    allergies: string;
    medical_notes: string;
    special_needs: string;
  } | null;
  pickup_delegates: Array<{ first_name: string; last_name: string; phone: string }>;
};

function age(birthDate: string): number {
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000)));
}

export async function getConfirmedChildren(
  locationSlug: string,
  weekId: string,
  day: string,
): Promise<StaffChild[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("enrollments")
    .select(
      `id, time_slot,
       children ( first_name, last_name, birth_date, allergies, medical_notes, special_needs ),
       pickup_delegates ( first_name, last_name, phone )`,
    )
    .eq("status", "confermata")
    .eq("location_slug", locationSlug)
    .contains("week_ids", [weekId])
    .returns<StaffRow[]>();
  if (error) throw new Error("Impossibile caricare i bambini della settimana.");

  const rows = data ?? [];
  const ids = rows.map((r) => r.id);
  const attendanceById = new Map<string, StaffAttendance>();
  if (ids.length > 0) {
    const { data: att } = await supabase
      .from("attendance")
      .select("id, enrollment_id, checked_in_at, checked_out_at")
      .eq("day", day)
      .in("enrollment_id", ids);
    for (const a of att ?? []) {
      attendanceById.set(a.enrollment_id, {
        id: a.id,
        checkedInAt: a.checked_in_at,
        checkedOutAt: a.checked_out_at,
      });
    }
  }

  return rows
    .map((r) => ({
      enrollmentId: r.id,
      firstName: r.children?.first_name ?? "",
      lastName: r.children?.last_name ?? "",
      age: r.children ? age(r.children.birth_date) : 0,
      allergies: r.children?.allergies ?? "",
      medicalNotes: r.children?.medical_notes ?? "",
      specialNeeds: r.children?.special_needs ?? "",
      timeSlot: r.time_slot,
      delegates: r.pickup_delegates.map((d) => ({
        name: `${d.first_name} ${d.last_name}`,
        phone: d.phone,
      })),
      attendance: attendanceById.get(r.id) ?? null,
    }))
    .sort((a, b) => a.firstName.localeCompare(b.firstName));
}

/* ---------- check-in / check-out ---------- */

export async function checkIn(enrollmentId: string, day: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessione scaduta: accedi di nuovo.");
  const { error } = await supabase.from("attendance").upsert(
    {
      enrollment_id: enrollmentId,
      day,
      checked_in_at: new Date().toISOString(),
      recorded_by: user.id,
    },
    { onConflict: "enrollment_id,day" },
  );
  if (error) throw new Error("Check-in non riuscito: verifica i permessi.");
}

export async function checkOut(attendanceId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("attendance")
    .update({ checked_out_at: new Date().toISOString() })
    .eq("id", attendanceId);
  if (error) throw new Error("Check-out non riuscito: verifica i permessi.");
}
