"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { addShareholder } from "../actions";

type InstrumentType = "ordinary" | "isafe" | "safe" | "convertible_note";

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

export function AddShareholderForm({ fundingRoundId }: { fundingRoundId?: string | null }) {
  const [instrumentType, setInstrumentType] = useState<InstrumentType>("ordinary");
  const [serviceForEquity, setServiceForEquity] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(formData: FormData) {
    setError(null);
    formData.set("instrument_type", instrumentType);
    const result = await addShareholder(formData);
    if (result && !result.ok) setError(result.error ?? "Failed.");
  }

  return (
    <form action={handle} className="space-y-6">
      {fundingRoundId && (
        <input type="hidden" name="funding_round_id" value={fundingRoundId} />
      )}
      <Field label="Name" required>
        <input name="name" required maxLength={200} className={inputClass} />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Email" hint="Optional. Used for future invites.">
          <input name="email" type="email" className={inputClass} />
        </Field>

        <Field label="Individual / entity" required>
          <select
            name="entity_or_individual"
            required
            className={inputClass}
            defaultValue="individual"
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
          defaultValue={new Date().toISOString().slice(0, 10)}
          className={inputClass}
        />
      </Field>

      <Field label="Instrument" required>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            highlight
          />
          <InstrumentChoice
            label="SAFE"
            description="Standard Y Combinator SAFE. Discount + valuation cap, no interest."
            selected={instrumentType === "safe"}
            onClick={() => setInstrumentType("safe")}
          />
          <InstrumentChoice
            label="Convertible Note"
            description="Debt-style: principal, interest, maturity, conversion terms."
            selected={instrumentType === "convertible_note"}
            onClick={() => setInstrumentType("convertible_note")}
          />
        </div>
      </Field>

      {instrumentType === "ordinary" && (
        <div className="space-y-4">
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

          <div className="rounded-md bg-(--color-surface-container-high) p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="service_for_equity"
                checked={serviceForEquity}
                onChange={(e) => setServiceForEquity(e.target.checked)}
                className="h-4 w-4 accent-(--color-primary)"
              />
              <div>
                <span className="text-label-lg font-medium">
                  Service-for-Equity / Technical partnership
                </span>
                <p className="text-body-sm text-(--color-on-surface-variant)">
                  Equity granted in exchange for services or contributions
                  rather than cash.
                </p>
              </div>
            </label>
            {serviceForEquity && (
              <div className="mt-3">
                <Field
                  label="Note"
                  required
                  hint="Max 200 chars. Internal only. e.g. 'Development services + capital contribution — SAR X equivalent'"
                >
                  <input
                    name="service_note"
                    type="text"
                    required
                    maxLength={200}
                    className={inputClass}
                  />
                </Field>
              </div>
            )}
          </div>
        </div>
      )}

      {instrumentType === "isafe" && (
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

      {instrumentType === "safe" && (
        <div className="space-y-4">
          <div className="rounded-md bg-(--color-warning)/10 px-4 py-3 text-body-sm text-(--color-warning)">
            <strong>SAFE</strong> is interest-bearing in effect via the discount
            rate. Not Sharia-compliant — choose iSAFE for Sharia-compliant
            instruments. Verify all terms with your legal advisor.
          </div>
          <Field label="SAFE type" required>
            <select name="safe_type" required className={inputClass} defaultValue="post_money">
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
                className={`${inputClass} tabular-nums`}
              />
            </Field>
            <Field label="Valuation cap (SAR)" required>
              <input
                name="valuation_cap_sar"
                type="text"
                inputMode="decimal"
                required
                className={`${inputClass} tabular-nums`}
              />
            </Field>
          </div>
          <Field label="Discount rate (%)" hint="Optional. 0-100.">
            <input
              name="discount_rate"
              type="text"
              inputMode="decimal"
              className={`${inputClass} tabular-nums`}
              placeholder="e.g. 20"
            />
          </Field>
        </div>
      )}

      {instrumentType === "convertible_note" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Principal amount (SAR)" required>
              <input
                name="principal_sar"
                type="text"
                inputMode="decimal"
                required
                className={`${inputClass} tabular-nums`}
              />
            </Field>
            <Field label="Interest rate (% per annum)" required>
              <input
                name="interest_rate"
                type="text"
                inputMode="decimal"
                required
                className={`${inputClass} tabular-nums`}
                placeholder="e.g. 8"
              />
            </Field>
          </div>
          <Field label="Maturity date" required>
            <input
              name="maturity_date"
              type="date"
              required
              className={inputClass}
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Conversion discount (%)" hint="Optional. 0-100.">
              <input
                name="conversion_discount"
                type="text"
                inputMode="decimal"
                className={`${inputClass} tabular-nums`}
              />
            </Field>
            <Field label="Valuation cap (SAR)" hint="Optional.">
              <input
                name="valuation_cap_sar"
                type="text"
                inputMode="decimal"
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

function InstrumentChoice({
  label,
  description,
  selected,
  onClick,
  highlight,
}: {
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-md p-4 text-start transition-colors ${
        selected
          ? highlight
            ? "bg-(--color-success)/15 border border-(--color-success)"
            : "bg-(--color-primary)/15 border border-(--color-primary)"
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
