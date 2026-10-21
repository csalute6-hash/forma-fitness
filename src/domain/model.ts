import { z } from "zod";
export const id = z.string().min(1).max(128);
const title = z.string().trim().min(1).max(60),
  kg = z.number().finite().min(0).max(500),
  reps = z.number().int().min(1).max(100),
  rest = z.number().int().min(15).max(600);
export const muscles = [
  "Chest",
  "Back",
  "Legs",
  "Shoulders",
  "Core",
  "Full body",
] as const;
export const equipment = [
  "Barbell",
  "Dumbbell",
  "Bodyweight",
  "Cable",
] as const;
export const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const iso = z.string().datetime();
const day = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (s) =>
      !isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s,
  );
const exercise = z
  .object({
    id,
    name: z.string().trim().min(1).max(80),
    aliases: z.array(z.string().min(1).max(80)).max(10),
    muscleGroup: z.enum(muscles),
    equipment: z.enum(equipment),
    instructions: z.array(z.string().min(1).max(300)).length(3),
    note: z.string().max(300),
  })
  .strict();
const planRow = z
  .object({
    id,
    exerciseId: id,
    targetSets: z.number().int().min(1).max(20),
    targetReps: reps,
    targetWeightKg: kg,
    restSeconds: rest,
  })
  .strict();
export const planSchema = z
  .object({
    id,
    name: title,
    description: z.string().max(500),
    isTemplate: z.boolean(),
    days: z
      .array(z.enum(days))
      .max(7)
      .refine((a) => new Set(a).size === a.length),
    exercises: z.array(planRow).min(1).max(30),
  })
  .strict();
const set = z
  .object({ id, weightKg: kg, reps, completed: z.boolean() })
  .strict();
const workoutRow = z
  .object({
    id,
    exerciseId: id,
    name: z.string().min(1).max(80),
    muscleGroup: z.enum(muscles),
    equipment: z.enum(equipment),
    restSeconds: rest,
    sets: z.array(set).max(20),
  })
  .strict();
const common = {
  id,
  name: title,
  sourcePlanId: id.nullable(),
  startedAt: iso,
  exercises: z.array(workoutRow).max(30),
};
const active = z
  .object({
    ...common,
    rest: z.object({ durationSeconds: rest, endsAt: iso }).strict().nullable(),
  })
  .strict();
const completed = z
  .object({
    ...common,
    completedAt: iso,
    completedLocalDate: day,
    timeZone: z.string().max(100),
  })
  .strict();
export const rootSchema = z
  .object({
    schemaVersion: z.literal(1),
    revision: z.number().int().nonnegative(),
    initialized: z.literal(true),
    preferences: z
      .object({
        weightUnit: z.enum(["kg", "lb"]),
        lengthUnit: z.enum(["cm", "in"]),
        weeklyGoal: z.number().int().min(1).max(14),
      })
      .strict(),
    exercises: z.array(exercise).min(1).max(200),
    plans: z.array(planSchema).max(50),
    activePlanId: id.nullable(),
    activeWorkout: active.nullable(),
    workouts: z.array(completed).max(200),
    bodyWeights: z
      .array(
        z
          .object({
            id,
            date: day,
            weightKg: z.number().finite().min(20).max(350),
          })
          .strict(),
      )
      .max(730),
  })
  .strict();
export type Data = z.infer<typeof rootSchema>;
export type Plan = z.infer<typeof planSchema>;
export type Exercise = z.infer<typeof exercise>;
export type Active = z.infer<typeof active>;
export type Workout = z.infer<typeof completed>;
export type WorkoutRow = z.infer<typeof workoutRow>;
export type SetRecord = z.infer<typeof set>;
const dateFormatters = new Map<string, Intl.DateTimeFormat>();
export function localDate(now: Date = new Date(), timeZone?: string): string {
  const key = timeZone ?? new Intl.DateTimeFormat().resolvedOptions().timeZone;
  let formatter = dateFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: key,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    dateFormatters.set(key, formatter);
  }
  const p = formatter.formatToParts(now);
  return ["year", "month", "day"]
    .map((k) => p.find((x) => x.type === k)!.value)
    .join("-");
}
export function validate(raw: unknown, now = new Date()): Data {
  const d = rootSchema.parse(raw);
  const today = localDate(now);
  const fail = (message: string): never => {
    throw new Error(message);
  };
  const unique = (items: { id: string }[]) => {
    if (new Set(items.map((x) => x.id)).size !== items.length)
      fail("Duplicate IDs are not allowed.");
  };
  [d.exercises, d.plans, d.workouts, d.bodyWeights].forEach(unique);
  const ex = new Set(d.exercises.map((e) => e.id));
  if (d.activePlanId && !d.plans.some((p) => p.id === d.activePlanId))
    fail("Unknown active plan.");
  for (const p of d.plans) {
    unique(p.exercises);
    if (p.exercises.some((e) => !ex.has(e.exerciseId)))
      fail("Unknown exercise reference.");
  }
  if (
    new Set(d.bodyWeights.map((b) => b.date)).size !== d.bodyWeights.length ||
    d.bodyWeights.some((b) => b.date > today)
  )
    fail("Choose today or an earlier date. Each date must be unique.");
  for (const w of [
    ...d.workouts,
    ...(d.activeWorkout ? [d.activeWorkout] : []),
  ]) {
    unique(w.exercises);
    unique(w.exercises.flatMap((e) => e.sets));
    if (w.exercises.some((e) => !ex.has(e.exerciseId)))
      fail("Unknown exercise reference.");
  }
  if (d.activeWorkout && Date.parse(d.activeWorkout.startedAt) > now.getTime())
    fail("Workout start is in the future.");
  if (d.activeWorkout && d.workouts.some((w) => w.id === d.activeWorkout!.id))
    fail("Duplicate workout.");
  for (const w of d.workouts) {
    if (
      w.completedAt < w.startedAt &&
      Date.parse(w.completedAt) < Date.parse(w.startedAt)
    )
      fail("Check your system time.");
    if (Date.parse(w.completedAt) < Date.parse(w.startedAt))
      fail("Invalid completion time.");
    if (
      !w.exercises.length ||
      w.exercises.some(
        (e) => !e.sets.length || e.sets.some((s) => !s.completed),
      )
    )
      fail("History must contain completed sets only.");
    if (localDate(new Date(w.completedAt), w.timeZone) !== w.completedLocalDate)
      fail("Completion date does not match time zone.");
  }
  return d;
}
export function parseBackup(raw: string, now = new Date()): Data {
  if (new TextEncoder().encode(raw).length > 2 * 1024 * 1024)
    throw Error("The file exceeds 2 MiB.");
  const value: unknown = JSON.parse(raw, (k, v: unknown) => {
    if (["__proto__", "prototype", "constructor"].includes(k))
      throw Error("Unsafe field in backup.");
    return v;
  });
  if (
    typeof value === "object" &&
    value !== null &&
    "schemaVersion" in value &&
    value.schemaVersion !== 1
  )
    throw Error("This backup uses an unsupported data version.");
  return validate(value, now);
}
export const uuid = () => crypto.randomUUID();
export const displayWeight = (kg: number, unit: string) =>
  kg * (unit === "lb" ? 2.2046226218 : 1);
export const canonicalWeight = (n: number, unit: string) =>
  n / (unit === "lb" ? 2.2046226218 : 1);
export const num = (n: number, digits = 2) =>
  n.toLocaleString("en-US", { maximumFractionDigits: digits });
export function numeric(
  s: string,
  min: number,
  max: number,
  integer = false,
): number {
  if (
    !/^\d+(\.\d{1,2})?$/.test(s) ||
    !Number.isFinite(+s) ||
    +s < min ||
    +s > max ||
    (integer && !Number.isInteger(+s))
  )
    throw Error(
      integer
        ? `Enter a whole number between ${min} and ${max}.`
        : `Enter a number between ${num(min)} and ${num(max)} with at most 2 decimal places.`,
    );
  return +s;
}
export const volume = (w: Active | Workout) =>
  w.exercises.reduce(
    (n, e) =>
      n +
      e.sets
        .filter((s) => s.completed)
        .reduce((a, s) => a + s.weightKg * s.reps, 0),
    0,
  );
export const duration = (w: Workout) =>
  Math.max(
    0,
    Math.floor((Date.parse(w.completedAt) - Date.parse(w.startedAt)) / 1000),
  );
export const time = (seconds: number) =>
  seconds < 3600
    ? `${Math.floor(seconds / 60)}m`
    : `${Math.floor(seconds / 3600)}h ${String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}m`;
export function shiftDay(day: string, n: number) {
  const d = new Date(day + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function weekStart(day: string) {
  const dow = new Date(day + "T12:00:00Z").getUTCDay();
  return shiftDay(day, -((dow + 6) % 7));
}
export function weeks(d: Data, now = new Date()) {
  const today = localDate(now);
  const start = weekStart(today);
  return Array.from({ length: 8 }, (_, i) => {
    const date = shiftDay(start, (i - 7) * 7);
    const ws = d.workouts.filter(
      (w) =>
        w.completedLocalDate >= date &&
        w.completedLocalDate <= shiftDay(date, 6) &&
        w.completedLocalDate <= today,
    );
    return {
      date,
      count: ws.length,
      volume: ws.reduce((n, w) => n + volume(w), 0),
      seconds: ws.reduce((n, w) => n + duration(w), 0),
    };
  });
}
export const sorted = (ws: Workout[]) =>
  [...ws].sort(
    (a, b) =>
      Date.parse(b.completedAt) - Date.parse(a.completedAt) ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
export function records(d: Data) {
  return d.exercises.flatMap((e) => {
    const entries = sorted(d.workouts).flatMap((w) =>
      w.exercises
        .filter((x) => x.exerciseId === e.id)
        .flatMap((x) =>
          x.sets.map((s) => ({
            weight: s.weightKg,
            volume: s.weightKg * s.reps,
            workoutId: w.id,
            date: w.completedLocalDate,
          })),
        ),
    );
    if (!entries.length) return [];
    return [
      {
        exercise: e,
        weight: entries.reduce((a, b) => (b.weight > a.weight ? b : a)),
        volume: entries.reduce((a, b) => (b.volume > a.volume ? b : a)),
      },
    ];
  });
}
export function createWorkout(p: Plan, d: Data, now = new Date()): Active {
  return {
    id: uuid(),
    name: p.name,
    sourcePlanId: p.id,
    startedAt: now.toISOString(),
    rest: null,
    exercises: p.exercises.map((r) => ({
      ...makeRow(
        d.exercises.find((e) => e.id === r.exerciseId)!,
        r.restSeconds,
      ),
      sets: Array.from({ length: r.targetSets }, () => ({
        id: uuid(),
        weightKg: r.targetWeightKg,
        reps: r.targetReps,
        completed: false,
      })),
    })),
  };
}
export function makeRow(e: Exercise, restSeconds = 90): WorkoutRow {
  return {
    id: uuid(),
    exerciseId: e.id,
    name: e.name,
    muscleGroup: e.muscleGroup,
    equipment: e.equipment,
    restSeconds,
    sets: [{ id: uuid(), weightKg: 0, reps: 8, completed: false }],
  };
}
export function finish(d: Data, now = new Date()): string {
  const a = d.activeWorkout;
  if (!a) throw Error("No workout in progress.");
  if (now.getTime() < Date.parse(a.startedAt))
    throw Error("Check your system time before finishing.");
  if (d.workouts.length >= 200)
    throw Error(
      "200 workout limit reached. Export a backup, then delete an old workout.",
    );
  const exercises = a.exercises
    .map((e) => ({ ...e, sets: e.sets.filter((s) => s.completed) }))
    .filter((e) => e.sets.length);
  if (!exercises.length)
    throw Error("Complete at least one set to finish this workout.");
  const snapshot = {
    id: a.id,
    name: a.name,
    sourcePlanId: a.sourcePlanId,
    startedAt: a.startedAt,
  };
  d.workouts.push({
    ...snapshot,
    exercises,
    completedAt: now.toISOString(),
    completedLocalDate: localDate(now),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  d.activeWorkout = null;
  return a.id;
}
export function clearPersonal(d: Data) {
  d.preferences = { weightUnit: "kg", lengthUnit: "cm", weeklyGoal: 3 };
  d.plans = d.plans.filter((p) => p.isTemplate);
  d.activePlanId = null;
  d.activeWorkout = null;
  d.workouts = [];
  d.bodyWeights = [];
}

export function filterHistory(
  workouts: Workout[],
  query: string,
  range: string,
  now = new Date(),
): Workout[] {
  const today = localDate(now);
  const from = shiftDay(today, -(range === "7" ? 6 : 29));
  return sorted(workouts).filter(
    (w) =>
      w.name.toLowerCase().includes(query.trim().toLowerCase()) &&
      (range === "all" ||
        (w.completedLocalDate >= from && w.completedLocalDate <= today)),
  );
}

export function weightInput(
  value: string,
  minKg: number,
  maxKg: number,
  unit: "kg" | "lb",
): number {
  const minimum = Math.ceil(displayWeight(minKg, unit) * 100) / 100;
  const maximum = Math.floor(displayWeight(maxKg, unit) * 100) / 100;
  try {
    return canonicalWeight(numeric(value, minimum, maximum), unit);
  } catch {
    throw Error(
      `Enter a weight between ${num(minimum)} and ${num(maximum)} ${unit}, with at most 2 decimal places.`,
    );
  }
}
