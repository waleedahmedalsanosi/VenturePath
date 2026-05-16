"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createConnectionListing } from "../actions";

type ListingType = "exit" | "partnership";
type ExitAskType = "active_sale" | "open_to_offers" | "acqui_hire" | "merger";
type SeekingType = "co_founder" | "advisor" | "senior_hire" | "business_partner";
type CommitmentType = "full_time" | "part_time" | "advisory" | "flexible";

export function NewListingForm({
  initialType,
  workspaceName,
}: {
  initialType: ListingType;
  workspaceName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState<ListingType>(initialType);
  const [error, setError] = useState<string | null>(null);

  // Exit fields
  const [askType, setAskType] = useState<ExitAskType>("open_to_offers");
  const [askAmount, setAskAmount] = useState("");
  const [sector, setSector] = useState("");
  const [stage, setStage] = useState("");

  // Partnership fields
  const [seekingType, setSeekingType] = useState<SeekingType>("co_founder");
  const [skillsInput, setSkillsInput] = useState("");
  const [equityExpectations, setEquityExpectations] = useState("");
  const [commitmentType, setCommitmentType] = useState<CommitmentType>("full_time");

  // Shared fields
  const [publicSummary, setPublicSummary] = useState("");
  const [notes, setNotes] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const typeData =
      type === "exit"
        ? {
            ask_type: askType,
            ask_amount_sar: askAmount || undefined,
            sector: sector || undefined,
            stage: stage || undefined,
          }
        : {
            seeking_type: seekingType,
            skills: skillsInput
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
              .slice(0, 10),
            equity_expectations: equityExpectations || undefined,
            commitment_type: commitmentType,
          };

    const fd = new FormData();
    fd.set("listing_type", type);
    fd.set("public_summary", publicSummary);
    fd.set("notes", notes);
    fd.set("type_data_json", JSON.stringify(typeData));

    startTransition(async () => {
      const res = await createConnectionListing(fd);
      if (!res.ok) {
        setError(res.error ?? "Failed to create listing.");
        return;
      }
      router.push(`/connections/${res.listingId}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Type selector */}
      <fieldset className="space-y-3">
        <legend className="text-label-md uppercase text-(--color-on-surface-variant)">
          Listing type
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <TypeRadio
            value="exit"
            current={type}
            onChange={setType}
            label="Exit"
            description={`Sell, merge, or acqui-hire ${workspaceName}.`}
            color="#C73E9D"
          />
          <TypeRadio
            value="partnership"
            current={type}
            onChange={setType}
            label="Partnership"
            description="Seek a co-founder, advisor, senior hire, or business partner."
            color="#8A6FE8"
          />
        </div>
      </fieldset>

      {/* Type-specific fields */}
      {type === "exit" ? (
        <fieldset className="space-y-4">
          <legend className="text-label-md uppercase text-(--color-on-surface-variant)">
            Exit details
          </legend>
          <Field label="Ask type">
            <select
              value={askType}
              onChange={(e) => setAskType(e.target.value as ExitAskType)}
              className="w-full rounded-lg bg-(--color-surface-container-high) px-3 py-2 ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
            >
              <option value="active_sale">Active sale</option>
              <option value="open_to_offers">Open to offers</option>
              <option value="acqui_hire">Acqui-hire</option>
              <option value="merger">Merger</option>
            </select>
          </Field>
          <Field
            label="Ask amount (SAR)"
            hint="Optional. Leave blank for &lsquo;open to offers&rsquo;."
          >
            <input
              type="text"
              inputMode="numeric"
              value={askAmount}
              onChange={(e) => setAskAmount(e.target.value)}
              placeholder="e.g. 12000000"
              className="w-full rounded-lg bg-(--color-surface-container-high) px-3 py-2 ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary) tabular-nums"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sector">
              <input
                type="text"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                placeholder="e.g. B2B procurement"
                className="w-full rounded-lg bg-(--color-surface-container-high) px-3 py-2 ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
              />
            </Field>
            <Field label="Stage">
              <input
                type="text"
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                placeholder="e.g. Series A"
                className="w-full rounded-lg bg-(--color-surface-container-high) px-3 py-2 ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
              />
            </Field>
          </div>
        </fieldset>
      ) : (
        <fieldset className="space-y-4">
          <legend className="text-label-md uppercase text-(--color-on-surface-variant)">
            Partnership details
          </legend>
          <Field label="Seeking">
            <select
              value={seekingType}
              onChange={(e) => setSeekingType(e.target.value as SeekingType)}
              className="w-full rounded-lg bg-(--color-surface-container-high) px-3 py-2 ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
            >
              <option value="co_founder">Co-founder</option>
              <option value="advisor">Advisor</option>
              <option value="senior_hire">Senior hire</option>
              <option value="business_partner">Business partner</option>
            </select>
          </Field>
          <Field
            label="Skills"
            hint="Comma-separated, up to 10."
          >
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="growth, b2b sales, KSA market"
              className="w-full rounded-lg bg-(--color-surface-container-high) px-3 py-2 ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
            />
          </Field>
          <Field label="Commitment">
            <select
              value={commitmentType}
              onChange={(e) => setCommitmentType(e.target.value as CommitmentType)}
              className="w-full rounded-lg bg-(--color-surface-container-high) px-3 py-2 ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
            >
              <option value="full_time">Full-time</option>
              <option value="part_time">Part-time</option>
              <option value="advisory">Advisory</option>
              <option value="flexible">Flexible</option>
            </select>
          </Field>
          <Field
            label="Equity expectations"
            hint="Optional. What the prospective partner would receive."
          >
            <textarea
              value={equityExpectations}
              onChange={(e) => setEquityExpectations(e.target.value)}
              rows={2}
              maxLength={200}
              placeholder="e.g. 5-15% equity vesting over 4 years"
              className="w-full rounded-lg bg-(--color-surface-container-high) px-3 py-2 ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
            />
          </Field>
        </fieldset>
      )}

      {/* Shared fields */}
      <Field
        label="Public summary"
        hint={`Up to 500 characters. Visible to all VenturePath members.`}
      >
        <textarea
          value={publicSummary}
          onChange={(e) => setPublicSummary(e.target.value)}
          rows={4}
          maxLength={500}
          required
          placeholder={
            type === "exit"
              ? "What you can share publicly about the exit opportunity."
              : "What you're looking for and what you bring to the table."
          }
          className="w-full rounded-lg bg-(--color-surface-container-high) px-3 py-2 ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
        />
        <p className="text-body-sm text-(--color-on-surface-variant) tabular-nums">
          {publicSummary.length}/500
        </p>
      </Field>

      <Field
        label="Private notes"
        hint="Optional, not shown publicly. For your own reference."
      >
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={1000}
          className="w-full rounded-lg bg-(--color-surface-container-high) px-3 py-2 ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
        />
      </Field>

      {error && (
        <div
          role="alert"
          className="rounded-lg p-4 bg-(--color-error-container) text-(--color-on-error-container) text-body-sm"
        >
          {error}
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.push("/connections")}
          className="rounded-lg ghost-border px-4 py-2 text-label-sm hover:bg-(--color-surface-container-high)"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-(--color-primary) text-(--color-on-primary) px-4 py-2 text-label-sm hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Publishing…" : "Publish listing"}
        </button>
      </div>
    </form>
  );
}

function TypeRadio({
  value,
  current,
  onChange,
  label,
  description,
  color,
}: {
  value: ListingType;
  current: ListingType;
  onChange: (v: ListingType) => void;
  label: string;
  description: string;
  color: string;
}) {
  const checked = current === value;
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`text-left rounded-xl p-4 space-y-1 transition-colors ${
        checked
          ? "bg-(--color-surface-container-high) ring-2 ring-(--color-primary)"
          : "ghost-border hover:bg-(--color-surface-container-high)"
      }`}
      aria-pressed={checked}
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-label-sm font-medium uppercase tracking-[0.05em]"
          style={{
            backgroundColor: `${color}26`,
            color,
          }}
        >
          {label}
        </span>
      </div>
      <p className="text-body-sm text-(--color-on-surface-variant)">{description}</p>
    </button>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-label-md text-(--color-on-surface)">{label}</span>
      {children}
      {hint && (
        <span className="text-body-sm text-(--color-on-surface-variant)">{hint}</span>
      )}
    </label>
  );
}
