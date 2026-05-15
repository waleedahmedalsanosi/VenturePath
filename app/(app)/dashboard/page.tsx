import Link from "next/link";
import { redirect } from "next/navigation";

import { Dec } from "@/lib/cap-table/decimal";
import { vestedFraction } from "@/lib/esop/vesting";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

function fmtSAR(n: number | null): string {
  if (n === null) return "—";
  return `SAR ${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const NAV_SECTIONS = [
  { href: "/cap-table", label: "Cap Table", desc: "Shareholders & instruments" },
  { href: "/esop", label: "ESOP", desc: "Options pool & grants" },
  { href: "/governance", label: "Governance", desc: "Board meetings & resolutions" },
  { href: "/compliance", label: "Compliance", desc: "Deadlines & obligations" },
  { href: "/vault", label: "Document Vault", desc: "Secure file storage" },
  { href: "/traction", label: "Traction", desc: "MRR, customers & runway" },
  { href: "/waterfall", label: "Waterfall", desc: "Exit distribution model" },
  { href: "/acquisition", label: "M&A Modeler", desc: "Acquisition scenario analysis" },
  { href: "/valuation", label: "Valuation", desc: "4-method valuation tool" },
  { href: "/members", label: "Members", desc: "Team access & roles" },
  { href: "/audit", label: "Audit Trail", desc: "Full activity log" },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/setup");

  // Fetch all dashboard data concurrently.
  const [
    { data: shareholders },
    { data: pool },
    { data: grants },
    { data: latestMetric },
    { data: complianceDue },
    { data: pendingResolutions },
    { data: recentAudit },
  ] = await Promise.all([
    supabase
      .from("shareholders")
      .select("id")
      .eq("workspace_id", workspace.id)
      .is("deleted_at", null),
    supabase
      .from("esop_pools")
      .select("id, total_pool_shares")
      .eq("workspace_id", workspace.id)
      .maybeSingle(),
    supabase
      .from("esop_grants")
      .select("*")
      .eq("workspace_id", workspace.id)
      .is("deleted_at", null),
    supabase
      .from("traction_metrics")
      .select("month, mrr_sar")
      .eq("workspace_id", workspace.id)
      .is("deleted_at", null)
      .order("month", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("compliance_obligations")
      .select("id")
      .eq("workspace_id", workspace.id)
      .is("deleted_at", null)
      .is("completed_at", null)
      .lte("due_date", new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)),
    supabase
      .from("resolutions")
      .select("id")
      .eq("workspace_id", workspace.id)
      .eq("status", "pending")
      .is("deleted_at", null),
    supabase
      .from("audit_events")
      .select("id, action, description, created_at, actor_email")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  // Pool utilization.
  let poolPct: string = "—";
  if (pool) {
    let allocated = new Dec(0);
    for (const g of grants ?? []) {
      allocated = allocated.plus(new Dec(g.options_count));
    }
    poolPct = `${allocated.div(new Dec(pool.total_pool_shares)).mul(100).toFixed(1)}%`;
  }

  // Total vested options.
  let totalVested = new Dec(0);
  for (const g of grants ?? []) {
    totalVested = totalVested.plus(new Dec(g.options_count).mul(vestedFraction(g)));
  }

  const mrrValue = latestMetric?.mrr_sar != null ? Number(latestMetric.mrr_sar) : null;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-10">
      <header>
        <p className="text-label-md uppercase text-(--color-on-surface-variant)">Dashboard</p>
        <h1 className="mt-1 text-display-sm font-semibold tracking-tight">{workspace.name}</h1>
        <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
          Your company snapshot — equity, compliance, and momentum at a glance.
        </p>
      </header>

      {/* Stat tiles */}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Tile
          label="Shareholders"
          value={String(shareholders?.length ?? 0)}
          href="/cap-table"
        />
        <Tile
          label="Pool utilised"
          value={pool ? poolPct : "No pool"}
          href="/esop"
        />
        <Tile
          label="Latest MRR"
          value={fmtSAR(mrrValue)}
          href="/traction"
          sub={latestMetric?.month ?? undefined}
        />
        <Tile
          label="Compliance due"
          value={String(complianceDue?.length ?? 0)}
          href="/compliance"
          sub="in next 30 days"
          alert={(complianceDue?.length ?? 0) > 0}
        />
        <Tile
          label="Pending resolutions"
          value={String(pendingResolutions?.length ?? 0)}
          href="/governance"
          alert={(pendingResolutions?.length ?? 0) > 0}
        />
        <Tile
          label="Vested options"
          value={Number(totalVested.toFixed(0)).toLocaleString()}
          href="/esop"
        />
      </section>

      {/* Quick nav */}
      <section>
        <h2 className="text-label-md uppercase text-(--color-on-surface-variant) mb-4">
          Navigate
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {NAV_SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="rounded-md bg-(--color-surface-container-low) px-4 py-3 hover:bg-(--color-surface-container-high) transition-colors"
            >
              <p className="text-label-lg font-medium">{s.label}</p>
              <p className="text-body-sm text-(--color-on-surface-variant)">{s.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent activity */}
      {(recentAudit?.length ?? 0) > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
              Recent activity
            </h2>
            <Link
              href="/audit"
              className="text-body-sm text-(--color-on-surface-variant) underline"
            >
              View all
            </Link>
          </div>
          <div className="rounded-xl bg-(--color-surface-container-low) overflow-hidden">
            <table className="w-full text-body-sm">
              <tbody>
                {(recentAudit ?? []).map((evt) => (
                  <tr
                    key={evt.id}
                    className="border-t first:border-t-0 border-(--color-outline-variant)/15"
                  >
                    <td className="px-4 py-3 text-(--color-on-surface-variant) font-mono text-label-sm whitespace-nowrap">
                      {fmtDate(evt.created_at)}
                    </td>
                    <td className="px-4 py-3">{evt.description}</td>
                    <td className="px-4 py-3 text-end text-(--color-on-surface-variant)">
                      {evt.actor_email}
                    </td>
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

function Tile({
  label,
  value,
  href,
  sub,
  alert,
}: {
  label: string;
  value: string;
  href: string;
  sub?: string;
  alert?: boolean;
}) {
  return (
    <Link
      href={href}
      className="rounded-md bg-(--color-surface-container-high) p-4 hover:bg-(--color-surface-bright) transition-colors block"
    >
      <p className="text-label-md uppercase text-(--color-on-surface-variant)">{label}</p>
      <p
        className={`mt-2 text-display-sm font-semibold tracking-tight tabular-nums ${
          alert ? "text-(--color-warning)" : ""
        }`}
      >
        {value}
      </p>
      {sub && (
        <p className="mt-1 text-body-sm text-(--color-on-surface-variant)">{sub}</p>
      )}
    </Link>
  );
}
