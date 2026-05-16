"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { useT } from "@/lib/i18n/useT";

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
  const t = useT("connections");
  const tCommon = useT();

  const [askType, setAskType] = useState<ExitAskType>("open_to_offers");
  const [askAmount, setAskAmount] = useState("");
  const [sector, setSector] = useState("");
  const [stage, setStage] = useState("");

  const [seekingType, setSeekingType] = useState<SeekingType>("co_founder");
  const [skillsInput, setSkillsInput] = useState("");
  const [equityExpectations, setEquityExpectations] = useState("");
  const [commitmentType, setCommitmentType] = useState<CommitmentType>("full_time");

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
        setError(res.error ?? t("new.error.generic"));
        return;
      }
      router.push(`/connections/${res.listingId}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <fieldset className="space-y-3">
        <legend className="text-label-md uppercase text-(--color-on-surface-variant)">
          {t("new.field.listing_type")}
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <TypeRadio
            value="exit"
            current={type}
            onChange={setType}
            label={t("new.field.listing_type.exit.label")}
            description={t("new.field.listing_type.exit.description", { company: workspaceName })}
            color="#C73E9D"
          />
          <TypeRadio
            value="partnership"
            current={type}
            onChange={setType}
            label={t("new.field.listing_type.partnership.label")}
            description={t("new.field.listing_type.partnership.description")}
            color="#8A6FE8"
          />
        </div>
      </fieldset>

      {type === "exit" ? (
        <fieldset className="space-y-4">
          <legend className="text-label-md uppercase text-(--color-on-surface-variant)">
            {t("new.exit.heading")}
          </legend>
          <Field label={t("new.exit.ask_type.label")}>
            <select
              value={askType}
              onChange={(e) => setAskType(e.target.value as ExitAskType)}
              className="w-full rounded-lg bg-(--color-surface-container-high) px-3 py-2 ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
            >
              <option value="active_sale">{t("new.exit.ask_type.active_sale")}</option>
              <option value="open_to_offers">{t("new.exit.ask_type.open_to_offers")}</option>
              <option value="acqui_hire">{t("new.exit.ask_type.acqui_hire")}</option>
              <option value="merger">{t("new.exit.ask_type.merger")}</option>
            </select>
          </Field>
          <Field label={t("new.exit.ask_amount.label")} hint={t("new.exit.ask_amount.hint")}>
            <input
              type="text"
              inputMode="numeric"
              value={askAmount}
              onChange={(e) => setAskAmount(e.target.value)}
              placeholder={t("new.exit.ask_amount.placeholder")}
              className="w-full rounded-lg bg-(--color-surface-container-high) px-3 py-2 ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary) tabular-nums"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("new.exit.sector.label")}>
              <input
                type="text"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                placeholder={t("new.exit.sector.placeholder")}
                className="w-full rounded-lg bg-(--color-surface-container-high) px-3 py-2 ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
              />
            </Field>
            <Field label={t("new.exit.stage.label")}>
              <input
                type="text"
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                placeholder={t("new.exit.stage.placeholder")}
                className="w-full rounded-lg bg-(--color-surface-container-high) px-3 py-2 ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
              />
            </Field>
          </div>
        </fieldset>
      ) : (
        <fieldset className="space-y-4">
          <legend className="text-label-md uppercase text-(--color-on-surface-variant)">
            {t("new.partnership.heading")}
          </legend>
          <Field label={t("new.partnership.seeking_type.label")}>
            <select
              value={seekingType}
              onChange={(e) => setSeekingType(e.target.value as SeekingType)}
              className="w-full rounded-lg bg-(--color-surface-container-high) px-3 py-2 ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
            >
              <option value="co_founder">{t("new.partnership.seeking_type.co_founder")}</option>
              <option value="advisor">{t("new.partnership.seeking_type.advisor")}</option>
              <option value="senior_hire">{t("new.partnership.seeking_type.senior_hire")}</option>
              <option value="business_partner">{t("new.partnership.seeking_type.business_partner")}</option>
            </select>
          </Field>
          <Field label={t("new.partnership.skills.label")} hint={t("new.partnership.skills.hint")}>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder={t("new.partnership.skills.placeholder")}
              className="w-full rounded-lg bg-(--color-surface-container-high) px-3 py-2 ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
            />
          </Field>
          <Field label={t("new.partnership.commitment.label")}>
            <select
              value={commitmentType}
              onChange={(e) => setCommitmentType(e.target.value as CommitmentType)}
              className="w-full rounded-lg bg-(--color-surface-container-high) px-3 py-2 ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
            >
              <option value="full_time">{t("new.partnership.commitment.full_time")}</option>
              <option value="part_time">{t("new.partnership.commitment.part_time")}</option>
              <option value="advisory">{t("new.partnership.commitment.advisory")}</option>
              <option value="flexible">{t("new.partnership.commitment.flexible")}</option>
            </select>
          </Field>
          <Field label={t("new.partnership.equity.label")} hint={t("new.partnership.equity.hint")}>
            <textarea
              value={equityExpectations}
              onChange={(e) => setEquityExpectations(e.target.value)}
              rows={2}
              maxLength={200}
              placeholder={t("new.partnership.equity.placeholder")}
              className="w-full rounded-lg bg-(--color-surface-container-high) px-3 py-2 ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
            />
          </Field>
        </fieldset>
      )}

      <Field label={t("new.public_summary.label")} hint={t("new.public_summary.hint")}>
        <textarea
          value={publicSummary}
          onChange={(e) => setPublicSummary(e.target.value)}
          rows={4}
          maxLength={500}
          required
          placeholder={
            type === "exit"
              ? t("new.public_summary.placeholder.exit")
              : t("new.public_summary.placeholder.partnership")
          }
          className="w-full rounded-lg bg-(--color-surface-container-high) px-3 py-2 ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
        />
        <p className="text-body-sm text-(--color-on-surface-variant) tabular-nums">
          {t("new.public_summary.counter", { count: publicSummary.length })}
        </p>
      </Field>

      <Field label={t("new.notes.label")} hint={t("new.notes.hint")}>
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
          {tCommon("actions.cancel")}
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-(--color-primary) text-(--color-on-primary) px-4 py-2 text-label-sm hover:opacity-90 disabled:opacity-50"
        >
          {pending ? t("new.submitting") : t("new.submit")}
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
      className={`text-start rounded-xl p-4 space-y-1 transition-colors ${
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
