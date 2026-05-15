"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { createPool } from "./actions";

const inputClass =
  "block w-full rounded-sm bg-(--color-surface-container-high) ghost-border px-3 py-2 focus:outline-none focus:border-(--color-primary) tabular-nums";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary-gradient rounded-lg px-6 py-2.5 text-label-lg font-medium disabled:opacity-50"
    >
      {pending ? "Creating…" : "Create pool"}
    </button>
  );
}

export function CreatePoolForm() {
  const [error, setError] = useState<string | null>(null);

  async function handle(formData: FormData) {
    setError(null);
    const result = await createPool(formData);
    if (result && !result.ok) setError(result.error ?? "Failed.");
  }

  return (
    <form action={handle} className="space-y-6">
      <label className="block">
        <span className="text-label-md uppercase text-(--color-on-surface-variant)">
          Total pool shares *
        </span>
        <input
          name="total_pool_shares"
          type="text"
          inputMode="numeric"
          required
          className={inputClass}
          placeholder="e.g. 1000000"
        />
        <span className="mt-1 block text-body-sm text-(--color-on-surface-variant)">
          The number of options reserved for employees. Counts against
          authorised shares.
        </span>
      </label>

      <label className="block">
        <span className="text-label-md uppercase text-(--color-on-surface-variant)">
          Strike price reference (SAR)
        </span>
        <input
          name="strike_price_reference_sar"
          type="text"
          inputMode="decimal"
          className={inputClass}
          placeholder="Optional. Per-grant strike can override."
        />
      </label>

      {error && (
        <p className="text-body-sm text-(--color-error)" role="alert">
          {error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
