import { createPortal } from "react-dom";
import { useEffect, useRef, useId, type ReactNode } from "react";
import { X } from "lucide-react";
export function Modal({
  title,
  children,
  close,
  locked = false,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
  locked?: boolean;
}) {
  const titleId = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const previous = useRef(document.activeElement);
  useEffect(() => {
    const prev = previous.current;
    ref.current?.showModal();
    ref.current?.querySelector<HTMLElement>("button")?.focus();
    return () => {
      if (
        prev instanceof HTMLElement &&
        prev.isConnected &&
        !prev.matches(":disabled")
      )
        prev.focus();
      else document.querySelector<HTMLElement>("main h1")?.focus();
    };
  }, []);
  return createPortal(
    <dialog
      tabIndex={-1}
      aria-busy={locked}
      ref={ref}
      aria-labelledby={titleId}
      onKeyDown={(e) => {
        if (e.key !== "Tab") return;
        e.stopPropagation();
        const controls = Array.from(
          e.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]',
          ),
        ).filter(
          (node) =>
            node.getClientRects().length > 0 &&
            node.closest("dialog") === e.currentTarget,
        );
        if (!controls.length) {
          e.preventDefault();
          e.currentTarget.focus();
          return;
        }
        e.preventDefault();
        const index = controls.indexOf(document.activeElement as HTMLElement);
        controls[
          index < 0
            ? e.shiftKey
              ? controls.length - 1
              : 0
            : (index + (e.shiftKey ? -1 : 1) + controls.length) %
              controls.length
        ].focus();
      }}
      onCancel={(e) => {
        e.preventDefault();
        if (!locked) close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !locked) close();
      }}
    >
      <div className="modal-head">
        <h2 id={titleId}>{title}</h2>
        <button
          disabled={locked}
          autoFocus
          className="icon-button"
          aria-label="Close dialog"
          title="Close dialog"
          onClick={() => {
            if (!locked) close();
          }}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>,
    document.body,
  );
}
