"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

import { updateCompany } from "./actions";
import type { Database } from "@/lib/supabase/types";

type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];

const COUNTRIES = ["KSA", "UAE", "Egypt", "Jordan", "Kuwait", "Qatar", "Bahrain", "Other"];
const SECTORS = [
  "FinTech", "HealthTech", "EdTech", "PropTech", "SaaS",
  "E-commerce", "AI/ML", "UGC", "Logistics", "Other",
];
const STAGES = [
  "Pre-Seed", "Seed", "Launch", "Series A", "Series B", "Series C+", "Bootstrapped",
];
const LEGAL_ENTITIES = ["Saudi LLC", "Cayman Holding", "DIFC Entity", "Other"];

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

export function CompanyForm({ workspace }: { workspace: Workspace }) {
  const router = useRouter();
  const [entityStatus, setEntityStatus] = useState<"incorporated" | "product_only">(
    workspace.entity_status,
  );
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  async function handle(formData: FormData) {
    setError(null);
    const result = await updateCompany(formData);
    if (!result.ok) {
      setError(result.error ?? "Failed.");
      return;
    }
    setSavedAt(new Date());
    router.refresh();
  }

  const isIncorporated = entityStatus === "incorporated";

  return (
    <form action={handle} className="space-y-6">
      <Field label="Company / product name" required>
        <input
          name="name"
          required
          maxLength={80}
          defaultValue={workspace.name}
          className={inputClass}
        />
      </Field>

      <Field
        label="One-liner"
        required
        hint="Max 140 characters. Shows on your public profile."
      >
        <input
          name="one_liner"
          required
          maxLength={140}
          defaultValue={workspace.one_liner}
          className={inputClass}
        />
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
            <select
              name="legal_entity"
              required
              defaultValue={workspace.legal_entity ?? ""}
              className={inputClass}
            >
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
              defaultValue={workspace.founded_year ?? ""}
              className={inputClass}
            />
          </Field>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Country" required>
          <select
            name="country"
            required
            defaultValue={workspace.country}
            className={inputClass}
          >
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="City" required>
          <input
            name="city"
            required
            defaultValue={workspace.city}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Sector" required>
          <select
            name="sector"
            required
            defaultValue={workspace.sector}
            className={inputClass}
          >
            {SECTORS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Funding stage" required>
          <select
            name="funding_stage"
            required
            defaultValue={workspace.funding_stage}
            className={inputClass}
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Website" hint="Optional.">
        <input
          name="website_url"
          type="url"
          defaultValue={workspace.website_url ?? ""}
          className={inputClass}
        />
      </Field>

      {error && (
        <p className="text-body-sm text-(--color-error)" role="alert">
          {error}
        </p>
      )}
      {savedAt && !error && (
        <p className="text-body-sm text-(--color-success)" role="status">
          Saved.
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
