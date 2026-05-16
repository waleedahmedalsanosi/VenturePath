import { redirect } from "next/navigation";

import { Dec } from "@/lib/cap-table/decimal";
import { vestedFraction } from "@/lib/esop/vesting";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

import { ConnectionsPulse } from "./components/connections-pulse";
import { DashboardView, type DashboardData } from "./dashboard-view";
import { MarketplacePulse } from "./components/marketplace-pulse";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/setup");

  const [
    { data: shareholders },
    { data: pool },
    { data: grants },
    { data: latestMetric },
    { data: complianceDue },
    { data: pendingResolutions },
    { data: recentAudit },
    { data: activeRound },
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
      // eslint-disable-next-line react-hooks/purity -- server component
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
    supabase
      .from("financing_rounds")
      .select("id, name, status, target_raise_sar")
      .eq("workspace_id", workspace.id)
      .eq("status", "open")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const activeRoundId = activeRound?.id ?? null;

  const [
    { data: pipelineContacts },
    { data: closingItemsPending },
    { data: latestUpdate },
  ] = await Promise.all([
    activeRoundId
      ? supabase
          .from("investor_pipeline")
          .select("id, is_hot, ticket_size_sar")
          .eq("round_id", activeRoundId)
          .is("deleted_at", null)
      : Promise.resolve({ data: [] }),
    activeRoundId
      ? supabase
          .from("closing_items")
          .select("id")
          .eq("round_id", activeRoundId)
          .in("status", ["pending", "in_progress"])
          .is("deleted_at", null)
      : Promise.resolve({ data: [] }),
    supabase
      .from("investor_updates")
      .select("id, subject, status")
      .eq("workspace_id", workspace.id)
      .eq("status", "published")
      .is("deleted_at", null)
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const hotLeads = (pipelineContacts ?? []).filter((c) => c.is_hot).length;
  let pipelineCommitted = new Dec(0);
  for (const c of pipelineContacts ?? []) {
    if (c.ticket_size_sar) pipelineCommitted = pipelineCommitted.plus(new Dec(String(c.ticket_size_sar)));
  }

  let latestUpdateViews = 0;
  if (latestUpdate) {
    const { count } = await supabase
      .from("investor_update_views")
      .select("id", { count: "exact", head: true })
      .eq("update_id", latestUpdate.id);
    latestUpdateViews = count ?? 0;
  }

  let poolPct: string = "—";
  if (pool) {
    let allocated = new Dec(0);
    for (const g of grants ?? []) {
      allocated = allocated.plus(new Dec(g.options_count));
    }
    poolPct = `${allocated.div(new Dec(pool.total_pool_shares)).mul(100).toFixed(1)}%`;
  }

  let totalVested = new Dec(0);
  for (const g of grants ?? []) {
    totalVested = totalVested.plus(new Dec(g.options_count).mul(vestedFraction(g)));
  }

  const data: DashboardData = {
    workspaceName: workspace.name,
    shareholdersCount: shareholders?.length ?? 0,
    hasPool: !!pool,
    poolPct,
    mrrSar: latestMetric?.mrr_sar != null ? Number(latestMetric.mrr_sar) : null,
    latestMetricMonth: latestMetric?.month ?? null,
    complianceDueCount: complianceDue?.length ?? 0,
    pendingResolutionsCount: pendingResolutions?.length ?? 0,
    totalVestedRounded: Number(totalVested.toFixed(0)).toLocaleString(),
    activeRound: activeRound
      ? {
          id: activeRound.id,
          name: activeRound.name,
          target_raise_sar: activeRound.target_raise_sar,
        }
      : null,
    hotLeads,
    pipelineCount: (pipelineContacts ?? []).length,
    pipelineCommittedSar: pipelineCommitted.gt(0) ? Number(pipelineCommitted.toFixed(0)) : null,
    closingItemsCount: (closingItemsPending ?? []).length,
    latestUpdate: latestUpdate
      ? { id: latestUpdate.id, subject: latestUpdate.subject }
      : null,
    latestUpdateViews,
    recentAudit: (recentAudit ?? []).map((e) => ({
      id: e.id,
      description: e.description,
      created_at: e.created_at,
      actor_email: e.actor_email,
    })),
    pulseSection: (
      <>
        <MarketplacePulse workspaceId={workspace.id} />
        <ConnectionsPulse workspaceId={workspace.id} />
      </>
    ),
  };

  return <DashboardView {...data} />;
}
