import React from "react";
import { render, screen, act, cleanup } from "@testing-library/react";
import { it, expect, vi } from "vitest";
import { LiveTimer } from "../../src/components/LiveTimer";
it("runs 30 minutes without rerendering sibling workout rows and clears its interval", () => {
  vi.useFakeTimers();
  const start = new Date("2026-10-18T04:00:00Z");
  vi.setSystemTime(start);
  const row = vi.fn(() => <div>Workout set row</div>);
  const Row = row;
  const { unmount } = render(
    <>
      <Row />
      <LiveTimer
        startedAt={start.toISOString()}
        rest={{
          durationSeconds: 90,
          endsAt: new Date(start.getTime() + 90000).toISOString(),
        }}
      />
    </>,
  );
  expect(row).toHaveBeenCalledOnce();
  act(() => vi.advanceTimersByTime(1800000));
  expect(screen.getByText("Rest complete")).toBeTruthy();
  expect(screen.getByText("30m")).toBeTruthy();
  expect(row).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(1);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
  cleanup();
  vi.useRealTimers();
});
