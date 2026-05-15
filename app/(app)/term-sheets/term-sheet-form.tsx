"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

type InstrumentType = "isafe" | "safe" | "convertible_note" | "ordinary";

const INSTRUMENT_LABELS: Record<InstrumentType, string> = {
  isafe: "iSAFE",
  safe: "SAFE",
  convertible_note: "Convertible Note",
  ordinary: "Ordinary Share (Priced)",
};

const inputClass =
  "block w-full rounded-sm bg-(--color-surface-container-high) ghost-border px-3 py-2 focus:outline-none focus:border-(--color-primary)";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary-gradient rounded-lg px-6 py-2.5 text-label-lg font-medium disabled:opacity-50"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

export interface TermSheetFormDefaults {
  instrument_type: InstrumentType;
  investor_name?: string;
  investor_email?: string;
  firm?: string;
  notes?: string;
  pipeline_contact_id?: string;
  terms?: Record<string, string | number | undefined>;
  // When true the instrument is fixed (editing mode), the form does not show
  // an instrument selector.
  instrument_locked?: boolean;
}

export function TermSheetForm({
  defaults,
  pipelineContacts,
  submitLabel,
  action,
  hiddenFields,
}: {
  defaults: TermSheetFormDefaults;
  // Optional: list of pipeline contacts on the round so the founder can link.
  pipelineContacts?: { id: string; name: string; firm: string | null; email: string | null }[];
  submitLabel: string;
  action: (formData: FormData) => Promise<{ ok: boolean; error?: string } | void>;
  // Round id (when creating) — rendered as a hidden field by callers if needed.
  hiddenFields?: Record<string, string>;
}) {
  const [instrumentType, setInstrumentType] = useState<InstrumentType>(defaults.instrument_type);
  const [error, setError] = useState<string | null>(null);
  const [contactId, setContactId] = useState<string>(defaults.pipeline_contact_id ?? "");

  async function handle(formData: FormData) {
    setError(null);
    formData.set("instrument_type", instrumentType);
    if (hiddenFields) {
      for (const [k, v] of Object.entries(hiddenFields)) formData.set(k, v);
    }
    const result = await action(formData);
    if (result && !result.ok) setError(result.error ?? "Failed.");
  }

  function selectContact(id: string) {
    setContactId(id);
    const pc = pipelineContacts?.find((c) => c.id === id);
    if (pc) {
      // Auto-fill name/firm/email — these are inputs; user can still tweak.
      const nameEl = document.querySelector<HTMLInputElement>("input[name=investor_name]");
      const firmEl = document.querySelector<HTMLInputElement>("input[name=firm]");
      const emailEl = document.querySelector<HTMLInputElement>("input[name=investor_email]");
      if (nameEl) nameEl.value = pc.name;
      if (firmEl) firmEl.value = pc.firm ?? "";
      if (emailEl) emailEl.value = pc.email ?? "";
    }
  }

  return (
    <form action={handle} className="space-y-6">
      {hiddenFields &&
        Object.entries(hiddenFields).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
      <input type="hidden" name="pipeline_contact_id" value={contactId} />

      {pipelineContacts && pipelineContacts.length > 0 && !defaults.instrument_locked && (
        <Field label="Link to pipeline contact" hint="Optional — auto-fills name and firm.">
          <select
            className={inputClass}
            value={contactId}
            onChange={(e) => selectContact(e.target.value)}
          >
            <option value="">— Manual entry —</option>
            {pipelineContacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.firm ? ` (${c.firm})` : ""}
              </option>
            ))}
          </select>
        </Field>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Investor name" required>
          <input
            name="investor_name"
            required
            maxLength={200}
            defaultValue={defaults.investor_name ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Firm">
          <input
            name="firm"
            maxLength={200}
            defaultValue={defaults.firm ?? ""}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Email" hint="Optional. Used for future invites and signed-copy delivery.">
        <input
          name="investor_email"
          type="email"
          defaultValue={defaults.investor_email ?? ""}
          className={inputClass}
        />
      </Field>

      {!defaults.instrument_locked ? (
        <Field label="Instrument" required>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.keys(INSTRUMENT_LABELS) as InstrumentType[]).map((t) => (
              <InstrumentChoice
                key={t}
                label={INSTRUMENT_LABELS[t]}
                description={
                  t === "isafe"
                    ? "Sharia-compliant convertible. Profit-share ratio."
                    : t === "safe"
                    ? "Standard YC SAFE. Discount + valuation cap."
                    : t === "convertible_note"
                    ? "Debt-style: principal, interest, maturity."
                    : "Direct equity, priced round."
                }
                selected={instrumentType === t}
                onClick={() => setInstrumentType(t)}
                highlight={t === "isafe"}
              />
            ))}
          </div>
        </Field>
      ) : (
        <div className="rounded-md bg-(--color-surface-container-low) px-4 py-3 text-body-sm">
          <span className="text-(--color-on-surface-variant)">Instrument: </span>
          <strong>{INSTRUMENT_LABELS[instrumentType]}</strong>
          <span className="text-(--color-on-surface-variant)"> — instrument is fixed for an existing term sheet.</span>
        </div>
      )}

      {/* Per-instrument fields */}
      {instrumentType === "isafe" && (
        <div className="space-y-4">
          <div className="rounded-md bg-(--color-success)/10 px-4 py-3 text-body-sm text-(--color-success)">
            <strong>iSAFE</strong> is Sharia-compliant. Profit-share ratio replaces interest-based discount.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Investment (SAR)" required>
              <input name="investment_sar" type="text" inputMode="decimal" required
                defaultValue={defaults.terms?.investment_sar?.toString() ?? ""}
                className={`${inputClass} tabular-nums`} placeholder="e.g. 500000" />
            </Field>
            <Field label="Valuation cap (SAR)" required>
              <input name="valuation_cap_sar" type="text" inputMode="decimal" required
                defaultValue={defaults.terms?.valuation_cap_sar?.toString() ?? ""}
                className={`${inputClass} tabular-nums`} placeholder="e.g. 5000000" />
            </Field>
          </div>
          <Field label="Profit share ratio (%)" required hint="0 to 100. Replaces SAFE discount rate.">
            <input name="profit_share_ratio" type="text" inputMode="decimal" required
              defaultValue={defaults.terms?.profit_share_ratio?.toString() ?? ""}
              className={`${inputClass} tabular-nums`} placeholder="e.g. 20" />
          </Field>
        </div>
      )}

      {instrumentType === "safe" && (
        <div className="space-y-4">
          <div className="rounded-md bg-(--color-warning)/10 px-4 py-3 text-body-sm text-(--color-warning)">
            <strong>SAFE</strong> is interest-bearing in effect via the discount rate — not Sharia-compliant.
          </div>
          <Field label="SAFE type" required>
            <select name="safe_type" required className={inputClass}
              defaultValue={(defaults.terms?.safe_type as string) ?? "post_money"}>
              <option value="post_money">Post-money SAFE</option>
              <option value="pre_money">Pre-money SAFE</option>
            </select>
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Investment (SAR)" required>
              <input name="investment_sar" type="text" inputMode="decimal" required
                defaultValue={defaults.terms?.investment_sar?.toString() ?? ""}
                className={`${inputClass} tabular-nums`} />
            </Field>
            <Field label="Valuation cap (SAR)" required>
              <input name="valuation_cap_sar" type="text" inputMode="decimal" required
                defaultValue={defaults.terms?.valuation_cap_sar?.toString() ?? ""}
                className={`${inputClass} tabular-nums`} />
            </Field>
          </div>
          <Field label="Discount rate (%)" hint="Optional. 0-100.">
            <input name="discount_rate" type="text" inputMode="decimal"
              defaultValue={defaults.terms?.discount_rate?.toString() ?? ""}
              className={`${inputClass} tabular-nums`} placeholder="e.g. 20" />
          </Field>
        </div>
      )}

      {instrumentType === "convertible_note" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Principal (SAR)" required>
              <input name="principal_sar" type="text" inputMode="decimal" required
                defaultValue={defaults.terms?.principal_sar?.toString() ?? ""}
                className={`${inputClass} tabular-nums`} />
            </Field>
            <Field label="Interest rate (% p.a.)" required>
              <input name="interest_rate" type="text" inputMode="decimal" required
                defaultValue={defaults.terms?.interest_rate?.toString() ?? ""}
                className={`${inputClass} tabular-nums`} placeholder="e.g. 8" />
            </Field>
          </div>
          <Field label="Maturity date" required>
            <input name="maturity_date" type="date" required
              defaultValue={defaults.terms?.maturity_date?.toString() ?? ""}
              className={inputClass} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Conversion discount (%)" hint="Optional. 0-100.">
              <input name="conversion_discount" type="text" inputMode="decimal"
                defaultValue={defaults.terms?.conversion_discount?.toString() ?? ""}
                className={`${inputClass} tabular-nums`} />
            </Field>
            <Field label="Valuation cap (SAR)" hint="Optional.">
              <input name="valuation_cap_sar" type="text" inputMode="decimal"
                defaultValue={defaults.terms?.valuation_cap_sar?.toString() ?? ""}
                className={`${inputClass} tabular-nums`} />
            </Field>
          </div>
        </div>
      )}

      {instrumentType === "ordinary" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Shares to issue" required>
            <input name="shares" type="text" inputMode="decimal" required
              defaultValue={defaults.terms?.shares?.toString() ?? ""}
              className={`${inputClass} tabular-nums`} placeholder="e.g. 100000" />
          </Field>
          <Field label="Price per share (SAR)" required>
            <input name="price_per_share_sar" type="text" inputMode="decimal" required
              defaultValue={defaults.terms?.price_per_share_sar?.toString() ?? ""}
              className={`${inputClass} tabular-nums`} />
          </Field>
        </div>
      )}

      <Field label="Notes" hint="Internal-only notes — won't appear on the term sheet.">
        <textarea
          name="notes"
          rows={3}
          maxLength={4000}
          defaultValue={defaults.notes ?? ""}
          className={`${inputClass} resize-none`}
        />
      </Field>

      {error && (
        <p className="text-body-sm text-(--color-error)" role="alert">{error}</p>
      )}

      <SubmitButton label={submitLabel} />
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
        <span className="mt-1 block text-body-sm text-(--color-on-surface-variant)">{hint}</span>
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
      <p className="mt-1 text-body-sm text-(--color-on-surface-variant)">{description}</p>
    </button>
  );
}
