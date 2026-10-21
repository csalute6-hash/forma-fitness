import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import seed from "../../fixtures/seed.json";
import {
  validate,
  filterHistory,
  parseBackup,
  weeks,
  records,
  createWorkout,
  finish,
  volume,
  duration,
  clearPersonal,
  numeric,
  displayWeight,
  canonicalWeight,
  weightInput,
  localDate,
  weekStart,
  type Data,
} from "../../src/domain/model";
import { Repository, KEY } from "../../src/data/repository";
const now = new Date("2026-10-18T04:00:00Z");
const fresh = () => validate(structuredClone(seed), now);
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  localStorage.clear();
  Object.defineProperty(navigator, "locks", {
    configurable: true,
    value: { request: async (_name: string, f: () => unknown) => f() },
  });
});
afterEach(() => vi.useRealTimers());
describe("fixture and calendar calculations", () => {
  it("computes exact weekly totals and zero fills seven earlier weeks", () => {
    const w = weeks(fresh(), now);
    expect(w.slice(0, 7).every((x) => x.count === 0 && x.volume === 0)).toBe(
      true,
    );
    expect(w[7]).toEqual({
      date: "2026-10-12",
      count: 2,
      volume: 4940,
      seconds: 4500,
    });
  });
  it("tracks load and volume records independently", () => {
    const pr = records(fresh());
    expect(pr.find((x) => x.exercise.id === "ex-bench")?.weight.weight).toBe(
      40,
    );
    expect(pr.find((x) => x.exercise.id === "ex-bench")?.volume.volume).toBe(
      400,
    );
    expect(pr.find((x) => x.exercise.id === "ex-squat")?.volume.volume).toBe(
      480,
    );
  });
  it("uses local calendar dates across DST", () => {
    expect(
      localDate(new Date("2026-03-09T03:59:00Z"), "America/New_York"),
    ).toBe("2026-03-08");
    expect(weekStart("2026-03-08")).toBe("2026-03-02");
    expect(weekStart("2026-03-09")).toBe("2026-03-09");
  });
  it("unit round trips preserve canonical precision", () => {
    for (const n of [0, 42.5, 72.23987, 500])
      expect(canonicalWeight(displayWeight(n, "lb"), "lb")).toBeCloseTo(n, 10);
  });
});
describe("workout transition", () => {
  it("snapshots, completes only completed sets and updates aggregates", () => {
    const d = fresh();
    d.activeWorkout = createWorkout(d.plans[0], d, now);
    const id = d.activeWorkout.id;
    d.plans[0].name = "Changed";
    expect(d.activeWorkout.name).toBe("Upper Body A");
    d.activeWorkout.exercises[0].sets[0] = {
      ...d.activeWorkout.exercises[0].sets[0],
      weightKg: 42.5,
      reps: 8,
      completed: true,
    };
    d.activeWorkout.exercises[0].sets[1].completed = true;
    finish(d, new Date(now.getTime() + 1800000));
    expect(d.activeWorkout).toBeNull();
    const w = d.workouts.find((x) => x.id === id)!;
    expect(w.exercises.length).toBe(1);
    expect(volume(w)).toBe(740);
    expect(duration(w)).toBe(1800);
    expect(weeks(d, new Date(now.getTime() + 1800000))[7]).toMatchObject({
      count: 3,
      volume: 5680,
      seconds: 6300,
    });
    expect(
      records(d).find((x) => x.exercise.id === "ex-bench")?.weight.weight,
    ).toBe(42.5);
    expect(
      records(d).find((x) => x.exercise.id === "ex-bench")?.volume.volume,
    ).toBe(400);
    expect(() => finish(d)).toThrow();
  });
  it("rejects empty, clock rollback, and capacity without dropping active", () => {
    const d = fresh();
    d.activeWorkout = createWorkout(d.plans[0], d, now);
    expect(() => finish(d, now)).toThrow("Complete at least");
    d.activeWorkout.exercises[0].sets[0].completed = true;
    expect(() => finish(d, new Date(now.getTime() - 1000))).toThrow(
      "system time",
    );
    d.workouts = Array.from({ length: 200 }, (_, i) => ({
      ...structuredClone(d.workouts[0]),
      id: String(i),
    }));
    expect(() => finish(d, now)).toThrow("200 workout");
    expect(d.activeWorkout).not.toBeNull();
  });
  it("clearing keeps only templates and library and never reseeds personal data", () => {
    const d = fresh();
    clearPersonal(d);
    expect(d.initialized).toBe(true);
    expect(d.workouts).toEqual([]);
    expect(d.activePlanId).toBeNull();
    expect(d.plans).toHaveLength(3);
    expect(validate(d, now)).toEqual(d);
  });
});
describe("validation and hostile backups", () => {
  it.each(["", "-1", "1e2", "1,000", "+1", "NaN", "Infinity", "1.123"])(
    "rejects unsupported numeric input %s",
    (s) => expect(() => numeric(s, 0, 500)).toThrow(),
  );
  it.each(["0", "1.5", "101"])("rejects invalid reps %s", (s) =>
    expect(() => numeric(s, 1, 100, true)).toThrow(),
  );
  it("accepts zero external load", () => expect(numeric("0", 0, 500)).toBe(0));
  it("rejects version, keys, dangerous keys, size, and broken refs", () => {
    expect(() => parseBackup('{"schemaVersion":99}', now)).toThrow(
      "unsupported",
    );
    expect(() => parseBackup('{"__proto__":{}}', now)).toThrow("Unsafe");
    expect(() => parseBackup(" ".repeat(2 * 1024 * 1024 + 1), now)).toThrow(
      "2 MiB",
    );
    expect(() => validate({ ...fresh(), extra: true }, now)).toThrow();
    const d = fresh();
    d.plans[0].exercises[0].exerciseId = "missing";
    expect(() => validate(d, now)).toThrow("reference");
  });
  it("rejects duplicate IDs, future weights, bad date, false history sets", () => {
    const d = fresh();
    d.bodyWeights[1].date = d.bodyWeights[0].date;
    expect(() => validate(d, now)).toThrow();
    d.bodyWeights[1].date = "2026-10-19";
    expect(() => validate(d, now)).toThrow();
    d.bodyWeights[1].date = "2026-02-30";
    expect(() => validate(d, now)).toThrow();
    const b = fresh();
    b.workouts[0].exercises[0].sets[0].completed = false;
    expect(() => validate(b, now)).toThrow();
  });
});
describe("repository failure boundaries", () => {
  it("initializes, commits, exports and restores cleared state", async () => {
    const r = new Repository();
    await r.load();
    await r.commit(clearPersonal);
    const exported = parseBackup(r.exportBackup(), now);
    expect(exported.workouts).toHaveLength(0);
    const other = new Repository();
    await other.load();
    expect(other.data?.revision).toBe(2);
    expect(other.data?.workouts).toHaveLength(0);
  });
  it("does not replace corrupt or unsupported data", async () => {
    for (const raw of ["{broken", '{"schemaVersion":99}']) {
      localStorage.setItem(KEY, raw);
      const r = new Repository();
      await r.load();
      expect(r.data).toBeNull();
      expect(localStorage.getItem(KEY)).toBe(raw);
    }
  });
  it("quota during completion preserves root and active snapshot", async () => {
    const storage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
    } as unknown as Storage;
    let raw = JSON.stringify(fresh());
    vi.mocked(storage.getItem).mockImplementation(() => raw);
    vi.mocked(storage.setItem).mockImplementation((_k, s) => {
      raw = s;
    });
    const r = new Repository(storage);
    await r.load();
    await r.commit((d) => {
      d.activeWorkout = createWorkout(d.plans[0], d, now);
      d.activeWorkout.exercises[0].sets[0].completed = true;
    });
    const before = raw;
    vi.mocked(storage.setItem).mockImplementation(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });
    await expect(
      r.commit((d) => {
        finish(d, now);
      }),
    ).rejects.toThrow("previous data is safe");
    expect(raw).toBe(before);
    expect(r.data?.activeWorkout).not.toBeNull();
    expect(r.data?.workouts).toHaveLength(2);
  });
  it("rejects stale revisions without overwriting", async () => {
    const a = new Repository(),
      b = new Repository();
    await a.load();
    await b.load();
    await a.commit((d) => {
      d.preferences.weeklyGoal = 4;
    });
    await expect(
      b.commit((d) => {
        d.preferences.weeklyGoal = 5;
      }),
    ).rejects.toThrow("another tab");
    expect(JSON.parse(localStorage.getItem(KEY)!) as Data).toMatchObject({
      preferences: { weeklyGoal: 4 },
    });
  });
  it("requires mutual exclusion support", async () => {
    const r = new Repository();
    await r.load();
    Object.defineProperty(navigator, "locks", {
      value: undefined,
      configurable: true,
    });
    await expect(r.commit(clearPersonal)).rejects.toThrow("Web Locks");
  });
});

it("storage read errors are explicit, and canonical text is trimmed on commit", async () => {
  const adapter = {
    getItem: () => {
      throw new DOMException("blocked", "SecurityError");
    },
    setItem: vi.fn(),
  } as unknown as Storage;
  const failed = new Repository(adapter);
  await failed.load();
  expect(failed.data).toBeNull();
  expect(failed.errorCode).toBe("READ_FAILED");
  expect(adapter.setItem).not.toHaveBeenCalled();
  const r = new Repository();
  await r.load();
  await r.commit((d) => {
    d.plans[0].name = "  Upper Body A  ";
  });
  expect(r.data!.plans[0].name).toBe("Upper Body A");
});

it("history windows include calendar endpoints, exclude future dates, and resolve exact timestamp ties by ID", () => {
  const source = fresh().workouts[0];
  const dates = [
    "2026-10-18",
    "2026-10-12",
    "2026-10-11",
    "2026-09-19",
    "2026-09-18",
    "2026-10-19",
  ];
  const rows = dates.map((date, i) => ({
    ...structuredClone(source),
    id: String(i),
    completedLocalDate: date,
    startedAt: date + "T03:00:00Z",
    completedAt: date + "T04:00:00Z",
  }));
  expect(filterHistory(rows, "upper", "7", now).map((w) => w.id)).toEqual([
    "0",
    "1",
  ]);
  expect(filterHistory(rows, " UPPER ", "30", now).map((w) => w.id)).toEqual([
    "0",
    "1",
    "2",
    "3",
  ]);
  expect(
    filterHistory(
      [
        { ...rows[0], id: "a" },
        { ...rows[0], id: "Z" },
      ],
      "",
      "all",
      now,
    ).map((w) => w.id),
  ).toEqual(["Z", "a"]);
});

it("future completed history remains valid but is excluded from the current week", () => {
  const d = fresh();
  const w = d.workouts[0];
  w.startedAt = "2026-10-19T10:00:00Z";
  w.completedAt = "2026-10-19T10:35:00Z";
  w.completedLocalDate = "2026-10-19";
  expect(() => validate(d, now)).not.toThrow();
  expect(weeks(d, now)[7].count).toBe(1);
});

it("oversized but structurally valid writes preserve the old root and keep exports importable", async () => {
  const r = new Repository();
  await r.load();
  const before = r.exportBackup();
  await expect(
    r.commit((d) => {
      const original = d.workouts[0];
      d.workouts = Array.from({ length: 200 }, (_, i) => ({
        ...structuredClone(original),
        id: "dense-" + i,
        exercises: Array.from({ length: 30 }, (_, j) => ({
          ...structuredClone(original.exercises[0]),
          id: "e" + j,
          sets: Array.from({ length: 20 }, (_, k) => ({
            id: `s${j}-${k}`,
            weightKg: 40,
            reps: 10,
            completed: true,
          })),
        })),
      }));
    }),
  ).rejects.toThrow("2 MiB backup limit");
  expect(r.exportBackup()).toBe(before);
  expect(() => parseBackup(r.exportBackup(), now)).not.toThrow();
});

it("a stale recovery screen cannot reset data that changed after its failed read", async () => {
  localStorage.setItem(KEY, "{broken");
  const r = new Repository();
  await r.load();
  const restored = JSON.stringify(fresh());
  localStorage.setItem(KEY, restored);
  await expect(r.resetCorrupt()).rejects.toThrow("another tab");
  expect(localStorage.getItem(KEY)).toBe(restored);
  localStorage.setItem(KEY, "{broken");
  await r.load();
  await r.resetCorrupt();
  expect(r.data!.workouts).toEqual([]);
  expect(r.data!.plans).toHaveLength(3);
});

it("lb input uses representable canonical boundaries with correct unit errors", () => {
  expect(() => weightInput("44.09", 20, 350, "lb")).toThrow("lb");
  expect(weightInput("44.10", 20, 350, "lb")).toBeGreaterThanOrEqual(20);
  expect(() => weightInput("771.62", 20, 350, "lb")).toThrow("771.61 lb");
  expect(weightInput("771.61", 20, 350, "lb")).toBeLessThanOrEqual(350);
  expect(() => weightInput("1102.32", 0, 500, "lb")).toThrow();
  expect(weightInput("1102.31", 0, 500, "lb")).toBeLessThanOrEqual(500);
  expect(weightInput("0", 0, 500, "kg")).toBe(0);
});
