import { notFound } from "next/navigation";
import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: Promise<{ token: string }>;
}

const TOKEN_RE = /^[0-9a-f]{32}$/i;

function fmtSar(n: unknown): string {
  if (n == null || n === "") return "—";
  const num = Number(n);
  if (!isFinite(num)) return "—";
  if (num >= 1_000_000) return `SAR ${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `SAR ${(num / 1_000).toFixed(0)}K`;
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

export default async function PublicInvestorUpdatePage({ params }: PageProps) {
  const { token } = await params;

  // Validate token shape to avoid unnecessary DB calls
  if (!TOKEN_RE.test(token)) notFound();

  const supabase = await createClient();

  // Fetch via anon client — the update must be published
  const { data: update } = await supabase
    .from("investor_updates")
    .select("id, subject, body, mrr_sar, runway_months, highlights, sent_at, round_id")
    .eq("token", token)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();
  if (!update) notFound();

  // Fetch workspace name via round
  const { data: round } = await supabase
    .from("financing_rounds")
    .select("name, workspace_id")
    .eq("id", update.round_id)
    .maybeSingle();

  // Get workspace name
  const { data: workspace } = round
    ? await supabase.from("workspaces").select("name").eq("id", round.workspace_id).maybeSingle()
    : { data: null };

  // Record view (fire & forget — failure is non-fatal)
  const hdrs = await headers();
  const userAgent = hdrs.get("user-agent");
  void supabase.rpc("record_investor_update_view", {
    p_token: token,
    p_user_agent: userAgent,
  });

  const highlights = (update.highlights ?? []) as string[];

  return (
    <main className="min-h-screen bg-(--color-background) text-(--color-on-background)">
      <div className="mx-auto max-w-2xl px-6 py-16 space-y-8">
        {/* Header */}
        <header className="border-b border-(--color-outline-variant)/30 pb-8">
          <p className="text-label-md uppercase text-(--color-on-surface-variant)">
            {workspace?.name ?? "Investor Update"}
            {round?.name ? ` · ${round.name}` : ""}
          </p>
          <h1 className="mt-2 text-display-sm font-semibold tracking-tight">
            {update.subject}
          </h1>
          {update.sent_at && (
            <p className="mt-2 text-body-sm text-(--color-on-surface-variant)">
              {fmtDate(update.sent_at)}
            </p>
          )}
        </header>

        {/* Metrics */}
        {(update.mrr_sar != null || update.runway_months != null) && (
          <section className="rounded-xl bg-(--color-surface-container-low) p-6 grid grid-cols-2 gap-6">
            {update.mrr_sar != null && (
              <div>
                <p className="text-label-md uppercase text-(--color-on-surface-variant) mb-1">MRR</p>
                <p className="text-display-sm font-semibold tabular-nums">{fmtSar(update.mrr_sar)}</p>
              </div>
            )}
            {update.runway_months != null && (
              <div>
                <p className="text-label-md uppercase text-(--color-on-surface-variant) mb-1">Runway</p>
                <p className="text-display-sm font-semibold tabular-nums">{update.runway_months} mo</p>
              </div>
            )}
          </section>
        )}

        {/* Highlights */}
        {highlights.length > 0 && (
          <section>
            <h2 className="text-label-md uppercase text-(--color-on-surface-variant) mb-4">Highlights</h2>
            <ul className="space-y-2">
              {highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-3 text-body-md">
                  <span className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-(--color-primary)" />
                  {h}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Body */}
        <section>
          <h2 className="text-label-md uppercase text-(--color-on-surface-variant) mb-4">Full Update</h2>
          <div className="text-body-md whitespace-pre-wrap leading-relaxed">
            {update.body}
          </div>
        </section>

        <footer className="pt-6 border-t border-(--color-outline-variant)/20">
          <p className="text-body-sm text-(--color-on-surface-variant)">
            Sent by {workspace?.name ?? "your investor"} via VenturePath.
          </p>
        </footer>
      </div>
    </main>
  );
}
