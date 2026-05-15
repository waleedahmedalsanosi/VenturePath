import { redirect } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { TEMPLATE_LABELS } from "@/lib/governance/templates";
import { getActiveWorkspace } from "@/lib/workspace/active";

import { MeetingActions } from "./meeting-actions";
import { ResolutionActions } from "./resolution-actions";

const MEETING_STATUS_STYLES: Record<string, string> = {
  upcoming: "bg-(--color-info)/15 text-(--color-info)",
  completed: "bg-(--color-success)/20 text-(--color-success)",
  cancelled: "bg-(--color-surface-bright) text-(--color-on-surface-variant)",
};

const RESOLUTION_STATUS_STYLES: Record<string, string> = {
  draft: "bg-(--color-surface-bright) text-(--color-on-surface-variant)",
  pending: "bg-(--color-warning)/20 text-(--color-warning)",
  passed: "bg-(--color-success)/20 text-(--color-success)",
  rejected: "bg-(--color-error)/15 text-(--color-error)",
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

export default async function GovernancePage() {
  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/setup");

  const supabase = await createClient();
  const { data: meetings } = await supabase
    .from("board_meetings")
    .select("*")
    .eq("workspace_id", workspace.id)
    .is("deleted_at", null)
    .order("meeting_at", { ascending: false });

  const { data: resolutions } = await supabase
    .from("resolutions")
    .select("*")
    .eq("workspace_id", workspace.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-10">
      <header>
        <p className="text-label-md uppercase text-(--color-on-surface-variant)">
          Governance
        </p>
        <h1 className="mt-1 text-display-sm font-semibold tracking-tight">
          {workspace.name}
        </h1>
        <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
          Schedule board meetings and record formal resolutions. Passed
          resolutions become a permanent governance record — they can be
          viewed afterwards but not edited.
        </p>
      </header>

      {/* Meetings */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
            Board meetings
          </h2>
          <Link
            href="/governance/meetings/new"
            className="rounded-lg ghost-border px-4 py-2 text-label-sm hover:bg-(--color-surface-container-high)"
          >
            + Schedule meeting
          </Link>
        </div>
        {(meetings ?? []).length === 0 ? (
          <div className="rounded-xl bg-(--color-surface-container-low) p-8 text-center">
            <p className="text-body-md text-(--color-on-surface-variant)">
              No meetings yet. Schedule one to start a governance trail.
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-(--color-surface-container-low) overflow-hidden">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="text-label-md uppercase text-(--color-on-surface-variant)">
                  <th className="px-4 py-3 text-start font-normal">Title</th>
                  <th className="px-4 py-3 text-start font-normal">When</th>
                  <th className="px-4 py-3 text-start font-normal">Format</th>
                  <th className="px-4 py-3 text-start font-normal">Status</th>
                  <th className="px-4 py-3 text-end font-normal" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {(meetings ?? []).map((m) => (
                  <tr key={m.id} className="border-t border-(--color-outline-variant)/15 align-top">
                    <td className="px-4 py-3">
                      <div className="font-medium">{m.title}</div>
                      {m.agenda && (
                        <div className="text-body-sm text-(--color-on-surface-variant) mt-1 line-clamp-2">
                          {m.agenda}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-(--color-on-surface-variant) whitespace-nowrap">
                      {fmtDateTime(m.meeting_at)}
                    </td>
                    <td className="px-4 py-3 text-(--color-on-surface-variant)">
                      {m.format === "virtual" ? "Virtual" : "In person"}
                      {m.location && (
                        <div className="text-body-sm">{m.location}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-label-sm font-medium uppercase tracking-wider ${MEETING_STATUS_STYLES[m.status]}`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <MeetingActions id={m.id} status={m.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Resolutions */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
            Resolutions
          </h2>
          <Link
            href="/governance/resolutions/new"
            className="rounded-lg ghost-border px-4 py-2 text-label-sm hover:bg-(--color-surface-container-high)"
          >
            + New resolution
          </Link>
        </div>
        {(resolutions ?? []).length === 0 ? (
          <div className="rounded-xl bg-(--color-surface-container-low) p-8 text-center">
            <p className="text-body-md text-(--color-on-surface-variant)">
              No resolutions yet. Draft one from a template (share issuance,
              ESOP grant, ROFR waiver, etc.) or from scratch.
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-(--color-surface-container-low) overflow-hidden">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="text-label-md uppercase text-(--color-on-surface-variant)">
                  <th className="px-4 py-3 text-start font-normal">Title</th>
                  <th className="px-4 py-3 text-start font-normal">Type</th>
                  <th className="px-4 py-3 text-start font-normal">Status</th>
                  <th className="px-4 py-3 text-start font-normal">Created</th>
                  <th className="px-4 py-3 text-end font-normal" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {(resolutions ?? []).map((r) => (
                  <tr key={r.id} className="border-t border-(--color-outline-variant)/15 align-top">
                    <td className="px-4 py-3">
                      <Link
                        href={`/governance/resolutions/${r.id}`}
                        className="font-medium hover:text-(--color-primary)"
                      >
                        {r.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-(--color-on-surface-variant)">
                      {TEMPLATE_LABELS[r.template]}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-label-sm font-medium uppercase tracking-wider ${RESOLUTION_STATUS_STYLES[r.status]}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-(--color-on-surface-variant) whitespace-nowrap">
                      {fmtDateTime(r.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <ResolutionActions id={r.id} status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
