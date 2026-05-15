"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { editShareholder } from "../../actions";

import type { Database } from "@/lib/supabase/types";

type Shareholder = Database["public"]["Tables"]["shareholders"]["Row"];

const inputClass =
  "block w-full rounded-sm bg-(--color-surface-container-high) ghost-border px-3 py-2 focus:outline-none focus:border-(--color-primary)";

const TYPE_LABELS: Record<Shareholder["instrument_type"], string> = {
  ordinary: "Ordinary Share",
  isafe: "iSAFE",
  safe: "SAFE",
  convertible_note: "Convertible Note",
};

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
  const data = shareholder.instrument_data as Record<string, string | boolean>;
  const [serviceForEquity, setServiceForEquity] = useState(
    data.service_for_equity === true || data.service_for_equity === "true",
  );

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
        {TYPE_LABELS[shareholder.instrument_type]} — immutable. To switch type,
        delete and re-add.
      </div>

      {shareholder.instrument_type === "ordinary" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Number of shares" required>
              <input
                name="shares"
                type="text"
                inputMode="decimal"
                required
                defaultValue={String(data.shares ?? "")}
                className={`${inputClass} tabular-nums`}
              />
            </Field>
            <Field label="Price per share (SAR)" required>
              <input
                name="price_per_share_sar"
                type="text"
                inputMode="decimal"
                required
                defaultValue={String(data.price_per_share_sar ?? "")}
                className={`${inputClass} tabular-nums`}
              />
            </Field>
          </div>

          <div className="rounded-md bg-(--color-surface-container-high) p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="service_for_equity"
                checked={serviceForEquity}
                onChange={(e) => setServiceForEquity(e.target.checked)}
                className="h-4 w-4 accent-(--color-primary)"
              />
              <span className="text-label-lg font-medium">
                Service-for-Equity / Technical partnership
              </span>
            </label>
            {serviceForEquity && (
              <div className="mt-3">
                <Field label="Note" required>
                  <input
                    name="service_note"
                    type="text"
                    required
                    maxLength={200}
                    defaultValue={String(data.service_note ?? "")}
                    className={inputClass}
                  />
                </Field>
              </div>
            )}
          </div>
        </div>
      )}

      {shareholder.instrument_type === "isafe" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Investment (SAR)" required>
              <input
                name="investment_sar"
                type="text"
                inputMode="decimal"
                required
                defaultValue={String(data.investment_sar ?? "")}
                className={`${inputClass} tabular-nums`}
              />
            </Field>
            <Field label="Valuation cap (SAR)" required>
              <input
                name="valuation_cap_sar"
                type="text"
                inputMode="decimal"
                required
                defaultValue={String(data.valuation_cap_sar ?? "")}
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
              defaultValue={String(data.profit_share_ratio ?? "")}
              className={`${inputClass} tabular-nums`}
            />
          </Field>
        </div>
      )}

      {shareholder.instrument_type === "safe" && (
        <div className="space-y-4">
          <Field label="SAFE type" required>
            <select
              name="safe_type"
              required
              defaultValue={String(data.safe_type ?? "post_money")}
              className={inputClass}
            >
              <option value="post_money">Post-money SAFE</option>
              <option value="pre_money">Pre-money SAFE</option>
            </select>
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Investment (SAR)" required>
              <input
                name="investment_sar"
                type="text"
                inputMode="decimal"
                required
                defaultValue={String(data.investment_sar ?? "")}
                className={`${inputClass} tabular-nums`}
              />
            </Field>
            <Field label="Valuation cap (SAR)" required>
              <input
                name="valuation_cap_sar"
                type="text"
                inputMode="decimal"
                required
                defaultValue={String(data.valuation_cap_sar ?? "")}
                className={`${inputClass} tabular-nums`}
              />
            </Field>
          </div>
          <Field label="Discount rate (%)" hint="Optional.">
            <input
              name="discount_rate"
              type="text"
              inputMode="decimal"
              defaultValue={String(data.discount_rate ?? "")}
              className={`${inputClass} tabular-nums`}
            />
          </Field>
        </div>
      )}

      {shareholder.instrument_type === "convertible_note" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Principal amount (SAR)" required>
              <input
                name="principal_sar"
                type="text"
                inputMode="decimal"
                required
                defaultValue={String(data.principal_sar ?? "")}
                className={`${inputClass} tabular-nums`}
              />
            </Field>
            <Field label="Interest rate (% per annum)" required>
              <input
                name="interest_rate"
                type="text"
                inputMode="decimal"
                required
                defaultValue={String(data.interest_rate ?? "")}
                className={`${inputClass} tabular-nums`}
              />
            </Field>
          </div>
          <Field label="Maturity date" required>
            <input
              name="maturity_date"
              type="date"
              required
              defaultValue={String(data.maturity_date ?? "")}
              className={inputClass}
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Conversion discount (%)" hint="Optional.">
              <input
                name="conversion_discount"
                type="text"
                inputMode="decimal"
                defaultValue={String(data.conversion_discount ?? "")}
                className={`${inputClass} tabular-nums`}
              />
            </Field>
            <Field label="Valuation cap (SAR)" hint="Optional.">
              <input
                name="valuation_cap_sar"
                type="text"
                inputMode="decimal"
                defaultValue={String(data.valuation_cap_sar ?? "")}
                className={`${inputClass} tabular-nums`}
              />
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
