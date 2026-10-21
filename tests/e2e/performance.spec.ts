import { test, expect, type Page, type Locator } from "@playwright/test";
import { writeFileSync, readFileSync } from "node:fs";
import type { Data } from "../../src/domain/model";
import { capacity } from "../capacity";
const seed = JSON.parse(
  readFileSync(new URL("../../fixtures/seed.json", import.meta.url), "utf8"),
) as Data;
async function responseTime(page: Page, button: Locator, heading?: string) {
  await page.evaluate((heading) => {
    const measured = window as unknown as { formaMeasurement: number | null };
    measured.formaMeasurement = null;
    let started = 0;
    const begin = () => {
      started = performance.now();
    };
    document.addEventListener("pointerdown", begin, {
      capture: true,
      once: true,
    });
    const before = document
      .querySelector('button[aria-label="Set 1 done"]')
      ?.getAttribute("aria-pressed");
    const observer = new MutationObserver(() => {
      const target = heading
        ? document.querySelector("h1")?.textContent === heading
        : document
            .querySelector('button[aria-label="Set 1 done"]')
            ?.getAttribute("aria-pressed") !== before;
      if (started && target) {
        measured.formaMeasurement = performance.now() - started;
        observer.disconnect();
      }
    });
    observer.observe(document.querySelector("main")!, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["aria-pressed"],
    });
  }, heading);
  await button.click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { formaMeasurement: number | null })
            .formaMeasurement,
      ),
    )
    .not.toBeNull();
  return page.evaluate(
    () => (window as unknown as { formaMeasurement: number }).formaMeasurement,
  );
}
test("capacity 200 sessions / 50 plans / 200 exercises / 730 weights; 20-sample interaction and route p95", async ({
  page,
  browserName,
  browser,
}) => {
  test.setTimeout(90000);
  await page.clock.install({ time: new Date("2026-10-18T04:00:00Z") });
  await page.goto("/");
  const large = capacity(seed);
  expect(Buffer.byteLength(JSON.stringify(large))).toBeLessThan(
    2 * 1024 * 1024,
  );
  await page.evaluate(
    (d) => localStorage.setItem("forma.app.v1", JSON.stringify(d)),
    large,
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Dashboard", exact: true }),
  ).toBeVisible();
  const measurements: Record<string, number[]> = {
    dashboard: [],
    progress: [],
    toggle: [],
  };
  const cold = {
    progress: await responseTime(
      page,
      page.getByRole("link", { name: "Progress", exact: true }),
      "Progress",
    ),
    dashboard: await responseTime(
      page,
      page.getByRole("link", { name: "Dashboard", exact: true }),
      "Dashboard",
    ),
  };
  for (let i = 0; i < 20; i++) {
    for (const name of ["progress", "dashboard"]) {
      const label = name === "progress" ? "Progress" : "Dashboard";
      measurements[name].push(
        await responseTime(
          page,
          page.getByRole("link", { name: label, exact: true }),
          label,
        ),
      );
    }
  }
  await page
    .getByRole("button", { name: "Start workout", exact: true })
    .click();
  const done = page
    .getByRole("button", { name: "Set 1 done", exact: true })
    .first();
  for (let i = 0; i < 20; i++) {
    measurements.toggle.push(await responseTime(page, done));
  }
  const p95 = Object.fromEntries(
    Object.entries(measurements).map(([k, v]) => [
      k,
      [...v].sort((a, b) => a - b)[Math.ceil(v.length * 0.95) - 1],
    ]),
  );
  writeFileSync(
    `evidence/performance-${browserName}.json`,
    JSON.stringify(
      {
        engine: browserName,
        version: browser.version(),
        method:
          "In-page performance.now: capture pointerdown to MutationObserver delivery for changed heading (same React commit as the main data) or changed Done aria-pressed. Excludes Playwright round trips. Loaded dataset; warm navigation; no animation is used as a proxy.",
        data: {
          workouts: 200,
          plans: 50,
          exercises: 200,
          bodyWeights: 730,
          bytes: Buffer.byteLength(JSON.stringify(large)),
        },
        cold,
        measurements,
        p95,
      },
      null,
      2,
    ),
  );
  expect(p95.dashboard).toBeLessThanOrEqual(1000);
  expect(p95.progress).toBeLessThanOrEqual(1000);
  expect(p95.toggle).toBeLessThanOrEqual(200);
});
