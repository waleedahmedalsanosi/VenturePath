"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { addGrant } from "../../actions";

const inputClass =
  "block w-full rounded-sm bg-(--color-surface-container-high) ghost-border px-3 py-2 focus:outline-none focus:border-(--color-primary)";

const DEPARTMENTS = [
  ["engineering", "Engineering"],
  ["product", "Product"],
  ["sales", "Sales"],
  ["operations", "Operations"],
  ["design", "Design"],
  ["legal", "Legal"],
  ["finance", "Finance"],
  ["other", "Other"],
] as const;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary-gradient rounded-lg px-6 py-2.5 text-label-lg font-medium disabled:opacity-50"
    >
      {pending ? "Saving…" : "Add grant"}
    </button>
  );
}

export function AddGrantForm() {
  const [vestingType, setVestingType] = useState<"immediate" | "graded">("graded");
  const [error, setError] = useState<string | null>(null);

  async function handle(formData: FormData) {
    setError(null);
    formData.set("vesting_type", vestingType);
    const result = await addGrant(formData);
    if (result && !result.ok) setError(result.error ?? "Failed.");
  }

  return (
    <form action={handle} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Employee name" required>
          <input name="employee_name" required maxLength={200} className={inputClass} />
        </Field>
        <Field label="Employee email" required>
          <input name="employee_email" type="email" required className={inputClass} />
        </Field>
      </div>

      <Field label="Department" required>
        <select name="department" required className={inputClass} defaultValue="engineering">
          {DEPARTMENTS.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Number of options" required>
          <input
            name="options_count"
            type="text"
            inputMode="numeric"
            required
            className={`${inputClass} tabular-nums`}
            placeholder="e.g. 10000"
          />
        </Field>
        <Field label="Strike price (SAR)" required hint="Locked at grant time.">
          <input
            name="strike_price_sar"
            type="text"
            inputMode="decimal"
            required
            className={`${inputClass} tabular-nums`}
            placeholder="e.g. 0.10"
          />
        </Field>
      </div>

      <Field label="Grant date" required>
        <input
          name="grant_date"
          type="date"
          required
          defaultValue={new Date().toISOString().slice(0, 10)}
          className={inputClass}
        />
      </Field>

      <Field label="Vesting type" required>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setVestingType("immediate")}
            aria-pressed={vestingType === "immediate"}
            className={`rounded-md p-3 text-start transition-colors ${
              vestingType === "immediate"
                ? "bg-(--color-primary)/15 border border-(--color-primary)"
                : "bg-(--color-surface-container-high) ghost-border hover:bg-(--color-surface-bright)"
            }`}
          >
            <p className="text-label-lg font-medium">Immediate</p>
            <p className="text-body-sm text-(--color-on-surface-variant)">
              Fully vested at grant.
            </p>
          </button>
          <button
            type="button"
            onClick={() => setVestingType("graded")}
            aria-pressed={vestingType === "graded"}
            className={`rounded-md p-3 text-start transition-colors ${
              vestingType === "graded"
                ? "bg-(--color-primary)/15 border border-(--color-primary)"
                : "bg-(--color-surface-container-high) ghost-border hover:bg-(--color-surface-bright)"
            }`}
          >
            <p className="text-label-lg font-medium">Graded</p>
            <p className="text-body-sm text-(--color-on-surface-variant)">
              Vests over time (e.g. 4yr / 1yr cliff).
            </p>
          </button>
        </div>
      </Field>

      {vestingType === "graded" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Vesting start" required>
              <input
                name="vesting_start_date"
                type="date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
                className={inputClass}
              />
            </Field>
            <Field label="Vesting end" required>
              <input
                name="vesting_end_date"
                type="date"
                required
                defaultValue={(() => {
                  const d = new Date();
                  d.setUTCFullYear(d.getUTCFullYear() + 4);
                  return d.toISOString().slice(0, 10);
                })()}
                className={inputClass}
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Cliff (months)">
              <input
                name="cliff_months"
                type="number"
                min={0}
                defaultValue={12}
                className={`${inputClass} tabular-nums`}
              />
            </Field>
            <Field label="Frequency">
              <select name="vesting_frequency" defaultValue="monthly" className={inputClass}>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </Field>
          </div>
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
