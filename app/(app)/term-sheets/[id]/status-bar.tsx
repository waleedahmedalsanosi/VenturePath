"use client";

import { useTransition } from "react";

import { setTermSheetStatus, deleteTermSheet } from "../../rounds/[id]/term-sheet-actions";

type Status = "draft" | "sent" | "signed" | "declined" | "withdrawn";

const STATUS_META: Record<Status, { label: string; bg: string; fg: string }> = {
  draft:     { label: "Draft",     bg: "bg-(--color-surface-bright)", fg: "text-(--color-on-surface-variant)" },
  sent:      { label: "Sent",      bg: "bg-(--color-info)/10",        fg: "text-(--color-info)" },
  signed:    { label: "Signed",    bg: "bg-(--color-success)/15",     fg: "text-(--color-success)" },
  declined:  { label: "Declined",  bg: "bg-(--color-error)/10",       fg: "text-(--color-error)" },
  withdrawn: { label: "Withdrawn", bg: "bg-(--color-surface-bright)", fg: "text-(--color-on-surface-disabled)" },
};

export function TermSheetStatusBar({
  termSheetId,
  status,
  sentAt,
  signedAt,
}: {
  termSheetId: string;
  status: Status;
  sentAt: string | null;
  signedAt: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  function set(next: Status) {
    startTransition(async () => {
      await setTermSheetStatus(termSheetId, next);
    });
  }

  function onDelete() {
    if (!confirm("Delete this term sheet? This cannot be undone via the UI.")) return;
    startTransition(async () => {
      await deleteTermSheet(termSheetId);
    });
  }

  const m = STATUS_META[status];

  return (
    <div className="rounded-xl bg-(--color-surface-container-low) px-5 py-4 flex flex-wrap items-center gap-3">
      <span
        className={`inline-flex items-center rounded-full px-3 py-0.5 text-label-sm font-medium uppercase tracking-wider ${m.bg} ${m.fg}`}
      >
        {m.label}
      </span>
      {sentAt && (
        <span className="text-body-sm text-(--color-on-surface-variant)">
          Sent {new Date(sentAt).toLocaleDateString()}
        </span>
      )}
      {signedAt && (
        <span className="text-body-sm text-(--color-success)">
          Signed {new Date(signedAt).toLocaleDateString()}
        </span>
      )}
      <div className="flex-1" />
      <div className="flex items-center gap-2 flex-wrap">
        {status === "draft" && (
          <button
            type="button"
            onClick={() => set("sent")}
            disabled={isPending}
            className="rounded-lg bg-(--color-info)/15 px-4 py-1.5 text-label-sm text-(--color-info) hover:bg-(--color-info)/25 disabled:opacity-50"
          >
            Mark as sent
          </button>
        )}
        {(status === "draft" || status === "sent") && (
          <>
            <button
              type="button"
              onClick={() => set("signed")}
              disabled={isPending}
              className="rounded-lg bg-(--color-success)/15 px-4 py-1.5 text-label-sm text-(--color-success) hover:bg-(--color-success)/25 disabled:opacity-50"
            >
              Mark as signed
            </button>
            <button
              type="button"
              onClick={() => set("declined")}
              disabled={isPending}
              className="rounded-lg bg-(--color-error)/10 px-4 py-1.5 text-label-sm text-(--color-error) hover:bg-(--color-error)/20 disabled:opacity-50"
            >
              Declined
            </button>
          </>
        )}
        {status !== "draft" && (
          <button
            type="button"
            onClick={() => set("draft")}
            disabled={isPending}
            className="rounded-lg ghost-border px-4 py-1.5 text-label-sm text-(--color-on-surface-variant) hover:bg-(--color-surface-container-high) disabled:opacity-50"
          >
            Reset to draft
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          disabled={isPending}
          className="text-label-sm text-(--color-on-surface-variant) hover:text-(--color-error) px-3 py-1.5 disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
