import type { Data } from "../src/domain/model";
export function capacity(seed: Data): Data {
  const d = structuredClone(seed);
  d.exercises = Array.from({ length: 200 }, (_, i) => ({
    ...structuredClone(seed.exercises[i % seed.exercises.length]),
    id: "e" + i,
  }));
  d.plans = Array.from({ length: 50 }, (_, i) => ({
    ...structuredClone(seed.plans[i % 3]),
    id: "p" + i,
    isTemplate: i < 3,
    exercises: seed.plans[i % 3].exercises.map((r, j) => ({
      ...r,
      id: "r" + j,
      exerciseId: "e" + j,
    })),
  }));
  d.activePlanId = "p0";
  d.workouts = Array.from({ length: 200 }, (_, i) => ({
    ...structuredClone(seed.workouts[i % 2]),
    id: "w" + i,
    exercises: Array.from({ length: 10 }, (_, j) => {
      const e = d.exercises[j];
      return {
        id: "r" + j,
        exerciseId: e.id,
        name: e.name,
        muscleGroup: e.muscleGroup,
        equipment: e.equipment,
        restSeconds: 90,
        sets: Array.from({ length: 3 }, (_, k) => ({
          id: `s${j}-${k}`,
          weightKg: 40,
          reps: 10,
          completed: true,
        })),
      };
    }),
  }));
  d.bodyWeights = Array.from({ length: 730 }, (_, i) => {
    const date = new Date("2026-10-18T12:00:00Z");
    date.setUTCDate(date.getUTCDate() - i);
    return {
      id: "b" + i,
      date: date.toISOString().slice(0, 10),
      weightKg: 72.5,
    };
  });
  return d;
}
