"use client";

import { useState, useTransition } from "react";

import { addBlocker, toggleBlocker, deleteBlocker } from "./blocker-actions";

interface Blocker {
  id: string;
  title: string;
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

interface BlockersProps {
  roundId: string;
  blockers: Blocker[];
  canEdit: boolean;
}

export function Blockers({ roundId, blockers, canEdit }: BlockersProps) {
  const [showInput, setShowInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await addBlocker(roundId, fd);
      if (!result.ok) setError(result.error ?? "Failed.");
      else { setShowInput(false); (e.target as HTMLFormElement).reset(); }
    });
  }

  function handleToggle(blockerId: string, current: boolean) {
    startTransition(async () => {
      await toggleBlocker(blockerId, roundId, !current);
    });
  }

  function handleDelete(blockerId: string) {
    if (!confirm("Remove this blocker?")) return;
    startTransition(async () => {
      await deleteBlocker(blockerId, roundId);
    });
  }

  const open = blockers.filter((b) => !b.resolved);
  const resolved = blockers.filter((b) => b.resolved);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
          Blockers to close
          {open.length > 0 && (
            <span className="ms-2 inline-flex items-center rounded-full bg-(--color-warning)/15 text-(--color-warning) px-2 py-0.5 text-label-sm font-medium">
              {open.length} open
            </span>
          )}
        </h2>
        {canEdit && (
          <button
            type="button"
            onClick={() => { setShowInput((v) => !v); setError(null); }}
            className="rounded-lg ghost-border px-4 py-2 text-label-sm hover:bg-(--color-surface-container-high)"
          >
            {showInput ? "Cancel" : "+ Add blocker"}
          </button>
        )}
      </div>

      {showInput && canEdit && (
        <form onSubmit={handleAdd}
          className="rounded-xl bg-(--color-surface-container-low) p-4 flex flex-col gap-3 sm:flex-row sm:items-start">
          <input
            name="title"
            required
            maxLength={300}
            autoFocus
            placeholder="e.g. Sign lead investor term sheet; KYC approval for Sanabil…"
            className="flex-1 rounded-lg bg-(--color-surface-container-high) px-3 py-2 text-body-md ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary)/40"
          />
          <button type="submit" disabled={isPending}
            className="rounded-lg bg-(--color-primary)/15 px-5 py-2 text-label-lg text-(--color-primary) hover:bg-(--color-primary)/25 transition-colors disabled:opacity-50 whitespace-nowrap">
            {isPending ? "Adding…" : "Add"}
          </button>
        </form>
      )}
      {error && (
        <p className="rounded-md bg-(--color-error)/10 px-3 py-2 text-body-sm text-(--color-error)">{error}</p>
      )}

      {blockers.length === 0 && !showInput ? (
        <div className="rounded-xl bg-(--color-surface-container-low) px-6 py-6 text-center">
          <p className="text-body-md text-(--color-on-surface-variant)">
            No blockers tracked. {canEdit && "Add items that need to clear before this round can close."}
          </p>
        </div>
      ) : blockers.length > 0 ? (
        <ul className="rounded-xl bg-(--color-surface-container-low) divide-y divide-(--color-outline-variant)/15">
          {[...open, ...resolved].map((b) => (
            <li key={b.id} className="px-4 py-3 flex items-start gap-3 group">
              <button
                type="button"
                onClick={() => canEdit && handleToggle(b.id, b.resolved)}
                disabled={!canEdit || isPending}
                aria-pressed={b.resolved}
                className={`mt-0.5 h-5 w-5 rounded shrink-0 flex items-center justify-center transition-colors ${
                  b.resolved
                    ? "bg-(--color-success) text-(--color-on-success)"
                    : "ghost-border hover:bg-(--color-surface-container-high)"
                } ${canEdit ? "cursor-pointer" : "cursor-default"}`}
              >
                {b.resolved && (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3 8.5L6.5 12L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-body-md ${b.resolved ? "line-through text-(--color-on-surface-variant)" : ""}`}>
                  {b.title}
                </p>
                {b.resolved && b.resolved_at && (
                  <p className="text-body-sm text-(--color-on-surface-variant) mt-0.5">
                    Resolved {new Date(b.resolved_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </p>
                )}
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => handleDelete(b.id)}
                  disabled={isPending}
                  className="text-body-sm text-(--color-on-surface-variant) hover:text-(--color-error) opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
