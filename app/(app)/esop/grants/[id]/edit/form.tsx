"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { editGrant } from "../../../actions";
import type { Database } from "@/lib/supabase/types";

type Grant = Database["public"]["Tables"]["esop_grants"]["Row"];

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

const FREQUENCIES = [
  ["monthly", "Monthly"],
  ["quarterly", "Quarterly"],
  ["annual", "Annual"],
] as const;

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
        {label}{required && " *"}
      </span>
      <div className="mt-1">{children}</div>
      {hint && <span className="mt-1 block text-body-sm text-(--color-on-surface-variant)">{hint}</span>}
    </label>
  );
}

export function EditGrantForm({ grantId, grant }: { grantId: string; grant: Grant }) {
  const [error, setError] = useState<string | null>(null);

  async function handle(formData: FormData) {
    setError(null);
    const result = await editGrant(grantId, formData);
    if (result && !result.ok) setError(result.error ?? "Failed.");
  }

  return (
    <form action={handle} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Employee name" required>
          <input
            name="employee_name"
            defaultValue={grant.employee_name}
            required
            maxLength={200}
            className={inputClass}
          />
        </Field>
        <Field label="Employee email" required>
          <input
            name="employee_email"
            type="email"
            defaultValue={grant.employee_email}
            required
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Department" required>
        <select name="department" defaultValue={grant.department} required className={inputClass}>
          {DEPARTMENTS.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </Field>

      <Field label="Strike price (SAR)" required hint="Changing the strike price updates the grant record.">
        <input
          name="strike_price_sar"
          type="text"
          inputMode="decimal"
          defaultValue={grant.strike_price_sar ?? ""}
          required
          className={`${inputClass} tabular-nums`}
        />
      </Field>

      {/* Show read-only locked fields */}
      <div className="rounded-md bg-(--color-surface-container-low) px-4 py-3 space-y-1">
        <p className="text-label-md uppercase text-(--color-on-surface-variant)">Locked fields</p>
        <p className="text-body-sm text-(--color-on-surface-variant)">
          Options: <span className="tabular-nums font-medium text-(--color-on-surface)">{Number(grant.options_count).toLocaleString()}</span>
          &ensp;·&ensp; Vesting: <span className="font-medium text-(--color-on-surface)">{grant.vesting_type === "graded" ? "Graded" : "Immediate"}</span>
          &ensp;·&ensp; Granted: <span className="font-medium text-(--color-on-surface)">{grant.grant_date}</span>
        </p>
      </div>

      {grant.vesting_type === "graded" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Vesting start" required>
              <input
                name="vesting_start_date"
                type="date"
                defaultValue={grant.vesting_start_date ?? ""}
                required
                className={inputClass}
              />
            </Field>
            <Field label="Vesting end" required>
              <input
                name="vesting_end_date"
                type="date"
                defaultValue={grant.vesting_end_date ?? ""}
                required
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
                defaultValue={grant.cliff_months ?? 0}
                className={`${inputClass} tabular-nums`}
              />
            </Field>
            <Field label="Frequency">
              <select
                name="vesting_frequency"
                defaultValue={grant.vesting_frequency ?? "monthly"}
                className={inputClass}
              >
                {FREQUENCIES.map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>
      )}

      {error && (
        <p className="text-body-sm text-(--color-error)" role="alert">{error}</p>
      )}

      <SubmitButton />
    </form>
  );
}
