import Link from "next/link";
import { redirect } from "next/navigation";

import {
  CATEGORY_LABELS,
  RECURRENCE_LABELS,
  STATUS_LABELS,
  computeStatus,
  type ComplianceStatus,
} from "@/lib/compliance/status";
import { createClient } from "@/lib/supabase/server";

import { ObligationActions } from "./obligation-actions";

const STATUS_CLASS: Record<ComplianceStatus, string> = {
  complete: "bg-(--color-success)/20 text-(--color-success)",
  overdue: "bg-(--color-error)/20 text-(--color-error)",
  due_soon: "bg-(--color-warning)/20 text-(--color-warning)",
  upcoming: "bg-(--color-surface-bright) text-(--color-on-surface-variant)",
};

function fmtDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function CompliancePage() {
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

  const { data: obligations } = await supabase
    .from("compliance_obligations")
    .select("*")
    .eq("workspace_id", workspace.id)
    .is("deleted_at", null)
    .order("due_date", { ascending: true });

  const rows = obligations ?? [];

  // Compute status for each row once, then sort overdue to top and reuse.
  const now = new Date();
  const enriched = rows
    .map((row) => ({ row, status: computeStatus(row, now) }))
    .sort((a, b) => {
      // Overdue first, then due_soon, then upcoming, then complete.
      const order: Record<ComplianceStatus, number> = {
        overdue: 0,
        due_soon: 1,
        upcoming: 2,
        complete: 3,
      };
      const diff = order[a.status] - order[b.status];
      if (diff !== 0) return diff;
      return a.row.due_date.localeCompare(b.row.due_date);
    });

  const counts = {
    overdue: enriched.filter((e) => e.status === "overdue").length,
    due_soon: enriched.filter((e) => e.status === "due_soon").length,
    on_track: enriched.filter((e) => e.status === "upcoming" || e.status === "complete").length,
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-10">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-label-md uppercase text-(--color-on-surface-variant)">
            Compliance timeline
          </p>
          <h1 className="mt-1 text-display-sm font-semibold tracking-tight">
            {workspace.name}
          </h1>
          <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
            ZATCA filings, commercial registrations, regulatory submissions. Mark
            complete after filing externally — recurring obligations
            automatically schedule the next occurrence.
          </p>
        </div>
        <Link
          href="/compliance/add"
          className={
            rows.length === 0
              ? "btn-primary-gradient rounded-lg px-5 py-2 text-label-lg font-medium"
              : "rounded-lg ghost-border px-5 py-2 text-label-lg hover:bg-(--color-surface-container-high)"
          }
        >
          + Add obligation
        </Link>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiTile
          label="Overdue"
          value={counts.overdue}
          accent="text-(--color-error)"
        />
        <KpiTile
          label="Due in 30 days"
          value={counts.due_soon}
          accent="text-(--color-warning)"
        />
        <KpiTile
          label="On track"
          value={counts.on_track}
          accent="text-(--color-success)"
        />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl bg-(--color-surface-container-low) p-12 text-center">
          <p className="text-body-md text-(--color-on-surface-variant)">
            No obligations tracked yet. Add ZATCA Annual Filing, Commercial
            Registration renewal, GAZT filings — whatever your jurisdiction
            requires.
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-(--color-surface-container-low) overflow-hidden">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="text-label-md uppercase text-(--color-on-surface-variant)">
                <th className="px-4 py-3 text-start font-normal">Obligation</th>
                <th className="px-4 py-3 text-start font-normal">Body</th>
                <th className="px-4 py-3 text-start font-normal">Category</th>
                <th className="px-4 py-3 text-start font-normal">Due</th>
                <th className="px-4 py-3 text-start font-normal">Status</th>
                <th className="px-4 py-3 text-end font-normal" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {enriched.map(({ row, status }) => (
                <tr
                  key={row.id}
                  className="border-t border-(--color-outline-variant)/15"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{row.name}</div>
                    {row.recurrence !== "one_time" && (
                      <div className="text-body-sm text-(--color-on-surface-variant)">
                        {RECURRENCE_LABELS[row.recurrence]} recurring
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-(--color-on-surface-variant)">
                    {row.official_url ? (
                      <a
                        href={row.official_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-(--color-primary)"
                      >
                        {row.regulatory_body} ↗
                      </a>
                    ) : (
                      row.regulatory_body
                    )}
                  </td>
                  <td className="px-4 py-3 text-(--color-on-surface-variant)">
                    {CATEGORY_LABELS[row.category]}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-(--color-on-surface-variant)">
                    {fmtDate(row.due_date)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-label-sm font-medium uppercase tracking-wider ${STATUS_CLASS[status]}`}
                    >
                      {STATUS_LABELS[status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ObligationActions
                      id={row.id}
                      status={status}
                      name={row.name}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function KpiTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-md bg-(--color-surface-container-high) p-4">
      <p className="text-label-md uppercase text-(--color-on-surface-variant)">
        {label}
      </p>
      <p className={`mt-2 text-display-sm font-semibold tracking-tight tabular-nums ${accent}`}>
        {value}
      </p>
    </div>
  );
}
