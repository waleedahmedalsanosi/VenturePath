"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { updateVisibility } from "./actions";

interface Flags {
  show_mrr_publicly: boolean;
  show_customer_count_publicly: boolean;
  show_gross_margin_publicly: boolean;
  show_cash_runway_publicly: boolean;
}

const LABELS: Array<{ key: keyof Flags; label: string; hint: string }> = [
  { key: "show_mrr_publicly", label: "MRR", hint: "Show monthly recurring revenue on public profile" },
  { key: "show_customer_count_publicly", label: "Customers", hint: "Show customer count" },
  { key: "show_gross_margin_publicly", label: "Gross margin", hint: "Show gross margin %" },
  { key: "show_cash_runway_publicly", label: "Runway", hint: "Show cash runway in months" },
];

export function VisibilityToggles({ initial }: { initial: Flags }) {
  const router = useRouter();
  const [flags, setFlags] = useState<Flags>(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  function set(key: keyof Flags, value: boolean) {
    const next = { ...flags, [key]: value };
    setFlags(next);
    startTransition(async () => {
      setError(null);
      const result = await updateVisibility(next);
      if (!result.ok) {
        setError(result.error ?? "Failed.");
        return;
      }
      setSavedAt(new Date());
      router.refresh();
    });
  }

  return (
    <section className="rounded-xl bg-(--color-surface-container-low) p-6">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
        <div>
          <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
            Public visibility
          </h2>
          <p className="text-body-sm text-(--color-on-surface-variant) mt-1">
            Each metric is hidden by default. Enable individually to show on
            your public profile (logged-in viewers only).
          </p>
        </div>
        {pending ? (
          <span className="text-body-sm text-(--color-on-surface-variant)">Saving…</span>
        ) : savedAt ? (
          <span className="text-body-sm text-(--color-success)">Saved</span>
        ) : null}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {LABELS.map(({ key, label, hint }) => {
          const on = flags[key];
          return (
            <button
              type="button"
              key={key}
              onClick={() => set(key, !on)}
              aria-pressed={on}
              className={`rounded-md p-4 text-start transition-colors ${
                on
                  ? "bg-(--color-primary)/15 border border-(--color-primary)"
                  : "bg-(--color-surface-container-high) ghost-border hover:bg-(--color-surface-bright)"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-label-lg font-medium">{label}</span>
                <span
                  className={`text-label-sm uppercase tracking-wider ${
                    on ? "text-(--color-primary)" : "text-(--color-on-surface-variant)"
                  }`}
                >
                  {on ? "Shown" : "Hidden"}
                </span>
              </div>
              <p className="mt-1 text-body-sm text-(--color-on-surface-variant)">
                {hint}
              </p>
            </button>
          );
        })}
      </div>
      {error && (
        <p className="mt-3 text-body-sm text-(--color-error)" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
