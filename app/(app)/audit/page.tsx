import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

import { AuditFilters } from "./filters";
import { DownloadCsvButton } from "./download-button";

const ENTITY_LABELS: Record<string, string> = {
  workspace: "Workspace",
  shareholder: "Shareholder",
  document: "Document",
  compliance_obligation: "Compliance",
};

const ENTITY_COLORS: Record<string, string> = {
  workspace: "bg-(--color-surface-bright) text-(--color-on-surface)",
  shareholder: "bg-(--color-primary)/15 text-(--color-primary)",
  document: "bg-(--color-chart-4)/20 text-(--color-chart-4)",
  compliance_obligation: "bg-(--color-warning)/15 text-(--color-warning)",
};

// TODO(batch-C+1): migrate to lib/date/format.ts → formatDate() with user prefs
// (date_format + timezone from user_profiles). See lib/date/format.ts for the migration path.
function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface PageProps {
  searchParams: Promise<{
    entity?: string;
    actor?: string;
    since?: string;
    until?: string;
  }>;
}

export default async function AuditPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/setup");

  // Build a filtered query.
  let q = supabase
    .from("audit_events")
    .select("*")
    .eq("workspace_id", workspace.id);

  if (params.entity && params.entity !== "all") {
    q = q.eq(
      "entity_type",
      params.entity as "workspace" | "shareholder" | "document" | "compliance_obligation",
    );
  }
  if (params.actor) {
    q = q.ilike("actor_email", `%${params.actor}%`);
  }
  if (params.since) {
    q = q.gte("created_at", `${params.since}T00:00:00Z`);
  }
  if (params.until) {
    q = q.lte("created_at", `${params.until}T23:59:59Z`);
  }

  const { data: events } = await q
    .order("created_at", { ascending: false })
    .limit(500);

  const rows = events ?? [];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-label-md uppercase text-(--color-on-surface-variant)">
            Audit trail
          </p>
          <h1 className="mt-1 text-display-sm font-semibold tracking-tight">
            {workspace.name}
          </h1>
          <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
            Append-only event log. Every state-changing action is recorded.
            Rows here cannot be modified or deleted.
          </p>
        </div>
        <DownloadCsvButton workspaceId={workspace.id} />
      </header>

      <AuditFilters />

      {rows.length === 0 ? (
        <div className="rounded-xl bg-(--color-surface-container-low) p-12 text-center">
          <p className="text-body-md text-(--color-on-surface-variant)">
            No events match your filter. Clear filters or take an action.
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-(--color-surface-container-low) overflow-hidden">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="text-label-md uppercase text-(--color-on-surface-variant)">
                <th className="px-4 py-3 text-start font-normal">When</th>
                <th className="px-4 py-3 text-start font-normal">Actor</th>
                <th className="px-4 py-3 text-start font-normal">Entity</th>
                <th className="px-4 py-3 text-start font-normal">Action</th>
                <th className="px-4 py-3 text-start font-normal">Description</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((event) => (
                <tr
                  key={event.id}
                  className="border-t border-(--color-outline-variant)/15 align-top"
                >
                  <td className="px-4 py-3 tabular-nums text-(--color-on-surface-variant) whitespace-nowrap">
                    {fmtDateTime(event.created_at)}
                  </td>
                  <td className="px-4 py-3 font-mono text-(--color-on-surface-variant) whitespace-nowrap">
                    {event.actor_email}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-label-sm font-medium uppercase tracking-wider ${ENTITY_COLORS[event.entity_type] ?? ""}`}
                    >
                      {ENTITY_LABELS[event.entity_type] ?? event.entity_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-(--color-on-surface-variant) whitespace-nowrap">
                    {event.action}
                  </td>
                  <td className="px-4 py-3">{event.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 500 && (
            <p className="px-4 py-3 text-body-sm text-(--color-on-surface-variant)">
              Showing 500 of N events — narrow your filter or export CSV for the full set.
            </p>
          )}
        </div>
      )}
    </main>
  );
}
