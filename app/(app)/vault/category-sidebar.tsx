"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createCategory, deleteCategory, renameCategory } from "./actions";

interface Category {
  id: string;
  name: string;
  is_data_room: boolean;
  is_locked: boolean;
  sort_order: number;
}

export function CategorySidebar({
  categories,
  countsByCategory,
  uncategorizedCount,
  activeCategoryId,
}: {
  categories: Category[];
  countsByCategory: Record<string, number>;
  uncategorizedCount: number;
  activeCategoryId: string | null;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function add() {
    startTransition(async () => {
      setError(null);
      const r = await createCategory(newName);
      if (!r.ok) {
        setError(r.error ?? "Failed.");
        return;
      }
      setAdding(false);
      setNewName("");
      router.refresh();
    });
  }

  function rename(id: string) {
    startTransition(async () => {
      setError(null);
      const r = await renameCategory(id, renameValue);
      if (!r.ok) {
        setError(r.error ?? "Failed.");
        return;
      }
      setRenaming(null);
      router.refresh();
    });
  }

  function del(id: string) {
    startTransition(async () => {
      setError(null);
      const r = await deleteCategory(id);
      if (!r.ok) {
        setError(r.error ?? "Failed.");
        return;
      }
      router.refresh();
    });
  }

  function renderRow(cat: Category) {
    const isActive = activeCategoryId === cat.id;
    const count = countsByCategory[cat.id] ?? 0;
    if (renaming === cat.id) {
      return (
        <div className="px-3 py-2 flex items-center gap-2">
          <input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            autoFocus
            className="flex-1 min-w-0 rounded-sm bg-(--color-surface-container-high) ghost-border px-2 py-1 text-body-sm"
          />
          <button
            onClick={() => rename(cat.id)}
            disabled={busy}
            className="text-label-sm text-(--color-primary) hover:underline"
          >
            Save
          </button>
          <button
            onClick={() => setRenaming(null)}
            disabled={busy}
            className="text-label-sm text-(--color-on-surface-variant)"
          >
            Cancel
          </button>
        </div>
      );
    }
    return (
      <div
        className={`group flex items-center justify-between gap-2 rounded-md px-3 py-2 ${
          isActive ? "bg-(--color-surface-container-high)" : "hover:bg-(--color-surface-container-high)/50"
        }`}
      >
        <Link
          href={`/vault?category=${cat.id}`}
          className="flex-1 min-w-0 truncate text-body-sm flex items-center gap-2"
        >
          {cat.is_locked && <span aria-hidden>🔒</span>}
          <span className={isActive ? "font-medium" : ""}>{cat.name}</span>
          <span className="ml-auto text-label-sm text-(--color-on-surface-variant) tabular-nums">
            {count}
          </span>
        </Link>
        {!cat.is_locked && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setRenameValue(cat.name);
                setRenaming(cat.id);
              }}
              className="text-label-sm text-(--color-on-surface-variant) hover:text-(--color-on-surface)"
            >
              ✎
            </button>
            <button
              type="button"
              onClick={() => del(cat.id)}
              disabled={count > 0 || busy}
              title={count > 0 ? "Move documents out first" : "Delete"}
              className="text-label-sm text-(--color-on-surface-variant) hover:text-(--color-error) disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <nav className="rounded-xl bg-(--color-surface-container-low) p-2 space-y-1">
      <Link
        href="/vault"
        className={`block rounded-md px-3 py-2 text-body-sm ${
          activeCategoryId === null
            ? "bg-(--color-surface-container-high) font-medium"
            : "hover:bg-(--color-surface-container-high)/50"
        }`}
      >
        All
        <span className="ml-2 text-label-sm text-(--color-on-surface-variant) tabular-nums">
          {Object.values(countsByCategory).reduce((a, b) => a + b, 0) + uncategorizedCount}
        </span>
      </Link>

      {uncategorizedCount > 0 && (
        <Link
          href="/vault?category=uncategorized"
          className={`block rounded-md px-3 py-2 text-body-sm ${
            activeCategoryId === "uncategorized"
              ? "bg-(--color-surface-container-high) font-medium"
              : "hover:bg-(--color-surface-container-high)/50"
          }`}
        >
          Uncategorized
          <span className="ml-2 text-label-sm text-(--color-on-surface-variant) tabular-nums">
            {uncategorizedCount}
          </span>
        </Link>
      )}

      {categories.map((cat) => (
        <div key={cat.id}>{renderRow(cat)}</div>
      ))}

      {adding ? (
        <div className="px-3 py-2 flex items-center gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Category name"
            autoFocus
            className="flex-1 min-w-0 rounded-sm bg-(--color-surface-container-high) ghost-border px-2 py-1 text-body-sm"
          />
          <button
            onClick={add}
            disabled={busy || !newName.trim()}
            className="text-label-sm text-(--color-primary) hover:underline disabled:opacity-50"
          >
            Add
          </button>
          <button
            onClick={() => {
              setAdding(false);
              setNewName("");
            }}
            disabled={busy}
            className="text-label-sm text-(--color-on-surface-variant)"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="block w-full text-start rounded-md px-3 py-2 text-body-sm text-(--color-on-surface-variant) hover:text-(--color-on-surface)"
        >
          + Add category
        </button>
      )}

      {error && (
        <p className="px-3 py-2 text-body-sm text-(--color-error)" role="alert">
          {error}
        </p>
      )}
    </nav>
  );
}
