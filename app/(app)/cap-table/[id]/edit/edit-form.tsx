"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { editShareholder } from "../../actions";

import type { Database } from "@/lib/supabase/types";

type Shareholder = Database["public"]["Tables"]["shareholders"]["Row"];

const inputClass =
  "block w-full rounded-sm bg-(--color-surface-container-high) ghost-border px-3 py-2 focus:outline-none focus:border-(--color-primary)";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary-gradient rounded-lg px-6 py-2.5 text-label-lg font-medium disabled:opacity-50"
    >
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}

export function EditShareholderForm({ shareholder }: { shareholder: Shareholder }) {
  const [error, setError] = useState<string | null>(null);
  const data = shareholder.instrument_data as Record<string, string>;

  async function handle(formData: FormData) {
    setError(null);
    const result = await editShareholder(shareholder.id, formData);
    if (result && !result.ok) setError(result.error ?? "Failed.");
  }

  return (
    <form action={handle} className="space-y-6">
      <Field label="Name" required>
        <input
          name="name"
          required
          maxLength={200}
          defaultValue={shareholder.name}
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Email" hint="Optional.">
          <input
            name="email"
            type="email"
            defaultValue={shareholder.email ?? ""}
            className={inputClass}
          />
        </Field>

        <Field label="Individual / entity" required>
          <select
            name="entity_or_individual"
            required
            defaultValue={shareholder.entity_or_individual}
            className={inputClass}
          >
            <option value="individual">Individual</option>
            <option value="entity">Entity</option>
          </select>
        </Field>
      </div>

      <Field label="Entry date" required>
        <input
          name="entry_date"
          type="date"
          required
          defaultValue={shareholder.entry_date}
          className={inputClass}
        />
      </Field>

      <div className="rounded-md bg-(--color-surface-container-high) px-4 py-3 text-body-sm text-(--color-on-surface-variant)">
        <strong className="text-(--color-on-surface)">Instrument:</strong>{" "}
        {shareholder.instrument_type === "isafe" ? "iSAFE" : "Ordinary Share"}{" "}
        — immutable. To switch type, delete and re-add.
      </div>

      {shareholder.instrument_type === "ordinary" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Number of shares" required>
            <input
              name="shares"
              type="text"
              inputMode="decimal"
              required
              defaultValue={data.shares}
              className={`${inputClass} tabular-nums`}
            />
          </Field>
          <Field label="Price per share (SAR)" required>
            <input
              name="price_per_share_sar"
              type="text"
              inputMode="decimal"
              required
              defaultValue={data.price_per_share_sar}
              className={`${inputClass} tabular-nums`}
            />
          </Field>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Investment (SAR)" required>
              <input
                name="investment_sar"
                type="text"
                inputMode="decimal"
                required
                defaultValue={data.investment_sar}
                className={`${inputClass} tabular-nums`}
              />
            </Field>
            <Field label="Valuation cap (SAR)" required>
              <input
                name="valuation_cap_sar"
                type="text"
                inputMode="decimal"
                required
                defaultValue={data.valuation_cap_sar}
                className={`${inputClass} tabular-nums`}
              />
            </Field>
          </div>
          <Field label="Profit share ratio (%)" required>
            <input
              name="profit_share_ratio"
              type="text"
              inputMode="decimal"
              required
              defaultValue={data.profit_share_ratio}
              className={`${inputClass} tabular-nums`}
            />
          </Field>
        </div>
      )}

      {error && (
        <p className="text-body-sm text-(--color-error)" role="alert">
          {error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-label-md uppercase text-(--color-on-surface-variant)">
        {label}
        {required && " *"}
      </span>
      <div className="mt-1">{children}</div>
      {hint && (
        <span className="mt-1 block text-body-sm text-(--color-on-surface-variant)">
          {hint}
        </span>
      )}
    </label>
  );
}
