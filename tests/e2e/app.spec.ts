import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

import type { Data } from "../../src/domain/model";
import { readFileSync, mkdirSync } from "node:fs";
const KEY = "forma.app.v1";
const seed = JSON.parse(
  readFileSync(new URL("../../fixtures/seed.json", import.meta.url), "utf8"),
) as Data;
const clock = new Date("2026-10-18T04:00:00Z");
// Production has no test clock switches; browser clock and storage adapters are isolated here.
async function setup(page: Page) {
  await page.clock.setFixedTime(clock);
  await page.goto("/");
  await page.evaluate(
    ({ key, data }) => localStorage.setItem(key, JSON.stringify(data)),
    { key: KEY, data: seed },
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Dashboard", exact: true }),
  ).toBeVisible();
}
async function root(page: Page) {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    KEY,
  ) as Promise<Data>;
}
async function start(page: Page) {
  await page
    .getByRole("button", { name: "Start workout", exact: true })
    .click();
  await expect(page).toHaveURL(/workouts\/active/);
}
async function complete(page: Page) {
  await page
    .getByRole("button", { name: "Set 1 done", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("button", { name: "Set 1 done", exact: true }).first(),
  ).toHaveAttribute("aria-pressed", "true");
}
async function snap(page: Page, name: string) {
  mkdirSync("evidence/screenshots", { recursive: true });
  await page.screenshot({
    path: `evidence/screenshots/${name}.png`,
    fullPage: true,
  });
}
test.beforeEach(async ({ page }) => setup(page));
test("J01 exact fixture → two sets → reload → atomic finish → derived records", async ({
  page,
}) => {
  await expect(page.locator(".stat-value").nth(0)).toHaveText("2 / 3");
  await expect(page.locator(".stat-value").nth(1)).toContainText("4,940");
  await start(page);
  const a = (await root(page)).activeWorkout;
  expect(a!.startedAt).toBe(clock.toISOString());
  const first = page.locator(".exercise-panel").first();
  await first.getByLabel("Set 1 weight (kg)", { exact: true }).fill("42.5");
  await first.getByLabel("Set 1 weight (kg)", { exact: true }).press("Enter");
  await expect
    .poll(async () => (await root(page)).activeWorkout)
    .not.toBeNull();
  await first.getByLabel("Set 1 reps", { exact: true }).fill("8");
  await first.getByRole("button", { name: "Set 1 done", exact: true }).click();
  await expect(
    first.getByRole("button", { name: "Set 1 done", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await first.getByRole("button", { name: "Set 2 done", exact: true }).click();
  await expect(
    first.getByRole("button", { name: "Set 2 done", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  expect((await root(page)).activeWorkout).toMatchObject({
    id: a!.id,
    startedAt: a!.startedAt,
  });
  await expect(
    first.getByLabel("Set 1 weight (kg)", { exact: true }),
  ).toHaveValue("42.5");
  await page.clock.setFixedTime(new Date(clock.getTime() + 1800000));
  await expect(page.getByText("Rest complete", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Finish workout", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Only completed sets will be saved.",
  );
  await page.getByRole("button", { name: "Save workout", exact: true }).click();
  await expect(page).toHaveURL(/workouts\/(?!active)/);
  await snap(page, "desktop-workout-details");
  await page.setViewportSize({ width: 390, height: 844 });
  await snap(page, "mobile-workout-details");
  await page.setViewportSize({ width: 1440, height: 1000 });
  const d = await root(page);
  expect(d.activeWorkout).toBeNull();
  const w = d.workouts.at(-1)!;
  expect(Date.parse(w.completedAt) - Date.parse(w.startedAt)).toBe(1800000);
  expect(w.exercises).toHaveLength(1);
  expect(w.exercises[0].sets).toHaveLength(2);
  expect(
    w.exercises[0].sets.map((s) => s.weightKg * s.reps).reduce((a, b) => a + b),
  ).toBe(740);
  await page.goto("/");
  await expect(page.locator(".stat-value").nth(0)).toHaveText("3 / 3");
  await expect(page.locator(".stat-value").nth(1)).toContainText("5,680");
  await page.goto("/progress");
  const bench = page.getByRole("row").filter({ hasText: "Bench Press" });
  await expect(bench).toContainText("42.5");
  await expect(bench).toContainText("400");
});
test("J02 invalid draft guards navigation, replacement cancellation and discard", async ({
  page,
}) => {
  await start(page);
  const first = page.locator(".exercise-panel").first();
  await first.getByLabel("Set 1 reps", { exact: true }).fill("0");
  await first.getByRole("button", { name: "Set 1 done", exact: true }).click();
  await expect(
    page.getByText("Enter a whole number between 1 and 100."),
  ).toBeVisible();
  await snap(page, "state-field-error");
  await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Unsaved changes");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(first.getByLabel("Set 1 reps", { exact: true })).toHaveValue(
    "0",
  );
  await first.getByLabel("Set 1 reps", { exact: true }).fill("8");
  await complete(page);
  await first.getByRole("button", { name: "Replace", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("article")
    .filter({ hasText: "Push-up" })
    .getByRole("button", { name: "Select", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("clear its sets");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    first.getByRole("heading", { name: "Bench Press" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Discard workout", exact: true })
    .click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  expect((await root(page)).activeWorkout).not.toBeNull();
  await page
    .getByRole("button", { name: "Discard workout", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Discard workout", exact: true })
    .click();
  await expect(page).toHaveURL(/\/workouts$/);
  expect((await root(page)).activeWorkout).toBeNull();
  expect((await root(page)).workouts).toHaveLength(2);
});
test("J03 copied plan editor, validation, days, ordering and immutable active snapshot", async ({
  page,
}) => {
  await page.goto("/plans/plan-upper");
  await page.getByRole("button", { name: "Copy plan", exact: true }).click();
  await expect(page).toHaveURL(/edit/);
  await page.getByLabel("Plan name", { exact: true }).fill("");
  await expect(
    page.getByRole("button", { name: "Save plan", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Plan name", { exact: true }).fill("Evening strength");
  await page.getByRole("button", { name: "Wed", exact: true }).click();
  await page
    .getByRole("button", { name: "Move down", exact: true })
    .first()
    .click();
  await snap(page, "desktop-plan-editor-filled");
  await page.setViewportSize({ width: 390, height: 844 });
  await snap(page, "mobile-plan-editor-filled");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Save plan", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Evening strength", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Use plan", exact: true }).click();
  await start(page);
  const a = (await root(page)).activeWorkout;
  expect(a!.exercises[0].name).toBe("Barbell Row");
  await page.goto("/plans/" + a!.sourcePlanId + "/edit");
  await page
    .getByLabel("Plan name", { exact: true })
    .fill("Different source title");
  await page.getByRole("button", { name: "Save plan", exact: true }).click();
  expect((await root(page)).activeWorkout).toEqual(a);
});
test("J04 export, DELETE clear, refresh empty and import round trip", async ({
  page,
}) => {
  await start(page);
  await complete(page);
  const before = await root(page);
  await page.goto("/settings");
  const promise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export data", exact: true }).click();
  const download = await promise;
  const content = readFileSync((await download.path())!, "utf8");
  expect(JSON.parse(content)).toEqual(before);
  await page
    .getByRole("button", { name: "Clear personal data", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Clear personal data", exact: true }),
  ).toBeDisabled();
  await page.getByRole("dialog").getByRole("textbox").fill("DELETE");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Clear personal data", exact: true })
    .click();
  await expect(
    page.getByText("Personal data cleared.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  expect((await root(page)).workouts).toEqual([]);
  await page.getByLabel("Import JSON backup").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(content),
  });
  await expect(page.getByRole("dialog")).toContainText(
    "Includes an active workout",
  );
  await snap(page, "state-import-preview");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  expect((await root(page)).workouts).toEqual([]);
  await page.getByLabel("Import JSON backup").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(content),
  });
  await page
    .getByRole("button", { name: "Replace all data", exact: true })
    .click();
  await expect(
    page.getByText("Backup imported.", { exact: true }),
  ).toBeVisible();
  const after = await root(page);
  expect({ ...after, revision: 0 }).toEqual({ ...before, revision: 0 });
});
test("J05 quota on finish, retry once, recovery leaves raw bytes intact", async ({
  page,
}) => {
  await start(page);
  await complete(page);
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Object.defineProperty(window, "restoreStorage", {
      value: () => {
        Storage.prototype.setItem = original;
      },
    });
    Storage.prototype.setItem = () => {
      throw new DOMException("Quota", "QuotaExceededError");
    };
  });
  await page
    .getByRole("button", { name: "Finish workout", exact: true })
    .click();
  await page.getByRole("button", { name: "Save workout", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("previous data is safe");
  await snap(page, "state-storage-error");
  expect((await root(page)).activeWorkout).not.toBeNull();
  expect((await root(page)).workouts).toHaveLength(2);
  await page.evaluate(() => {
    (window as unknown as { restoreStorage: () => void }).restoreStorage();
  });
  await page.getByRole("button", { name: "Save workout", exact: true }).click();
  await expect(page).not.toHaveURL(/active/);
  expect((await root(page)).workouts).toHaveLength(3);
  await page.evaluate((key) => localStorage.setItem(key, "{broken"), KEY);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Let's recover your workspace." }),
  ).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), KEY)).toBe(
    "{broken",
  );
});
test("J06 real two-tab storage conflict and unsupported lock fallback", async ({
  page,
  context,
}) => {
  const b = await context.newPage();
  await b.goto("/settings");
  await page.goto("/settings");
  await page
    .getByRole("combobox", { name: "Weight unit", exact: true })
    .selectOption("lb");
  await expect(b.getByRole("alert")).toContainText("another tab");
  await expect(
    b.getByRole("combobox", { name: "Weight unit", exact: true }),
  ).toBeDisabled();
  await b.close();
  await page.reload();
  await page.evaluate(() => {
    Object.defineProperty(navigator, "locks", {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(window, "indexedDB", {
      value: undefined,
      configurable: true,
    });
  });
  await page
    .getByRole("combobox", { name: "Weight unit", exact: true })
    .selectOption("kg");
  await expect(page.getByRole("alert")).toContainText("Web Locks");
  expect((await root(page)).preferences.weightUnit).toBe("lb");
});
test("J07 units preserve kg, body weight overwrite and future validation", async ({
  page,
}) => {
  const before = await root(page);
  await page.goto("/settings");
  await page
    .getByRole("combobox", { name: "Weight unit", exact: true })
    .selectOption("lb");
  await expect
    .poll(async () => (await root(page)).preferences.weightUnit)
    .toBe("lb");
  await page
    .getByRole("combobox", { name: "Weight unit", exact: true })
    .selectOption("kg");
  await expect
    .poll(async () => (await root(page)).preferences.weightUnit)
    .toBe("kg");
  expect((await root(page)).workouts).toEqual(before.workouts);
  await page.goto("/progress");
  await page.getByLabel("Date", { exact: true }).fill("2026-10-16");
  await page.getByLabel("Weight (kg)", { exact: true }).fill("73");
  await page.getByRole("button", { name: "Log weight", exact: true }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  expect((await root(page)).bodyWeights[1].weightKg).toBe(72.2);
  await page.getByRole("button", { name: "Log weight", exact: true }).click();
  await page
    .getByRole("button", { name: "Replace entry", exact: true })
    .click();
  await expect
    .poll(async () => (await root(page)).bodyWeights[1].weightKg)
    .toBe(73);
});
test("J08 search, combined filters, direct routes and unknown IDs", async ({
  page,
}) => {
  await page.goto("/exercises");
  await page.getByLabel("Search exercises", { exact: true }).fill("  BeNcH  ");
  await expect(page.locator(".exercise-card")).toHaveCount(1);
  await page
    .getByRole("combobox", { name: "Equipment", exact: true })
    .selectOption("Dumbbell");
  await expect(
    page.getByText("No matches found.", { exact: false }),
  ).toBeVisible();
  await snap(page, "state-no-results");
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await expect(page.locator(".exercise-card")).toHaveCount(9);
  await page.goto("/workouts?q=upper&range=7");
  await expect(page.locator(".workout-link")).toHaveCount(1);
  await page.reload();
  await expect(page.getByLabel("Search workouts")).toHaveValue("upper");
  for (const route of [
    "/missing",
    "/plans/nope",
    "/exercises/nope",
    "/workouts/nope",
  ]) {
    await page.goto(route);
    await expect(
      page.getByText("This item could not be found.", { exact: true }),
    ).toBeVisible();
  }
});
test("visual collection, all six routes, responsive overflow and automated accessibility", async ({
  page,
}) => {
  // This aggregate runs 18 axe scans plus responsive checks; product latency budgets are separate.
  test.setTimeout(120000);
  for (const [name, path] of [
    ["dashboard", "/"],
    ["workouts", "/workouts"],
    ["plans", "/plans"],
    ["plan-detail", "/plans/plan-upper"],
    ["plan-editor", "/plans/new"],
    ["exercises", "/exercises"],
    ["exercise-detail", "/exercises/ex-bench"],
    ["progress", "/progress"],
    ["settings", "/settings"],
  ]) {
    await page.goto(path);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await snap(page, "desktop-" + name);
    const a = await new AxeBuilder({ page }).analyze();
    expect(
      a.violations.filter((v) =>
        ["serious", "critical"].includes(v.impact ?? ""),
      ),
      name,
    ).toEqual([]);
    await page.setViewportSize({ width: 390, height: 844 });
    await snap(page, "mobile-" + name);
    const mobileAudit = await new AxeBuilder({ page }).analyze();
    expect(
      mobileAudit.violations.filter((v) =>
        ["serious", "critical"].includes(v.impact ?? ""),
      ),
      name + " mobile",
    ).toEqual([]);
    for (const width of [320, 360, 768, 1024, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        name + " " + width,
      ).toBe(true);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      name,
    ).toBe(true);
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  await page.goto("/");
  await start(page);
  await snap(page, "desktop-recorder");
  for (const width of [320, 360, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "recorder " + width,
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await snap(page, "mobile-recorder");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await snap(page, "mobile-navigation");
  await page.getByRole("button", { name: "Close dialog" }).click();
});

test("J09 keyboard-only main chain, modal trap and focus return on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Start workout", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/active/);
  const done = page
    .getByRole("button", { name: "Set 1 done", exact: true })
    .first();
  await done.focus();
  await page.keyboard.press("Space");
  await expect(done).toHaveAttribute("aria-pressed", "true");
  const finish = page.getByRole("button", {
    name: "Finish workout",
    exact: true,
  });
  await finish.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(finish).toBeFocused();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("button", { name: "Save workout", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).not.toHaveURL(/active/);
  await page.goto("/settings");
  const goal = page.getByRole("textbox", {
    name: "Weekly workout goal",
    exact: true,
  });
  await goal.focus();
  await goal.fill("4");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect
    .poll(async () => (await root(page)).preferences.weeklyGoal)
    .toBe(4);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.keyboard.press("Tab");
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Dashboard", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeFocused();
});

test("history deletion recomputes records; immutable details and filtered zero results", async ({
  page,
}) => {
  await page.goto("/workouts/workout-upper-001");
  await page
    .getByRole("button", { name: "Delete workout", exact: true })
    .click();
  await snap(page, "state-delete-confirmation");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  expect((await root(page)).workouts).toHaveLength(2);
  await page
    .getByRole("button", { name: "Delete workout", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete workout", exact: true })
    .click();
  await expect(page).toHaveURL(/\/workouts$/);
  await page.goto("/progress");
  await expect(
    page.getByRole("row").filter({ hasText: "Bench Press" }),
  ).toHaveCount(0);
  await page.goto("/workouts?q=missing");
  await expect(
    page.getByText("No matches found.", { exact: false }),
  ).toBeVisible();
});

test("set add/remove, zero load, rest controls, replacement confirmation and empty recorder", async ({
  page,
}) => {
  await start(page);
  let first = page.locator(".exercise-panel").first();
  await first
    .getByRole("button", { name: "Remove set 1", exact: true })
    .click();
  await expect(first.locator(".set-number")).toHaveCount(2);
  await first.getByRole("button", { name: "Add set", exact: true }).click();
  await expect(first.locator(".set-number")).toHaveCount(3);
  await first.getByLabel("Set 1 weight (kg)", { exact: true }).fill("0");
  await complete(page);
  await expect
    .poll(
      async () =>
        (await root(page)).activeWorkout!.exercises[0].sets[0].weightKg,
    )
    .toBe(0);
  await page.getByLabel("Duration").selectOption("30");
  await page
    .getByRole("button", { name: "Restart timer", exact: true })
    .click();
  await expect
    .poll(async () => (await root(page)).activeWorkout!.rest?.durationSeconds)
    .toBe(30);
  await page.getByRole("button", { name: "Skip rest", exact: true }).click();
  await expect
    .poll(async () => (await root(page)).activeWorkout!.rest)
    .toBeNull();
  await first.getByRole("button", { name: "Replace", exact: true }).click();
  await page
    .getByRole("article")
    .filter({ hasText: "Push-up" })
    .getByRole("button", { name: "Select", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Replace exercise", exact: true })
    .click();
  first = page.locator(".exercise-panel").first();
  await expect(
    first.getByRole("heading", { name: "Push-up", exact: true }),
  ).toBeVisible();
  expect((await root(page)).activeWorkout!.exercises[0].sets[0].completed).toBe(
    false,
  );
  for (const name of ["Push-up", "Barbell Row", "Overhead Press"]) {
    await page
      .getByRole("button", { name: "Remove " + name, exact: true })
      .click();
  }
  await expect(
    page.getByRole("button", { name: "Add exercise", exact: true }),
  ).toBeEnabled();
  await expect(page.locator(".exercise-panel")).toHaveCount(0);
  await page.getByRole("button", { name: "Add exercise", exact: true }).click();
  await page
    .getByRole("article")
    .filter({ hasText: "Dead Bug" })
    .getByRole("button", { name: "View details", exact: true })
    .click();
  await expect(page.getByRole("dialog").last()).toContainText(
    "Lie on your back",
  );
  await page
    .getByRole("button", { name: "Select exercise", exact: true })
    .click();
  await expect(
    page.locator(".exercise-panel").getByRole("heading", { name: "Dead Bug" }),
  ).toBeVisible();
});

test("safe imports reject hostile values, failed replacement retains root, empty state and XSS text", async ({
  page,
}) => {
  await page.goto("/settings");
  const before = await root(page);
  for (const raw of [
    '{"schemaVersion":99}',
    '{"__proto__":{}}',
    JSON.stringify({ ...before, extra: "not allowed" }),
    " ".repeat(2 * 1024 * 1024 + 1),
  ]) {
    await page.getByLabel("Import JSON backup").setInputFiles({
      name: "bad.json",
      mimeType: "application/json",
      buffer: Buffer.from(raw),
    });
    await expect(page.getByRole("alert")).toBeVisible();
    expect(await root(page)).toEqual(before);
  }
  const safe = structuredClone(before);
  safe.plans[0].name = "<img src=x onerror=alert(1)>";
  await page.getByLabel("Import JSON backup").setInputFiles({
    name: "safe.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(safe)),
  });
  await page
    .getByRole("button", { name: "Replace all data", exact: true })
    .click();
  await expect(
    page.getByText("Backup imported.", { exact: true }),
  ).toBeVisible();
  await page.goto("/plans/plan-upper");
  await expect(
    page.getByRole("heading", {
      name: "<img src=x onerror=alert(1)>",
      exact: true,
    }),
  ).toBeVisible();
  expect(await page.locator("img").count()).toBe(0);
  await page.goto("/settings");
  await page
    .getByRole("button", { name: "Clear personal data", exact: true })
    .click();
  await page.getByRole("dialog").getByRole("textbox").fill("DELETE");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Clear personal data", exact: true })
    .click();
  await expect(
    page.getByText("Personal data cleared.", { exact: true }),
  ).toBeVisible();
  await page.goto("/");
  await expect(
    page.getByText("Choose a plan to make your next session easier.", {
      exact: false,
    }),
  ).toBeVisible();
  await snap(page, "state-empty-dashboard");
  await page.goto("/progress");
  await expect(
    page.getByText("Complete a workout to see your personal records.", {
      exact: true,
    }),
  ).toBeVisible();
});

test("browser Back cannot discard an invalid recorder draft", async ({
  page,
}) => {
  await start(page);
  await page.getByLabel("Set 1 reps", { exact: true }).first().fill("0");
  await page.goBack();
  await expect(page.getByRole("dialog")).toContainText("Unsaved changes");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByLabel("Set 1 reps", { exact: true }).first(),
  ).toHaveValue("0");
});

test("custom plan deletion cancels safely and preserves independent active and completed snapshots", async ({
  page,
}) => {
  await page.goto("/plans/plan-upper");
  await expect(
    page.getByRole("button", { name: "Edit plan", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Delete plan", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Copy plan", exact: true }).click();
  await page
    .getByLabel("Plan name", { exact: true })
    .fill("Temporary custom plan");
  await page.getByRole("button", { name: "Save plan", exact: true }).click();
  await page.getByRole("button", { name: "Use plan", exact: true }).click();
  await start(page);
  await complete(page);
  const active = (await root(page)).activeWorkout!;
  await page.goto("/plans/" + active.sourcePlanId);
  await page.getByRole("button", { name: "Delete plan", exact: true }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(
    (await root(page)).plans.some((p) => p.id === active.sourcePlanId),
  ).toBe(true);
  await page.getByRole("button", { name: "Delete plan", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete plan", exact: true })
    .click();
  await expect(page).toHaveURL(/\/plans$/);
  const d = await root(page);
  expect(d.activePlanId).toBeNull();
  expect(d.activeWorkout).toEqual(active);
  expect(d.workouts).toEqual(seed.workouts);
  await page.goto("/workouts/active");
  await page
    .getByRole("button", { name: "Finish workout", exact: true })
    .click();
  await page.getByRole("button", { name: "Save workout", exact: true }).click();
  await expect(page).not.toHaveURL(/active/);
  const completed = (await root(page)).workouts.at(-1)!;
  expect(completed.name).toBe("Temporary custom plan");
  expect(completed.sourcePlanId).toBe(active.sourcePlanId);
});

test("failed import preserves bytes and preview for a successful explicit retry", async ({
  page,
}) => {
  await page.goto("/settings");
  await page
    .getByRole("textbox", { name: "Weekly workout goal", exact: true })
    .fill("4");
  await page.getByRole("button", { name: "Save goal", exact: true }).click();
  await expect(
    page.getByText("Weekly goal saved.", { exact: true }),
  ).toBeVisible();
  const before = await root(page);
  const replacement = structuredClone(before);
  replacement.preferences.weeklyGoal = 5;
  await page.getByLabel("Import JSON backup").setInputFiles({
    name: "restore.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(replacement)),
  });
  await page.evaluate(() => {
    const set = Storage.prototype.setItem;
    Object.defineProperty(window, "restoreImportStorage", {
      value: () => {
        Storage.prototype.setItem = set;
      },
    });
    Storage.prototype.setItem = () => {
      throw new DOMException("full", "QuotaExceededError");
    };
  });
  await page
    .getByRole("button", { name: "Replace all data", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("previous data is safe");
  await expect(page.locator(".success")).toHaveCount(0);
  expect(await root(page)).toEqual(before);
  await page.evaluate(() =>
    (
      window as unknown as { restoreImportStorage: () => void }
    ).restoreImportStorage(),
  );
  await page
    .getByRole("button", { name: "Replace all data", exact: true })
    .click();
  await expect(
    page.getByText("Backup imported.", { exact: true }),
  ).toBeVisible();
  expect((await root(page)).preferences.weeklyGoal).toBe(5);
  await expect(
    page.getByRole("textbox", { name: "Weekly workout goal", exact: true }),
  ).toHaveValue("5");
});

test("IndexedDB fallback coordinates tabs when Web Locks is unavailable", async ({
  page,
  context,
}) => {
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "locks", {
      value: undefined,
      configurable: true,
    });
  });
  await page.reload();
  const before = await root(page);
  const b = await context.newPage();
  await b.clock.setFixedTime(clock);
  await b.goto("/settings");
  await page.goto("/settings");
  await page
    .getByRole("combobox", { name: "Weight unit", exact: true })
    .selectOption("lb");
  await expect(
    page.getByText("Preferences saved.", { exact: true }),
  ).toBeVisible();
  await expect(b.getByRole("alert")).toContainText("another tab");
  expect((await root(page)).revision).toBe(before.revision + 1);
  expect((await root(page)).preferences.weightUnit).toBe("lb");
  await b.reload();
  await b
    .getByRole("combobox", { name: "Weight unit", exact: true })
    .selectOption("kg");
  await expect(
    b.getByText("Preferences saved.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("another tab");
  expect((await root(b)).revision).toBe(before.revision + 2);
  await b.close();
});

test("simultaneous first launch seeds once under exclusion and never overwrites a started workout", async ({
  page,
  context,
}) => {
  await page.evaluate(() => localStorage.removeItem("forma.app.v1"));
  await page.goto("about:blank");
  const a = await context.newPage(),
    b = await context.newPage();
  await a.clock.setFixedTime(clock);
  await b.clock.setFixedTime(clock);
  await Promise.all([a.goto("/"), b.goto("/")]);
  await expect(
    a.getByRole("heading", { name: "Dashboard", exact: true }),
  ).toBeVisible();
  await expect(
    b.getByRole("heading", { name: "Dashboard", exact: true }),
  ).toBeVisible();
  expect((await root(a)).revision).toBe(1);
  await a.getByRole("button", { name: "Start workout", exact: true }).click();
  await expect(a).toHaveURL(/active/);
  const active = (await root(a)).activeWorkout!;
  await b.reload();
  await expect(
    b
      .locator(".page-head")
      .getByRole("button", { name: "Resume workout", exact: true }),
  ).toBeVisible();
  expect((await root(b)).activeWorkout!.id).toBe(active.id);
  await a.close();
  await b.close();
});

test("blocked storage getter shows recovery instead of a blank page", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("Storage blocked", "SecurityError");
      },
    });
  });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Let's recover your workspace." }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toContainText(
    "We couldn't read your saved data.",
  );
  await page
    .getByRole("button", { name: "Download raw backup", exact: true })
    .click();
  await expect(page.getByRole("alert").last()).toContainText(
    "could not be read",
  );
});

test("confirmed recovery reset keeps an initialized empty workspace", async ({
  page,
}) => {
  await page.evaluate(() => localStorage.setItem("forma.app.v1", "{broken"));
  await page.reload();
  await page
    .getByRole("button", { name: "Reset local storage", exact: true })
    .click();
  await page.getByLabel("Type DELETE", { exact: true }).fill("DELETE");
  await page.getByRole("button", { name: "Reset data", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Dashboard", exact: true }),
  ).toBeVisible();
  expect((await root(page)).initialized).toBe(true);
  expect((await root(page)).workouts).toEqual([]);
  await page.reload();
  expect((await root(page)).workouts).toEqual([]);
});

test("lb body weight edit preserves a canonical upper-bound value without rounding it back", async ({
  page,
}) => {
  const d = await root(page);
  d.bodyWeights[1].weightKg = 350;
  await page.evaluate(
    (d) => localStorage.setItem("forma.app.v1", JSON.stringify(d)),
    d,
  );
  await page.reload();
  await page.goto("/settings");
  await page
    .getByRole("combobox", { name: "Weight unit", exact: true })
    .selectOption("lb");
  await expect(
    page.getByText("Preferences saved.", { exact: true }),
  ).toBeVisible();
  await page.goto("/progress");
  await page
    .getByRole("row")
    .filter({ hasText: "2026-10-16" })
    .getByRole("button", { name: "Edit", exact: true })
    .click();
  await expect(page.getByLabel("Weight (lb)", { exact: true })).toHaveValue(
    "771.62",
  );
  await page.getByRole("button", { name: "Log weight", exact: true }).click();
  await page
    .getByRole("button", { name: "Replace entry", exact: true })
    .click();
  await expect(page.getByText("Weight saved.", { exact: true })).toBeVisible();
  expect(
    (await root(page)).bodyWeights.find((b) => b.date === "2026-10-16")!
      .weightKg,
  ).toBe(350);
  await page.getByLabel("Weight (lb)", { exact: true }).fill("44.09");
  await page.getByRole("button", { name: "Log weight", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("44.1");
  await expect(page.getByRole("alert")).toContainText("lb");
});

test("custom plan rest duration survives restart, expiry and reload", async ({
  page,
}) => {
  const d = await root(page);
  const p = structuredClone(d.plans[0]);
  p.id = "plan-custom-rest";
  p.isTemplate = false;
  p.exercises[0].restSeconds = 67;
  d.plans.push(p);
  d.activePlanId = p.id;
  await page.evaluate(
    (d) => localStorage.setItem("forma.app.v1", JSON.stringify(d)),
    d,
  );
  await page.reload();
  await start(page);
  await complete(page);
  const select = page.getByRole("combobox", { name: "Duration", exact: true });
  await expect(select).toHaveValue("67");
  await page
    .getByRole("button", { name: "Restart timer", exact: true })
    .click();
  expect((await root(page)).activeWorkout!.rest!.durationSeconds).toBe(67);
  await page.clock.setFixedTime(new Date(clock.getTime() + 90000));
  await expect(page.getByText("Rest complete", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Restart timer", exact: true })
    .click();
  await expect(select).toHaveValue("67");
  await select.selectOption("30");
  await page
    .getByRole("button", { name: "Restart timer", exact: true })
    .click();
  await expect
    .poll(async () => (await root(page)).activeWorkout!.rest!.durationSeconds)
    .toBe(30);
  await page.reload();
  await expect(select).toHaveValue("30");
  expect((await root(page)).activeWorkout!.rest!.durationSeconds).toBe(30);
});

test("replacing one exercise preserves an invalid completed-set draft in another exercise", async ({
  page,
}) => {
  await start(page);
  const panels = page.locator(".exercise-panel");
  for (let i = 0; i < 3; i++) {
    const done = panels
      .nth(i)
      .getByRole("button", { name: "Set 1 done", exact: true });
    await done.click();
    await expect(done).toHaveAttribute("aria-pressed", "true");
  }
  await panels.nth(1).getByLabel("Set 1 reps", { exact: true }).fill("0");
  await panels
    .first()
    .getByRole("button", { name: "Replace", exact: true })
    .click();
  await page
    .getByRole("article")
    .filter({ hasText: "Push-up" })
    .getByRole("button", { name: "Select", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Replace exercise", exact: true })
    .click();
  await expect(
    panels.first().getByRole("heading", { name: "Push-up", exact: true }),
  ).toBeVisible();
  await expect(
    panels.nth(1).getByLabel("Set 1 reps", { exact: true }),
  ).toHaveValue("0");
  await expect(
    page.getByRole("button", { name: "Finish workout", exact: true }),
  ).toBeDisabled();
  await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Unsaved changes");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    panels.nth(1).getByLabel("Set 1 reps", { exact: true }),
  ).toHaveValue("0");
});

test("one click adds a set after editing the preceding set and copies committed values", async ({
  page,
}) => {
  await start(page);
  const panel = page.locator(".exercise-panel").first();
  await panel.getByLabel("Set 3 weight (kg)", { exact: true }).fill("42.5");
  await panel.getByLabel("Set 3 reps", { exact: true }).fill("8");
  await panel.getByRole("button", { name: "Add set", exact: true }).click();
  await expect(panel.locator(".set-number")).toHaveCount(4);
  const last = (await root(page)).activeWorkout!.exercises[0].sets.at(-1)!;
  expect(last).toMatchObject({ weightKg: 42.5, reps: 8, completed: false });
});
