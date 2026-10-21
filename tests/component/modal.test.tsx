import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { it, expect, vi, afterEach } from "vitest";
import { Modal } from "../../src/components/Modal";
afterEach(cleanup);
it("opens a labeled native modal, handles cancellation and restores focus", () => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (
    this: HTMLDialogElement,
  ) {
    this.setAttribute("open", "");
  });
  const close = vi.fn();
  const trigger = document.createElement("button");
  document.body.append(trigger);
  trigger.focus();
  const { unmount } = render(
    <Modal title="Discard this workout?" close={close}>
      <p>Your current workout will be permanently removed.</p>
      <input aria-label="Confirmation" />
    </Modal>,
  );
  expect(screen.getByRole("dialog").getAttribute("aria-labelledby")).toBe(
    screen.getByRole("heading", { name: "Discard this workout?" }).id,
  );
  expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledOnce();
  fireEvent(
    screen.getByRole("dialog"),
    new Event("cancel", { bubbles: true, cancelable: true }),
  );
  expect(close).toHaveBeenCalledOnce();
  unmount();
  expect(document.activeElement).toBe(trigger);
  trigger.remove();
});
it("safe close button is accessible", () => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (
    this: HTMLDialogElement,
  ) {
    this.setAttribute("open", "");
  });
  const close = vi.fn();
  render(
    <Modal title="Import backup?" close={close}>
      <p>Importing will replace all data on this device.</p>
    </Modal>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
  expect(close).toHaveBeenCalledOnce();
});

it("keeps a committing confirmation open until its actual write resolves", () => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (
    this: HTMLDialogElement,
  ) {
    this.setAttribute("open", "");
  });
  const close = vi.fn();
  render(
    <Modal title="Saving workout" close={close} locked>
      <p>Saving</p>
    </Modal>,
  );
  expect(screen.getByRole("button", { name: "Close dialog" })).toHaveProperty(
    "disabled",
    true,
  );
  fireEvent(
    screen.getByRole("dialog"),
    new Event("cancel", { bubbles: true, cancelable: true }),
  );
  expect(close).not.toHaveBeenCalled();
});
