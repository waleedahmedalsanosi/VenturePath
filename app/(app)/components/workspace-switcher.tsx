"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";

import { switchWorkspace } from "./workspace-actions";

interface Workspace {
  id: string;
  name: string;
}

export function WorkspaceSwitcher({
  active,
  options,
}: {
  active: Workspace;
  options: Workspace[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function pick(id: string) {
    if (id === active.id) {
      setOpen(false);
      return;
    }
    startTransition(async () => {
      await switchWorkspace(id);
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-md ghost-border px-3 py-1.5 text-body-sm hover:bg-(--color-surface-container-high)"
      >
        <span className="truncate max-w-48">{active.name}</span>
        <span aria-hidden className="text-(--color-on-surface-variant)">▾</span>
      </button>
      {open && (
        <div className="absolute z-10 mt-2 w-72 rounded-lg bg-(--color-surface-bright) p-1 shadow-lg shadow-black/20 backdrop-blur">
          <ul className="max-h-72 overflow-auto">
            {options.map((w) => (
              <li key={w.id}>
                <button
                  type="button"
                  onClick={() => pick(w.id)}
                  disabled={pending}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-start text-body-sm hover:bg-(--color-surface-container-high) disabled:opacity-50 ${
                    w.id === active.id ? "font-medium" : ""
                  }`}
                >
                  <span className="truncate">{w.name}</span>
                  {w.id === active.id && (
                    <span aria-hidden className="text-(--color-primary)">✓</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-(--color-outline-variant)/20 mt-1 pt-1">
            <Link
              href="/setup?new=1"
              onClick={() => setOpen(false)}
              className="block w-full rounded-md px-3 py-2 text-start text-body-sm text-(--color-primary) hover:bg-(--color-surface-container-high)"
            >
              + New workspace
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
