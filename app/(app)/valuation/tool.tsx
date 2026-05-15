"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Dec } from "@/lib/cap-table/decimal";
import {
  berkus,
  dcf,
  revenueMultiple,
  scorecard,
  type ValuationRange,
} from "@/lib/valuation/methods";

import { saveSession } from "./actions";

export interface SeedTraction {
  latest_mrr_sar: string | null;
  latest_gross_margin_pct: string | null;
  sector: string;
  funding_stage: string;
}

type Methodology = "revenue_multiple" | "scorecard" | "berkus" | "dcf";

const inputClass =
  "block w-full rounded-sm bg-(--color-surface-container-high) ghost-border px-3 py-2 focus:outline-none focus:border-(--color-primary) tabular-nums";

const METHODOLOGY_LABELS: Record<Methodology, string> = {
  revenue_multiple: "Revenue Multiple",
  scorecard: "Scorecard",
  berkus: "Berkus",
  dcf: "DCF",
};

const METHODOLOGY_DESCRIPTIONS: Record<Methodology, string> = {
  revenue_multiple: "For post-revenue startups. ARR × sector multiple range.",
  scorecard: "For pre-revenue. Weighted scoring vs comparable median.",
  berkus: "For pre-revenue, max ~SAR 10M. Sum of 5 driver scores.",
  dcf: "For growth-stage. 5-year projections + terminal value, discounted.",
};

function fmtSAR(d: InstanceType<typeof Dec>): string {
  const n = Number(d.toFixed(0));
  return `SAR ${n.toLocaleString("en-US")}`;
}

function tryDec(s: string, fallback: string): InstanceType<typeof Dec> {
  try {
    const d = new Dec(s);
    if (!d.isFinite() || d.isNaN()) return new Dec(fallback);
    return d;
  } catch {
    return new Dec(fallback);
  }
}

export function ValuationTool({ seedTraction }: { seedTraction: SeedTraction }) {
  const router = useRouter();
  const [methodology, setMethodology] = useState<Methodology>("revenue_multiple");
  const [saveLabel, setSaveLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Revenue Multiple inputs
  const annualizedMRR = seedTraction.latest_mrr_sar
    ? new Dec(seedTraction.latest_mrr_sar).mul(12).toFixed(0)
    : "1000000";
  const [arr, setArr] = useState(annualizedMRR);
  const [yoy, setYoy] = useState("80");
  const [margin, setMargin] = useState(seedTraction.latest_gross_margin_pct ?? "65");
  const [mMin, setMMin] = useState("4");
  const [mMid, setMMid] = useState("8");
  const [mMax, setMMax] = useState("14");

  // Scorecard inputs
  const [scTeam, setScTeam] = useState("7");
  const [scMarket, setScMarket] = useState("7");
  const [scProduct, setScProduct] = useState("6");
  const [scCompetition, setScCompetition] = useState("5");
  const [scComparable, setScComparable] = useState("5000000");

  // Berkus inputs
  const [bIdea, setBIdea] = useState("1500000");
  const [bProto, setBProto] = useState("1000000");
  const [bTeam, setBTeam] = useState("2000000");
  const [bRel, setBRel] = useState("500000");
  const [bRoll, setBRoll] = useState("500000");

  // DCF inputs
  const [dcfRevs, setDcfRevs] = useState<string[]>([
    String(Number(annualizedMRR) || 1_000_000),
    String((Number(annualizedMRR) || 1_000_000) * 2),
    String((Number(annualizedMRR) || 1_000_000) * 4),
    String((Number(annualizedMRR) || 1_000_000) * 7),
    String((Number(annualizedMRR) || 1_000_000) * 10),
  ]);
  const [dcfMargins, setDcfMargins] = useState<string[]>(["0", "10", "15", "20", "25"]);
  const [dcfDiscount, setDcfDiscount] = useState("25");
  const [dcfTerminal, setDcfTerminal] = useState("8");

  const result = useMemo<ValuationRange | null>(() => {
    try {
      switch (methodology) {
        case "revenue_multiple":
          return revenueMultiple({
            arr_sar: tryDec(arr, "0"),
            yoy_growth_pct: tryDec(yoy, "0"),
            gross_margin_pct: tryDec(margin, "0"),
            multiple_min: tryDec(mMin, "0"),
            multiple_mid: tryDec(mMid, "0"),
            multiple_max: tryDec(mMax, "0"),
          });
        case "scorecard":
          return scorecard({
            team_score: tryDec(scTeam, "5"),
            market_size_score: tryDec(scMarket, "5"),
            product_stage_score: tryDec(scProduct, "5"),
            competition_score: tryDec(scCompetition, "5"),
            comparable_median_sar: tryDec(scComparable, "0"),
          });
        case "berkus":
          return berkus({
            idea_sar: tryDec(bIdea, "0"),
            prototype_sar: tryDec(bProto, "0"),
            team_sar: tryDec(bTeam, "0"),
            relationships_sar: tryDec(bRel, "0"),
            rollout_sar: tryDec(bRoll, "0"),
            driver_max_sar: new Dec("2000000"),
          });
        case "dcf":
          return dcf({
            revenues_sar: dcfRevs.map((v) => tryDec(v, "0")) as Parameters<typeof dcf>[0]["revenues_sar"],
            ebitda_margin_pcts: dcfMargins.map((v) => tryDec(v, "0")) as Parameters<typeof dcf>[0]["ebitda_margin_pcts"],
            discount_rate_pct: tryDec(dcfDiscount, "20"),
            terminal_multiple: tryDec(dcfTerminal, "5"),
          });
      }
    } catch {
      return null;
    }
  }, [
    methodology, arr, yoy, margin, mMin, mMid, mMax,
    scTeam, scMarket, scProduct, scCompetition, scComparable,
    bIdea, bProto, bTeam, bRel, bRoll,
    dcfRevs, dcfMargins, dcfDiscount, dcfTerminal,
  ]);

  async function onSave() {
    if (!result || !saveLabel.trim()) {
      setSaveError("Add a label first.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    const inputs: Record<string, unknown> = {
      revenue_multiple: { arr, yoy, margin, mMin, mMid, mMax },
      scorecard: { scTeam, scMarket, scProduct, scCompetition, scComparable },
      berkus: { bIdea, bProto, bTeam, bRel, bRoll },
      dcf: { dcfRevs, dcfMargins, dcfDiscount, dcfTerminal },
    }[methodology] as Record<string, unknown>;

    const r = await saveSession({
      label: saveLabel.trim(),
      methodology,
      inputs,
      low: result.low_sar.toFixed(2),
      mid: result.mid_sar.toFixed(2),
      high: result.high_sar.toFixed(2),
    });
    setSaving(false);
    if (!r.ok) {
      setSaveError(r.error ?? "Failed.");
      return;
    }
    setSaveLabel("");
    router.refresh();
  }

  return (
    <>
      <section>
        <h2 className="text-label-md uppercase text-(--color-on-surface-variant) mb-4">
          Methodology
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {(Object.keys(METHODOLOGY_LABELS) as Methodology[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethodology(m)}
              aria-pressed={methodology === m}
              className={`rounded-md p-4 text-start transition-colors ${
                methodology === m
                  ? "bg-(--color-primary)/15 border border-(--color-primary)"
                  : "bg-(--color-surface-container-high) ghost-border hover:bg-(--color-surface-bright)"
              }`}
            >
              <p className="text-label-lg font-medium">{METHODOLOGY_LABELS[m]}</p>
              <p className="mt-1 text-body-sm text-(--color-on-surface-variant)">
                {METHODOLOGY_DESCRIPTIONS[m]}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-(--color-surface-container-low) p-6">
        <h2 className="text-label-md uppercase text-(--color-on-surface-variant) mb-4">
          {METHODOLOGY_LABELS[methodology]} inputs
        </h2>

        {methodology === "revenue_multiple" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="ARR (SAR)" hint="auto-pulled from MRR × 12 if available">
              <input value={arr} onChange={(e) => setArr(e.target.value)} className={inputClass} />
            </Field>
            <Field label="YoY growth (%)">
              <input value={yoy} onChange={(e) => setYoy(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Gross margin (%)">
              <input value={margin} onChange={(e) => setMargin(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Multiple min">
              <input value={mMin} onChange={(e) => setMMin(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Multiple mid (recommended)">
              <input value={mMid} onChange={(e) => setMMid(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Multiple max">
              <input value={mMax} onChange={(e) => setMMax(e.target.value)} className={inputClass} />
            </Field>
          </div>
        )}

        {methodology === "scorecard" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Team score (0–10)">
              <input value={scTeam} onChange={(e) => setScTeam(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Market size (0–10)">
              <input value={scMarket} onChange={(e) => setScMarket(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Product stage (0–10)">
              <input value={scProduct} onChange={(e) => setScProduct(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Competition (0–10)">
              <input value={scCompetition} onChange={(e) => setScCompetition(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Comparable median (SAR)">
              <input value={scComparable} onChange={(e) => setScComparable(e.target.value)} className={inputClass} />
            </Field>
          </div>
        )}

        {methodology === "berkus" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Idea (SAR, max 2M)">
              <input value={bIdea} onChange={(e) => setBIdea(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Prototype">
              <input value={bProto} onChange={(e) => setBProto(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Team">
              <input value={bTeam} onChange={(e) => setBTeam(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Relationships">
              <input value={bRel} onChange={(e) => setBRel(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Rollout">
              <input value={bRoll} onChange={(e) => setBRoll(e.target.value)} className={inputClass} />
            </Field>
          </div>
        )}

        {methodology === "dcf" && (
          <div className="space-y-4">
            <p className="text-body-sm text-(--color-on-surface-variant)">
              Year 1 = next 12 months. Margins are EBITDA margin per year.
            </p>
            <div className="grid grid-cols-5 gap-2">
              {dcfRevs.map((v, i) => (
                <Field key={`r-${i}`} label={`Y${i + 1} revenue (SAR)`}>
                  <input
                    value={v}
                    onChange={(e) => {
                      const next = [...dcfRevs];
                      next[i] = e.target.value;
                      setDcfRevs(next);
                    }}
                    className={inputClass}
                  />
                </Field>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-2">
              {dcfMargins.map((v, i) => (
                <Field key={`m-${i}`} label={`Y${i + 1} margin (%)`}>
                  <input
                    value={v}
                    onChange={(e) => {
                      const next = [...dcfMargins];
                      next[i] = e.target.value;
                      setDcfMargins(next);
                    }}
                    className={inputClass}
                  />
                </Field>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Discount rate (%)">
                <input value={dcfDiscount} onChange={(e) => setDcfDiscount(e.target.value)} className={inputClass} />
              </Field>
              <Field label="Terminal multiple (× Y5 EBITDA)">
                <input value={dcfTerminal} onChange={(e) => setDcfTerminal(e.target.value)} className={inputClass} />
              </Field>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-xl bg-(--color-surface-container-low) p-6">
        <h2 className="text-label-md uppercase text-(--color-on-surface-variant) mb-4">
          Result
        </h2>
        {result ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Tile label="Low" value={fmtSAR(result.low_sar)} />
              <Tile label="Mid — recommended" value={fmtSAR(result.mid_sar)} highlight />
              <Tile label="High" value={fmtSAR(result.high_sar)} />
            </div>
            <ul className="mt-4 space-y-1 text-body-sm text-(--color-on-surface-variant)">
              {result.notes.map((n, i) => (
                <li key={i}>• {n}</li>
              ))}
            </ul>

            <div className="mt-6 flex items-center gap-3 flex-wrap">
              <input
                type="text"
                value={saveLabel}
                onChange={(e) => setSaveLabel(e.target.value)}
                placeholder="Label this session (e.g. 'Seed pitch Q3')"
                className={`${inputClass} flex-1 min-w-48`}
              />
              <button
                type="button"
                onClick={onSave}
                disabled={saving || !saveLabel.trim()}
                className="btn-primary-gradient rounded-lg px-5 py-2 text-label-lg font-medium disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save session"}
              </button>
            </div>
            {saveError && (
              <p className="mt-2 text-body-sm text-(--color-error)" role="alert">
                {saveError}
              </p>
            )}
          </>
        ) : (
          <p className="text-body-sm text-(--color-error)">Invalid input.</p>
        )}
      </section>
    </>
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
    <label className="block">
      <span className="text-label-md uppercase text-(--color-on-surface-variant)">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && (
        <span className="mt-1 block text-body-sm text-(--color-on-surface-variant)">{hint}</span>
      )}
    </label>
  );
}

function Tile({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-md p-4 ${
        highlight
          ? "bg-(--color-primary)/15 border border-(--color-primary)"
          : "bg-(--color-surface-container-high)"
      }`}
    >
      <p className="text-label-md uppercase text-(--color-on-surface-variant)">{label}</p>
      <p className="mt-2 text-headline-sm font-semibold tracking-tight tabular-nums">{value}</p>
    </div>
  );
}
