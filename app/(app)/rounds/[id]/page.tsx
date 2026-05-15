import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

import { RoundActions } from "./round-actions";
import { VisibilityToggle } from "./visibility-toggle";
import { InvestorCrm } from "./crm";
import { DataRoom } from "./data-room";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-(--color-surface-bright) text-(--color-on-surface-variant)",
  open: "bg-(--color-info)/15 text-(--color-info)",
  closed: "bg-(--color-success)/20 text-(--color-success)",
};

const INSTRUMENT_LABELS: Record<string, string> = {
  isafe: "iSAFE",
  safe: "SAFE",
  convertible_note: "Convertible Note",
  ordinary: "Priced Round",
};

function fmtSar(n: string | number | null | undefined): string {
  if (n === null || n === undefined || n === "") return "—";
  const num = Number(n);
  if (!isFinite(num)) return "—";
  return `SAR ${num.toLocaleString()}`;
}

function fmtDate(s: string | null | undefined): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const INVESTOR_INSTRUMENT_CHIP: Record<string, string> = {
  ordinary: "bg-(--color-surface-bright) text-(--color-on-surface-variant)",
  isafe: "bg-(--color-success)/20 text-(--color-success)",
  safe: "bg-(--color-primary)/15 text-(--color-primary)",
  convertible_note: "bg-(--color-warning)/20 text-(--color-warning)",
};

export default async function RoundDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/setup");

  const supabase = await createClient();

  const { data: round } = await supabase
    .from("financing_rounds")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", workspace.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!round) notFound();

  // Investors: shareholders linked to this round OR all shareholders for context.
  const [
    { data: linkedInvestors },
    { data: pendingConvertibles },
    { data: pipelineContacts },
    { data: dataRoomLinks },
  ] = await Promise.all([
    supabase
      .from("shareholders")
      .select("id, name, email, instrument_type, entry_date, instrument_data")
      .eq("workspace_id", workspace.id)
      .eq("funding_round_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("shareholders")
      .select("id, name, instrument_type, instrument_data")
      .eq("workspace_id", workspace.id)
      .in("instrument_type", ["isafe", "safe"])
      .is("deleted_at", null),
    supabase
      .from("investor_pipeline")
      .select("id, name, email, firm, status, notes, last_contacted_at")
      .eq("round_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("data_room_links")
      .select("id, label, token, is_active, view_count, expires_at, created_at")
      .eq("round_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const unconverted = (pendingConvertibles ?? []).filter((s) => {
    const d = s.instrument_data as Record<string, unknown>;
    return d?.conversion_status === "unconverted";
  });

  const investors = linkedInvestors ?? [];

  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  const appUrl = `${proto}://${host}`;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      {/* Back + header */}
      <div>
        <Link
          href="/rounds"
          className="text-body-sm text-(--color-on-surface-variant) underline"
        >
          ← All rounds
        </Link>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-label-md uppercase text-(--color-on-surface-variant)">
              Fundraising round
            </p>
            <h1 className="mt-1 text-display-sm font-semibold tracking-tight">
              {round.name}
            </h1>
          </div>
          <span
            className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-label-sm font-medium uppercase tracking-wider shrink-0 ${STATUS_STYLES[round.status]}`}
          >
            {round.status}
          </span>
        </div>
      </div>

      {/* Round metadata */}
      <section className="rounded-xl bg-(--color-surface-container-low) p-6 grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
        <Stat label="Instrument" value={INSTRUMENT_LABELS[round.instrument_type] ?? round.instrument_type} />
        <Stat label="Pre-money valuation" value={fmtSar(round.pre_money_valuation_sar)} mono />
        <Stat label="Target raise" value={fmtSar(round.target_raise_sar)} mono />
        {round.status === "closed" && (
          <Stat label="Actual raised" value={fmtSar(round.actual_raise_sar)} mono />
        )}
        <Stat label="Lead investor" value={round.lead_investor ?? "—"} />
        <Stat
          label={round.status === "closed" ? "Closed" : "Expected close"}
          value={fmtDate(round.close_date)}
        />
        {round.board_resolution_id && (
          <div className="col-span-full">
            <p className="text-label-md uppercase text-(--color-on-surface-variant) mb-1">
              Board resolution
            </p>
            <Link
              href={`/governance/resolutions/${round.board_resolution_id}`}
              className="text-body-sm text-(--color-primary) underline"
            >
              View draft resolution →
            </Link>
          </div>
        )}
      </section>

      {/* Investors in this round */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
            Investors in this round
          </h2>
          {round.status !== "closed" && (
            <Link
              href={`/cap-table/add?funding_round_id=${id}`}
              className="rounded-lg ghost-border px-4 py-2 text-label-sm hover:bg-(--color-surface-container-high)"
            >
              + Add investor
            </Link>
          )}
        </div>

        {investors.length === 0 ? (
          <div className="rounded-xl bg-(--color-surface-container-low) px-6 py-8 text-center">
            <p className="text-body-md text-(--color-on-surface-variant)">
              No investors linked to this round yet.
              {round.status !== "closed" && (
                <> Use <strong>Add investor</strong> to link new shareholders.</>
              )}
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-(--color-surface-container-low) overflow-hidden">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="text-label-md uppercase text-(--color-on-surface-variant)">
                  <th className="px-4 py-3 text-start font-normal">Investor</th>
                  <th className="px-4 py-3 text-start font-normal">Instrument</th>
                  <th className="px-4 py-3 text-start font-normal">Amount / Shares</th>
                  <th className="px-4 py-3 text-start font-normal">Date</th>
                </tr>
              </thead>
              <tbody>
                {investors.map((inv) => {
                  const d = inv.instrument_data as Record<string, string>;
                  const amount =
                    inv.instrument_type === "ordinary"
                      ? `${Number(d.shares).toLocaleString()} shares`
                      : `SAR ${Number(d.investment_sar ?? d.principal_sar ?? 0).toLocaleString()}`;

                  return (
                    <tr
                      key={inv.id}
                      className="border-t border-(--color-outline-variant)/15 align-middle"
                    >
                      <td className="px-4 py-3 font-medium">
                        {inv.name}
                        {inv.email && (
                          <div className="text-body-sm text-(--color-on-surface-variant)">{inv.email}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-label-sm font-medium uppercase tracking-wider ${INVESTOR_INSTRUMENT_CHIP[inv.instrument_type]}`}
                        >
                          {INSTRUMENT_LABELS[inv.instrument_type] ?? inv.instrument_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-(--color-on-surface-variant)">
                        {amount}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-(--color-on-surface-variant) whitespace-nowrap">
                        {fmtDate(inv.entry_date)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Pending conversions notice */}
      {unconverted.length > 0 && round.status !== "closed" && (
        <section className="rounded-xl bg-(--color-warning)/10 px-5 py-4 space-y-1">
          <p className="text-label-lg text-(--color-warning) font-medium">
            {unconverted.length} unconverted instrument{unconverted.length > 1 ? "s" : ""} will convert on close
          </p>
          <p className="text-body-sm text-(--color-on-surface-variant)">
            {unconverted.map((s) => `${s.name} (${INSTRUMENT_LABELS[s.instrument_type]})`).join(", ")} — will
            become ordinary shares when you close this round.
          </p>
        </section>
      )}

      {/* Investor pipeline (CRM) */}
      <InvestorCrm
        roundId={round.id}
        contacts={(pipelineContacts ?? []) as Parameters<typeof InvestorCrm>[0]["contacts"]}
      />

      {/* Data room */}
      <DataRoom
        roundId={round.id}
        links={(dataRoomLinks ?? []) as Parameters<typeof DataRoom>[0]["links"]}
        appUrl={appUrl}
      />

      {/* Public visibility */}
      <VisibilityToggle
        roundId={round.id}
        isPublic={round.is_public}
        status={round.status}
        publicProfilePublished={workspace.public_profile_published}
      />

      {/* Actions */}
      {round.status !== "closed" && (
        <RoundActions roundId={round.id} status={round.status} />
      )}

      {/* Closed summary */}
      {round.status === "closed" && (
        <section className="rounded-xl bg-(--color-success)/10 px-5 py-4 space-y-1">
          <p className="text-label-lg text-(--color-success) font-medium">Round closed</p>
          <p className="text-body-sm text-(--color-on-surface-variant)">
            Closed on {fmtDate(round.close_date)} at a pre-money valuation of{" "}
            {fmtSar(round.pre_money_valuation_sar)}. All iSAFE and SAFE holders
            converted to ordinary shares — check the cap table for the updated
            ownership.
          </p>
          <Link
            href="/cap-table"
            className="inline-block mt-1 text-body-sm text-(--color-primary) underline"
          >
            View cap table →
          </Link>
        </section>
      )}
    </main>
  );
}

function Stat({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-label-md uppercase text-(--color-on-surface-variant) mb-0.5">
        {label}
      </p>
      <p className={`text-body-md font-medium ${mono ? "tabular-nums" : ""}`}>
        {value}
      </p>
    </div>
  );
}
