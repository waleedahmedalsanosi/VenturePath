"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { addObligation } from "../actions";
import { CATEGORY_LABELS, RECURRENCE_LABELS } from "@/lib/compliance/status";

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
      {pending ? "Saving…" : "Add obligation"}
    </button>
  );
}

export function AddObligationForm() {
  const [error, setError] = useState<string | null>(null);

  async function handle(formData: FormData) {
    setError(null);
    const result = await addObligation(formData);
    if (result && !result.ok) setError(result.error ?? "Failed.");
  }

  return (
    <form action={handle} className="space-y-6">
      <Field label="Obligation name" required hint="e.g. Zakat Annual Filing">
        <input name="name" required maxLength={200} className={inputClass} />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Regulatory body" required hint="e.g. ZATCA">
          <input
            name="regulatory_body"
            required
            maxLength={120}
            className={inputClass}
          />
        </Field>

        <Field label="Category" required>
          <select name="category" required className={inputClass}>
            <option value="">Select…</option>
            {(Object.entries(CATEGORY_LABELS) as [
              keyof typeof CATEGORY_LABELS,
              string,
            ][]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Start date" hint="Optional.">
          <input name="start_date" type="date" className={inputClass} />
        </Field>

        <Field label="Due date" required>
          <input name="due_date" type="date" required className={inputClass} />
        </Field>
      </div>

      <Field label="Recurrence" required>
        <select name="recurrence" required defaultValue="one_time" className={inputClass}>
          {(Object.entries(RECURRENCE_LABELS) as [
            keyof typeof RECURRENCE_LABELS,
            string,
          ][]).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Official URL"
        hint="Optional. Link to the regulator's page for this filing."
      >
        <input
          name="official_url"
          type="url"
          placeholder="https://zatca.gov.sa/..."
          className={inputClass}
        />
      </Field>

      <Field
        label="Reminder (days before)"
        required
        hint="Between 7 and 90. Notifications come in a later release."
      >
        <input
          name="reminder_days_before"
          type="number"
          required
          min={7}
          max={90}
          defaultValue={30}
          className={`${inputClass} tabular-nums`}
        />
      </Field>

      <Field label="Notes" hint="Optional. Private to your workspace.">
        <textarea name="notes" rows={3} className={inputClass} />
      </Field>

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
