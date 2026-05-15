"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { createWorkspace } from "./actions";

const COUNTRIES = ["KSA", "UAE", "Egypt", "Jordan", "Kuwait", "Qatar", "Bahrain", "Other"];
const SECTORS = [
  "FinTech",
  "HealthTech",
  "EdTech",
  "PropTech",
  "SaaS",
  "E-commerce",
  "AI/ML",
  "UGC",
  "Logistics",
  "Other",
];
const STAGES = [
  "Pre-Seed",
  "Seed",
  "Launch",
  "Series A",
  "Series B",
  "Series C+",
  "Bootstrapped",
];
const LEGAL_ENTITIES = ["Saudi LLC", "Cayman Holding", "DIFC Entity", "Other"];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary-gradient rounded-lg px-6 py-2.5 text-label-lg font-medium disabled:opacity-50"
    >
      {pending ? "Creating…" : "Create workspace"}
    </button>
  );
}

export function SetupForm() {
  const [entityStatus, setEntityStatus] = useState<"incorporated" | "product_only">(
    "product_only",
  );
  const [error, setError] = useState<string | null>(null);

  async function handleAction(formData: FormData) {
    setError(null);
    const result = await createWorkspace(formData);
    if (result && !result.ok) setError(result.error ?? "Failed to create workspace.");
  }

  const isIncorporated = entityStatus === "incorporated";

  return (
    <form action={handleAction} className="space-y-6">
      <Field label="Company / product name" required>
        <input name="name" required maxLength={80} className={inputClass} />
      </Field>

      <Field
        label="One-liner"
        required
        hint="Max 140 characters. Shows on your public profile later."
      >
        <input name="one_liner" required maxLength={140} className={inputClass} />
      </Field>

      <Field label="Entity status" required>
        <select
          name="entity_status"
          required
          value={entityStatus}
          onChange={(e) => setEntityStatus(e.target.value as typeof entityStatus)}
          className={inputClass}
        >
          <option value="product_only">Product only (pre-incorporation)</option>
          <option value="incorporated">Incorporated</option>
        </select>
      </Field>

      {isIncorporated && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Legal entity type" required>
            <select name="legal_entity" required className={inputClass}>
              <option value="">Select…</option>
              {LEGAL_ENTITIES.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Founded year" required>
            <input
              name="founded_year"
              type="number"
              min={1900}
              max={2100}
              required
              className={inputClass}
            />
          </Field>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Country" required>
          <select name="country" required className={inputClass}>
            <option value="">Select…</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field label="City" required>
          <input name="city" required className={inputClass} />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Sector" required>
          <select name="sector" required className={inputClass}>
            <option value="">Select…</option>
            {SECTORS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Funding stage" required>
          <select name="funding_stage" required className={inputClass}>
            <option value="">Select…</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Website" hint="Optional. http(s):// or app store URL.">
        <input name="website_url" type="url" className={inputClass} />
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

const inputClass =
  "block w-full rounded-sm bg-(--color-surface-container-high) ghost-border px-3 py-2 focus:outline-none focus:border-(--color-primary)";

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
