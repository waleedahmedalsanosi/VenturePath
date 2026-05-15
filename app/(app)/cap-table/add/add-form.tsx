"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { addShareholder } from "../actions";

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
      {pending ? "Saving…" : "Add shareholder"}
    </button>
  );
}

export function AddShareholderForm() {
  const [instrumentType, setInstrumentType] = useState<"ordinary" | "isafe">(
    "ordinary",
  );
  const [error, setError] = useState<string | null>(null);

  async function handle(formData: FormData) {
    setError(null);
    formData.set("instrument_type", instrumentType);
    const result = await addShareholder(formData);
    if (result && !result.ok) setError(result.error ?? "Failed.");
  }

  return (
    <form action={handle} className="space-y-6">
      <Field label="Name" required>
        <input name="name" required maxLength={200} className={inputClass} />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Email" hint="Optional. Used for future invites.">
          <input name="email" type="email" className={inputClass} />
        </Field>

        <Field label="Individual / entity" required>
          <select name="entity_or_individual" required className={inputClass} defaultValue="individual">
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
          defaultValue={new Date().toISOString().slice(0, 10)}
          className={inputClass}
        />
      </Field>

      <Field label="Instrument" required>
        <div className="flex gap-3">
          <InstrumentChoice
            label="Ordinary Share"
            description="Direct equity, vested or fully owned."
            selected={instrumentType === "ordinary"}
            onClick={() => setInstrumentType("ordinary")}
          />
          <InstrumentChoice
            label="iSAFE"
            description="Sharia-compliant convertible. Profit-share ratio, no interest."
            selected={instrumentType === "isafe"}
            onClick={() => setInstrumentType("isafe")}
          />
        </div>
      </Field>

      {instrumentType === "ordinary" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Number of shares" required>
            <input
              name="shares"
              type="text"
              inputMode="decimal"
              required
              className={`${inputClass} tabular-nums`}
              placeholder="e.g. 100000"
            />
          </Field>
          <Field label="Price per share (SAR)" required>
            <input
              name="price_per_share_sar"
              type="text"
              inputMode="decimal"
              required
              className={`${inputClass} tabular-nums`}
              placeholder="e.g. 1.00"
            />
          </Field>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-md bg-(--color-success)/10 px-4 py-3 text-body-sm text-(--color-success)">
            <strong>iSAFE</strong> is Sharia-compliant. Profit-share ratio
            replaces interest-based discount. Verify the terms with your legal
            advisor before recording.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Investment (SAR)" required>
              <input
                name="investment_sar"
                type="text"
                inputMode="decimal"
                required
                className={`${inputClass} tabular-nums`}
                placeholder="e.g. 500000"
              />
            </Field>
            <Field label="Valuation cap (SAR)" required>
              <input
                name="valuation_cap_sar"
                type="text"
                inputMode="decimal"
                required
                className={`${inputClass} tabular-nums`}
                placeholder="e.g. 5000000"
              />
            </Field>
          </div>
          <Field
            label="Profit share ratio (%)"
            required
            hint="0 to 100. Replaces the SAFE discount rate. نسبة مشاركة الأرباح"
          >
            <input
              name="profit_share_ratio"
              type="text"
              inputMode="decimal"
              required
              className={`${inputClass} tabular-nums`}
              placeholder="e.g. 20"
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

function InstrumentChoice({
  label,
  description,
  selected,
  onClick,
}: {
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex-1 rounded-md p-4 text-start transition-colors ${
        selected
          ? "bg-(--color-primary)/15 border border-(--color-primary)"
          : "bg-(--color-surface-container-high) ghost-border hover:bg-(--color-surface-bright)"
      }`}
    >
      <p className="text-label-lg font-medium">{label}</p>
      <p className="mt-1 text-body-sm text-(--color-on-surface-variant)">
        {description}
      </p>
    </button>
  );
}
