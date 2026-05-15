import Link from "next/link";

interface UpdateRow {
  id: string;
  subject: string;
  status: string;
  sent_at: string | null;
  created_at: string;
  view_count: number;
}

function fmtDate(s: string | null): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_META: Record<string, { label: string; bg: string; fg: string }> = {
  draft:     { label: "Draft",     bg: "bg-(--color-surface-bright)", fg: "text-(--color-on-surface-variant)" },
  published: { label: "Sent",      bg: "bg-(--color-success)/15",     fg: "text-(--color-success)" },
};

export function InvestorUpdatesSection({
  roundId,
  updates,
  canEdit,
}: {
  roundId: string;
  updates: UpdateRow[];
  canEdit: boolean;
}) {
  const sentCount = updates.filter((u) => u.status === "published").length;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
            Investor Updates
          </h2>
          {sentCount > 0 && (
            <span className="rounded-full bg-(--color-success)/15 px-2 py-0.5 text-label-sm font-medium text-(--color-success)">
              {sentCount} sent
            </span>
          )}
        </div>
        {canEdit && (
          <Link
            href={`/rounds/${roundId}/updates/new`}
            className="rounded-lg ghost-border px-4 py-2 text-label-sm hover:bg-(--color-surface-container-high)"
          >
            + Draft update
          </Link>
        )}
      </div>

      {updates.length === 0 ? (
        <div className="rounded-xl bg-(--color-surface-container-low) px-6 py-8 text-center">
          <p className="text-body-md text-(--color-on-surface-variant)">
            No investor updates yet.
            {canEdit && (
              <> Click <strong>Draft update</strong> to write your first round update — MRR and runway auto-fill from your traction metrics.</>
            )}
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-(--color-surface-container-low) overflow-hidden">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="text-label-md uppercase text-(--color-on-surface-variant)">
                <th className="px-4 py-3 text-start font-normal">Subject</th>
                <th className="px-4 py-3 text-start font-normal">Status</th>
                <th className="px-4 py-3 text-start font-normal">Sent</th>
                <th className="px-4 py-3 text-end font-normal">Views</th>
              </tr>
            </thead>
            <tbody>
              {updates.map((u) => {
                const m = STATUS_META[u.status] ?? STATUS_META.draft;
                return (
                  <tr
                    key={u.id}
                    className="border-t border-(--color-outline-variant)/15 align-middle"
                  >
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={`/investor-updates/${u.id}`}
                        className="hover:underline"
                      >
                        {u.subject}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-label-sm font-medium uppercase tracking-wider ${m.bg} ${m.fg}`}>
                        {m.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-(--color-on-surface-variant) whitespace-nowrap">
                      {fmtDate(u.sent_at)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-(--color-on-surface-variant) text-end">
                      {u.view_count > 0 ? u.view_count : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
