"use client";

import { useState, useTransition } from "react";

import {
  dilutionVerdict,
  impliedDilutionPct,
} from "@/lib/cap-table/implied-dilution";
import { useT } from "@/lib/i18n/useT";

import { createRound } from "../actions";

const INSTRUMENT_OPTIONS = [
  { value: "isafe", label: "iSAFE", desc: "Sharia-compliant SAFE (recommended for KSA)" },
  { value: "safe", label: "SAFE", desc: "Standard SAFE — post-money or pre-money" },
  { value: "convertible_note", label: "Convertible Note", desc: "Interest-bearing convertible debt" },
  { value: "ordinary", label: "Priced Round", desc: "Direct ordinary share issuance" },
];

export function NewRoundForm() {
  const t = useT("rounds");
  const [instrument, setInstrument] = useState("isafe");
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [preMoney, setPreMoney] = useState("");
  const [targetRaise, setTargetRaise] = useState("");

  const dilutionPct = impliedDilutionPct(
    parseFloat(preMoney),
    parseFloat(targetRaise),
  );
  const verdict = dilutionVerdict(dilutionPct);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createRound(fd);
      if (!result?.ok) setError(result?.error ?? "Something went wrong.");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Round name */}
      <div className="space-y-1.5">
        <label className="text-label-lg" htmlFor="name">
          Round name <span className="text-(--color-error)">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="e.g. Seed, Pre-Series A"
          className="w-full rounded-lg bg-(--color-surface-container-high) px-4 py-2.5 text-body-md ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary)/40"
        />
      </div>

      {/* Instrument type */}
      <fieldset className="space-y-1.5">
        <legend className="text-label-lg">
          Instrument type <span className="text-(--color-error)">*</span>
        </legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {INSTRUMENT_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer flex-col gap-0.5 rounded-lg p-3 transition-colors ${
                instrument === opt.value
                  ? "bg-(--color-primary)/10 ring-1 ring-(--color-primary)/40"
                  : "bg-(--color-surface-container-high) hover:bg-(--color-surface-bright)"
              }`}
            >
              <input
                type="radio"
                name="instrument_type"
                value={opt.value}
                checked={instrument === opt.value}
                onChange={() => setInstrument(opt.value)}
                className="sr-only"
              />
              <span className="text-label-lg font-medium">{opt.label}</span>
              <span className="text-body-sm text-(--color-on-surface-variant)">{opt.desc}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Pre-money valuation */}
      <div className="space-y-1.5">
        <label className="text-label-lg" htmlFor="pre_money_valuation_sar">
          Pre-money valuation (SAR)
        </label>
        <input
          id="pre_money_valuation_sar"
          name="pre_money_valuation_sar"
          type="number"
          min="0"
          step="1"
          placeholder="e.g. 5000000"
          value={preMoney}
          onChange={(e) => setPreMoney(e.target.value)}
          className="w-full rounded-lg bg-(--color-surface-container-high) px-4 py-2.5 text-body-md ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary)/40"
        />
        <p className="text-body-sm text-(--color-on-surface-variant)">
          Can be set or updated when you close the round.
        </p>
      </div>

      {/* Target raise */}
      <div className="space-y-1.5">
        <label className="text-label-lg" htmlFor="target_raise_sar">
          Target raise (SAR)
        </label>
        <input
          id="target_raise_sar"
          name="target_raise_sar"
          type="number"
          min="0"
          step="1"
          placeholder="e.g. 2000000"
          value={targetRaise}
          onChange={(e) => setTargetRaise(e.target.value)}
          className="w-full rounded-lg bg-(--color-surface-container-high) px-4 py-2.5 text-body-md ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary)/40"
        />

        {/* Dilution preview banner */}
        {verdict === "warn" && dilutionPct !== null && (
          <p className="mt-2 rounded-md bg-(--color-warning)/10 px-3 py-2 text-body-sm text-(--color-warning)">
            {t("new.dilution_warn", { pct: dilutionPct.toFixed(1) })}
          </p>
        )}
        {verdict === "block" && dilutionPct !== null && (
          <p className="mt-2 rounded-md bg-(--color-error)/10 px-3 py-2 text-body-sm text-(--color-error)">
            {t("new.dilution_block", { pct: dilutionPct.toFixed(1) })}
          </p>
        )}
      </div>

      {/* Lead investor */}
      <div className="space-y-1.5">
        <label className="text-label-lg" htmlFor="lead_investor">
          Lead investor
        </label>
        <input
          id="lead_investor"
          name="lead_investor"
          type="text"
          placeholder="e.g. Sanabil Investments"
          className="w-full rounded-lg bg-(--color-surface-container-high) px-4 py-2.5 text-body-md ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary)/40"
        />
      </div>

      {/* Expected close date */}
      <div className="space-y-1.5">
        <label className="text-label-lg" htmlFor="close_date">
          Expected close date
        </label>
        <input
          id="close_date"
          name="close_date"
          type="date"
          className="w-full rounded-lg bg-(--color-surface-container-high) px-4 py-2.5 text-body-md ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary)/40"
        />
      </div>

      {/* Discoverability toggle */}
      <div className="rounded-xl bg-(--color-surface-container-low) p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-label-lg font-medium">
              Make this round discoverable to other investors on VenturePath
            </p>
            <p className="text-body-sm text-(--color-on-surface-variant) max-w-md">
              Your round will appear in the Browse tab. Round details and
              documents are still protected.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isPublic}
            onClick={() => setIsPublic((v) => !v)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              isPublic
                ? "bg-(--color-primary)/60"
                : "bg-(--color-surface-bright)"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-(--color-on-surface) transition-transform ${
                isPublic ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
        {isPublic && (
          <p className="mt-3 rounded-md bg-(--color-warning)/10 px-3 py-2 text-body-sm text-(--color-warning)">
            Drafts are never shown publicly. Open the round to publish it in the Browse tab.
          </p>
        )}
      </div>
      {/* Hidden field so FormData carries the boolean */}
      <input type="hidden" name="is_public" value={isPublic ? "true" : "false"} />

      {error && (
        <p className="rounded-lg bg-(--color-error)/10 px-4 py-3 text-body-sm text-(--color-error)">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending || verdict === "block"}
          className="rounded-lg bg-(--color-primary)/15 px-5 py-2.5 text-label-lg text-(--color-primary) hover:bg-(--color-primary)/25 transition-colors disabled:opacity-50"
        >
          {isPending ? "Creating…" : "Create round"}
        </button>
        <a
          href="/rounds"
          className="rounded-lg px-5 py-2.5 text-label-lg text-(--color-on-surface-variant) hover:bg-(--color-surface-container-high) transition-colors"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
