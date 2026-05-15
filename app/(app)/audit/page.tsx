import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

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

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AuditPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name")
    .eq("owner_user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!workspace) redirect("/setup");

  const { data: events } = await supabase
    .from("audit_events")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = events ?? [];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-10">
      <header>
        <p className="text-label-md uppercase text-(--color-on-surface-variant)">
          Audit trail
        </p>
        <h1 className="mt-1 text-display-sm font-semibold tracking-tight">
          {workspace.name}
        </h1>
        <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
          Append-only event log. Every state-changing action is recorded —
          shareholders, documents, compliance obligations, workspace edits.
          Rows here cannot be modified or deleted, even by you.
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-xl bg-(--color-surface-container-low) p-12 text-center">
          <p className="text-body-md text-(--color-on-surface-variant)">
            No audit events yet. Add a shareholder, upload a document, or
            schedule a compliance obligation to start populating the trail.
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
          {rows.length === 200 && (
            <p className="px-4 py-3 text-body-sm text-(--color-on-surface-variant)">
              Showing most recent 200 events. Older events still exist —
              pagination is a future addition.
            </p>
          )}
        </div>
      )}
    </main>
  );
}
