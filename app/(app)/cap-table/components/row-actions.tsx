"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteShareholder } from "../actions";

export function RowActions({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function onEdit() {
    router.push(`/cap-table/${id}/edit`);
  }

  function onDelete() {
    startTransition(async () => {
      const result = await deleteShareholder(id);
      if (result.ok) {
        setConfirming(false);
        router.refresh();
      }
    });
  }

  if (confirming) {
    return (
      <div className="flex items-center justify-end gap-2 whitespace-nowrap">
        <span className="text-body-sm text-(--color-on-surface-variant)">
          Delete {name}?
        </span>
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          className="rounded-sm bg-(--color-error)/15 px-2 py-1 text-label-sm font-medium text-(--color-error) disabled:opacity-50"
        >
          {pending ? "…" : "Confirm"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="rounded-sm px-2 py-1 text-label-sm text-(--color-on-surface-variant) hover:text-(--color-on-surface)"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-3 whitespace-nowrap">
      <button
        type="button"
        onClick={onEdit}
        className="text-body-sm text-(--color-on-surface-variant) hover:text-(--color-primary)"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-body-sm text-(--color-on-surface-variant) hover:text-(--color-error)"
      >
        Delete
      </button>
    </div>
  );
}
