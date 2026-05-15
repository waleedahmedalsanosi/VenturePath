import Link from "next/link";
import { redirect, notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

import { TermSheetStatusBar } from "./status-bar";
import { PrintButton } from "./print-button";

interface PageProps {
  params: Promise<{ id: string }>;
}

const INSTRUMENT_LABELS: Record<string, string> = {
  isafe: "iSAFE (Sharia-Compliant Convertible)",
  safe: "SAFE (Simple Agreement for Future Equity)",
  convertible_note: "Convertible Note",
  ordinary: "Ordinary Share (Priced Round)",
};

function fmtSar(n: unknown): string {
  if (n == null || n === "") return "—";
  const num = Number(n);
  if (!isFinite(num)) return "—";
  return `SAR ${num.toLocaleString()}`;
}

function fmtDate(s: string | null | undefined): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function TermSheetViewPage({ params }: PageProps) {
  const { id } = await params;

  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/setup");

  const supabase = await createClient();

  const { data: ts } = await supabase
    .from("term_sheets")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", workspace.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!ts) notFound();

  const { data: round } = await supabase
    .from("financing_rounds")
    .select("id, name, status")
    .eq("id", ts.round_id)
    .maybeSingle();

  const terms = (ts.terms ?? {}) as Record<string, string | number | undefined>;
  const isEditable = ts.status === "draft" || ts.status === "sent";

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 space-y-6">
      {/* Toolbar — hidden on print */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href={`/rounds/${ts.round_id}`}
          className="text-body-sm text-(--color-on-surface-variant) underline"
        >
          ← Back to {round?.name ?? "round"}
        </Link>
        <div className="flex items-center gap-3">
          {isEditable && (
            <Link
              href={`/term-sheets/${id}/edit`}
              className="rounded-lg ghost-border px-4 py-2 text-label-sm hover:bg-(--color-surface-container-high)"
            >
              Edit
            </Link>
          )}
          <PrintButton />
        </div>
      </div>

      {/* Status bar — hidden on print */}
      <div className="print:hidden">
        <TermSheetStatusBar
          termSheetId={id}
          status={ts.status}
          sentAt={ts.sent_at}
          signedAt={ts.signed_at}
        />
      </div>

      {/* The document itself */}
      <article className="rounded-xl bg-(--color-surface-container-low) p-8 sm:p-12 space-y-8 print:bg-white print:text-black print:p-0">
        <header className="border-b border-(--color-outline-variant)/30 pb-6 print:border-gray-300">
          <p className="text-label-md uppercase text-(--color-on-surface-variant) print:text-gray-600">
            Term Sheet
          </p>
          <h1 className="mt-1 text-display-sm font-semibold tracking-tight">
            {workspace.name}
          </h1>
          <p className="mt-2 text-body-md text-(--color-on-surface-variant) print:text-gray-700">
            {round?.name ?? "—"} · {INSTRUMENT_LABELS[ts.instrument_type] ?? ts.instrument_type}
          </p>
          <p className="mt-1 text-body-sm text-(--color-on-surface-variant) print:text-gray-600">
            Version {ts.version} · Issued {fmtDate(ts.created_at)}
          </p>
        </header>

        <Section title="Investor">
          <KV label="Name" value={ts.investor_name} />
          {ts.firm && <KV label="Firm" value={ts.firm} />}
          {ts.investor_email && <KV label="Email" value={ts.investor_email} />}
        </Section>

        <Section title="Investment Terms">
          {ts.instrument_type === "isafe" && (
            <>
              <KV label="Instrument" value="iSAFE (Sharia-compliant)" />
              <KV label="Investment amount" value={fmtSar(terms.investment_sar)} mono />
              <KV label="Valuation cap" value={fmtSar(terms.valuation_cap_sar)} mono />
              <KV label="Profit-share ratio" value={`${terms.profit_share_ratio}%`} mono />
              <p className="mt-4 text-body-sm text-(--color-on-surface-variant) print:text-gray-700">
                The iSAFE will convert at the lower of (a) the valuation cap, or
                (b) the actual valuation in the next priced equity round.
                Profit-share ratio is the share of profits the investor is
                entitled to until conversion, in lieu of interest.
              </p>
            </>
          )}

          {ts.instrument_type === "safe" && (
            <>
              <KV label="Instrument" value={`SAFE (${terms.safe_type === "pre_money" ? "Pre-money" : "Post-money"})`} />
              <KV label="Investment amount" value={fmtSar(terms.investment_sar)} mono />
              <KV label="Valuation cap" value={fmtSar(terms.valuation_cap_sar)} mono />
              {terms.discount_rate && terms.discount_rate !== "" && (
                <KV label="Discount rate" value={`${terms.discount_rate}%`} mono />
              )}
            </>
          )}

          {ts.instrument_type === "convertible_note" && (
            <>
              <KV label="Instrument" value="Convertible Note" />
              <KV label="Principal" value={fmtSar(terms.principal_sar)} mono />
              <KV label="Interest rate" value={`${terms.interest_rate}% per annum`} mono />
              <KV label="Maturity date" value={fmtDate(terms.maturity_date as string)} />
              {terms.conversion_discount && (
                <KV label="Conversion discount" value={`${terms.conversion_discount}%`} mono />
              )}
              {terms.valuation_cap_sar && (
                <KV label="Valuation cap" value={fmtSar(terms.valuation_cap_sar)} mono />
              )}
            </>
          )}

          {ts.instrument_type === "ordinary" && (
            <>
              <KV label="Instrument" value="Ordinary Shares (priced)" />
              <KV label="Number of shares" value={Number(terms.shares ?? 0).toLocaleString()} mono />
              <KV label="Price per share" value={fmtSar(terms.price_per_share_sar)} mono />
              <KV
                label="Total consideration"
                value={fmtSar(
                  (Number(terms.shares) || 0) * (Number(terms.price_per_share_sar) || 0),
                )}
                mono
              />
            </>
          )}
        </Section>

        <Section title="Status">
          <KV
            label="Current status"
            value={ts.status[0]!.toUpperCase() + ts.status.slice(1)}
          />
          {ts.sent_at && <KV label="Sent on" value={fmtDate(ts.sent_at)} />}
          {ts.signed_at && <KV label="Signed on" value={fmtDate(ts.signed_at)} />}
        </Section>

        <footer className="mt-12 pt-6 border-t border-(--color-outline-variant)/30 print:border-gray-300">
          <div className="grid grid-cols-2 gap-8">
            <SignatureBlock label="Company" name={workspace.name} />
            <SignatureBlock label="Investor" name={ts.firm ?? ts.investor_name} />
          </div>
          <p className="mt-10 text-body-sm text-(--color-on-surface-variant) print:text-gray-600">
            This term sheet is a non-binding summary of the principal terms
            proposed for the investment. It is not an offer or commitment, and
            is subject to satisfactory due diligence, definitive agreements, and
            customary closing conditions.
          </p>
          <p className="mt-2 text-body-sm text-(--color-on-surface-variant) print:text-gray-500">
            Generated by VenturePath · {fmtDate(new Date().toISOString())}
          </p>
        </footer>
      </article>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-label-md uppercase text-(--color-on-surface-variant) mb-3 print:text-gray-600">
        {title}
      </h2>
      <dl className="space-y-2">{children}</dl>
    </section>
  );
}

function KV({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[180px_1fr] gap-4 items-baseline">
      <dt className="text-body-sm text-(--color-on-surface-variant) print:text-gray-600">{label}</dt>
      <dd className={`text-body-md ${mono ? "tabular-nums font-medium" : ""}`}>{value}</dd>
    </div>
  );
}

function SignatureBlock({ label, name }: { label: string; name: string }) {
  return (
    <div>
      <p className="text-label-md uppercase text-(--color-on-surface-variant) print:text-gray-600">{label}</p>
      <p className="mt-1 font-medium">{name}</p>
      <div className="mt-10 h-px bg-(--color-outline-variant)/40 print:bg-gray-400" />
      <p className="mt-2 text-body-sm text-(--color-on-surface-variant) print:text-gray-600">
        Signature · Date
      </p>
    </div>
  );
}

