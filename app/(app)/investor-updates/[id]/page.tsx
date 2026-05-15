import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

import { UpdateActions } from "./update-actions-bar";
import { PrintButton } from "@/components/print-button";

interface PageProps {
  params: Promise<{ id: string }>;
}

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

function fmtRelative(s: string): string {
  const diff = Date.now() - new Date(s).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function deviceLabel(ua: string | null): string {
  if (!ua) return "Unknown";
  if (/mobile|android|iphone/i.test(ua)) return "Mobile";
  if (/tablet|ipad/i.test(ua)) return "Tablet";
  return "Desktop";
}

export default async function InvestorUpdateViewPage({ params }: PageProps) {
  const { id } = await params;

  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/setup");

  const supabase = await createClient();

  const { data: update } = await supabase
    .from("investor_updates")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", workspace.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!update) notFound();

  const { data: round } = await supabase
    .from("financing_rounds")
    .select("id, name, status")
    .eq("id", update.round_id)
    .maybeSingle();

  const { data: views } = await supabase
    .from("investor_update_views")
    .select("viewed_at, user_agent")
    .eq("update_id", id)
    .order("viewed_at", { ascending: false })
    .limit(50);

  // Build the public share URL
  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  const publicUrl = `${proto}://${host}/updates/${update.token}`;

  const viewCount = views?.length ?? 0;
  const uniqueDevices = new Set((views ?? []).map((v) => deviceLabel(v.user_agent))).size;
  const highlights = (update.highlights ?? []) as string[];

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href={`/rounds/${update.round_id}`}
          className="text-body-sm text-(--color-on-surface-variant) underline"
        >
          ← Back to {round?.name ?? "round"}
        </Link>
        <div className="flex items-center gap-2">
          <PrintButton label="Export PDF" />
          <UpdateActions
            updateId={id}
            roundId={update.round_id}
            status={update.status}
            publicUrl={publicUrl}
          />
        </div>
      </div>

      {/* Analytics bar — only for published updates */}
      {update.status === "published" && (
        <section className="rounded-xl bg-(--color-surface-container-low) p-5 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-display-sm font-semibold tabular-nums">{viewCount}</p>
            <p className="text-label-sm text-(--color-on-surface-variant) uppercase">Opens</p>
          </div>
          <div>
            <p className="text-display-sm font-semibold tabular-nums">
              {views && views.length > 0 ? fmtRelative(views[0]!.viewed_at) : "—"}
            </p>
            <p className="text-label-sm text-(--color-on-surface-variant) uppercase">Last open</p>
          </div>
          <div>
            <p className="text-display-sm font-semibold tabular-nums">{viewCount > 0 ? uniqueDevices : "—"}</p>
            <p className="text-label-sm text-(--color-on-surface-variant) uppercase">Device types</p>
          </div>
        </section>
      )}

      {/* Share link */}
      {update.status === "published" && (
        <section className="rounded-xl bg-(--color-info)/8 px-5 py-4 flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="text-label-sm text-(--color-info) font-medium mb-0.5">Public update link</p>
            <p className="text-body-sm text-(--color-on-surface-variant) truncate font-mono">{publicUrl}</p>
          </div>
        </section>
      )}

      {/* The update document */}
      <article className="rounded-xl bg-(--color-surface-container-low) p-8 sm:p-10 space-y-8">
        <header className="border-b border-(--color-outline-variant)/30 pb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-label-sm font-medium uppercase tracking-wider ${
              update.status === "published"
                ? "bg-(--color-success)/15 text-(--color-success)"
                : "bg-(--color-surface-bright) text-(--color-on-surface-variant)"
            }`}>
              {update.status === "published" ? "Sent" : "Draft"}
            </span>
            {update.sent_at && (
              <span className="text-body-sm text-(--color-on-surface-variant)">{fmtDate(update.sent_at)}</span>
            )}
          </div>
          <p className="text-label-md uppercase text-(--color-on-surface-variant)">
            {workspace.name} · {round?.name ?? "—"}
          </p>
          <h1 className="mt-1 text-display-sm font-semibold tracking-tight">
            {update.subject}
          </h1>
        </header>

        {/* Metrics */}
        {(update.mrr_sar != null || update.runway_months != null) && (
          <section className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            {update.mrr_sar != null && (
              <div>
                <p className="text-label-md uppercase text-(--color-on-surface-variant) mb-0.5">MRR</p>
                <p className="text-body-lg font-semibold tabular-nums">{fmtSar(update.mrr_sar)}</p>
              </div>
            )}
            {update.runway_months != null && (
              <div>
                <p className="text-label-md uppercase text-(--color-on-surface-variant) mb-0.5">Runway</p>
                <p className="text-body-lg font-semibold tabular-nums">{update.runway_months} months</p>
              </div>
            )}
          </section>
        )}

        {/* Highlights */}
        {highlights.length > 0 && (
          <section>
            <h2 className="text-label-md uppercase text-(--color-on-surface-variant) mb-3">Highlights</h2>
            <ul className="space-y-1.5">
              {highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-body-md">
                  <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-(--color-primary)" />
                  {h}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Body */}
        <section>
          <h2 className="text-label-md uppercase text-(--color-on-surface-variant) mb-3">Full Update</h2>
          <div className="text-body-md whitespace-pre-wrap leading-relaxed">
            {update.body}
          </div>
        </section>
      </article>

      {/* View log */}
      {update.status === "published" && views && views.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">Open history</h2>
          <div className="rounded-xl bg-(--color-surface-container-low) overflow-hidden">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="text-label-md uppercase text-(--color-on-surface-variant)">
                  <th className="px-4 py-3 text-start font-normal">Time</th>
                  <th className="px-4 py-3 text-start font-normal">Device</th>
                </tr>
              </thead>
              <tbody>
                {views.map((v, i) => (
                  <tr key={i} className="border-t border-(--color-outline-variant)/15">
                    <td className="px-4 py-3 tabular-nums text-(--color-on-surface-variant)">
                      {fmtDate(v.viewed_at)} · {new Date(v.viewed_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3 text-(--color-on-surface-variant)">{deviceLabel(v.user_agent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
