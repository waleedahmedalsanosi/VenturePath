import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

function fmtDate(s: string | null | undefined): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default async function InvestorUpdatesIndexPage() {
  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/setup");

  const supabase = await createClient();

  const { data: updates } = await supabase
    .from("investor_updates")
    .select("id, subject, status, sent_at, created_at, round_id")
    .eq("workspace_id", workspace.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // Fetch round names for display
  const roundIds = [...new Set((updates ?? []).map((u) => u.round_id))];
  const roundById: Record<string, { id: string; name: string }> = {};
  if (roundIds.length > 0) {
    const { data: rounds } = await supabase
      .from("financing_rounds")
      .select("id, name")
      .in("id", roundIds);
    for (const r of rounds ?? []) roundById[r.id] = r;
  }

  // Fetch view counts for published updates
  const publishedIds = (updates ?? [])
    .filter((u) => u.status === "published")
    .map((u) => u.id);

  const viewCountById: Record<string, number> = {};
  if (publishedIds.length > 0) {
    const { data: views } = await supabase
      .from("investor_update_views")
      .select("update_id")
      .in("update_id", publishedIds);
    for (const v of views ?? []) {
      viewCountById[v.update_id] = (viewCountById[v.update_id] ?? 0) + 1;
    }
  }

  const totalSent = (updates ?? []).filter((u) => u.status === "published").length;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-label-md uppercase text-(--color-on-surface-variant)">Investment</p>
          <h1 className="mt-1 text-display-sm font-semibold tracking-tight">Investor Updates</h1>
          <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
            Periodic updates sent to your investors across all rounds.
          </p>
        </div>
        {totalSent > 0 && (
          <span className="mt-2 rounded-full bg-(--color-success)/15 px-3 py-1 text-label-sm font-medium text-(--color-success) shrink-0">
            {totalSent} sent
          </span>
        )}
      </div>

      {(updates ?? []).length === 0 ? (
        <div className="rounded-xl bg-(--color-surface-container-low) px-6 py-12 text-center">
          <p className="text-body-md text-(--color-on-surface-variant)">
            No investor updates yet. Open a round and click <strong>Draft update</strong> to write your first one.
          </p>
          <Link
            href="/rounds"
            className="mt-4 inline-block rounded-lg bg-(--color-primary) px-5 py-2.5 text-label-sm font-medium text-white hover:opacity-90"
          >
            Go to Rounds
          </Link>
        </div>
      ) : (
        <div className="rounded-xl bg-(--color-surface-container-low) overflow-hidden">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="text-label-md uppercase text-(--color-on-surface-variant)">
                <th className="px-4 py-3 text-start font-normal">Subject</th>
                <th className="px-4 py-3 text-start font-normal">Round</th>
                <th className="px-4 py-3 text-start font-normal">Status</th>
                <th className="px-4 py-3 text-start font-normal">Sent</th>
                <th className="px-4 py-3 text-end font-normal">Opens</th>
              </tr>
            </thead>
            <tbody>
              {(updates ?? []).map((u) => {
                const round = roundById[u.round_id] ?? null;
                const views = viewCountById[u.id] ?? 0;
                return (
                  <tr key={u.id} className="border-t border-(--color-outline-variant)/15 align-middle">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/investor-updates/${u.id}`} className="hover:underline">
                        {u.subject}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-(--color-on-surface-variant)">
                      {round ? (
                        <Link href={`/rounds/${round.id}`} className="hover:underline">
                          {round.name}
                        </Link>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-label-sm font-medium uppercase tracking-wider ${
                        u.status === "published"
                          ? "bg-(--color-success)/15 text-(--color-success)"
                          : "bg-(--color-surface-bright) text-(--color-on-surface-variant)"
                      }`}>
                        {u.status === "published" ? "Sent" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-(--color-on-surface-variant) whitespace-nowrap">
                      {fmtDate(u.sent_at)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-(--color-on-surface-variant) text-end">
                      {views > 0 ? views : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
