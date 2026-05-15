"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

import { upsertMetric } from "./actions";

const inputClass =
  "block w-full rounded-sm bg-(--color-surface-container-high) ghost-border px-3 py-2 focus:outline-none focus:border-(--color-primary) tabular-nums";

function defaultMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary-gradient rounded-lg px-5 py-2 text-label-lg font-medium disabled:opacity-50"
    >
      {pending ? "Saving…" : "Save month"}
    </button>
  );
}

export function UpsertForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handle(formData: FormData) {
    setError(null);
    const result = await upsertMetric(formData);
    if (!result.ok) {
      setError(result.error ?? "Save failed.");
      return;
    }
    router.refresh();
  }

  return (
    <form
      action={handle}
      className="rounded-xl bg-(--color-surface-container-low) p-6 grid grid-cols-2 md:grid-cols-5 gap-4 items-end"
    >
      <label className="block col-span-2 md:col-span-1">
        <span className="text-label-md uppercase text-(--color-on-surface-variant)">Month *</span>
        <input
          name="month"
          type="month"
          required
          defaultValue={defaultMonth().slice(0, 7)}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="text-label-md uppercase text-(--color-on-surface-variant)">MRR (SAR)</span>
        <input name="mrr_sar" type="text" inputMode="decimal" className={inputClass} />
      </label>
      <label className="block">
        <span className="text-label-md uppercase text-(--color-on-surface-variant)">Customers</span>
        <input name="customer_count" type="text" inputMode="numeric" className={inputClass} />
      </label>
      <label className="block">
        <span className="text-label-md uppercase text-(--color-on-surface-variant)">Margin %</span>
        <input name="gross_margin_pct" type="text" inputMode="decimal" className={inputClass} />
      </label>
      <label className="block">
        <span className="text-label-md uppercase text-(--color-on-surface-variant)">Runway (mo)</span>
        <input name="cash_runway_months" type="text" inputMode="numeric" className={inputClass} />
      </label>
      <div className="col-span-2 md:col-span-5 flex items-center justify-between">
        <p className="text-body-sm text-(--color-on-surface-variant)">
          Saving uses the month as a key — entering the same month again
          updates the existing row.
        </p>
        <SubmitButton />
      </div>
      {error && (
        <p className="col-span-2 md:col-span-5 text-body-sm text-(--color-error)" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
