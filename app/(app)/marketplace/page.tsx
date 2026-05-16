import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { formatSar, formatShares, pricePerShare } from "@/lib/marketplace/money";
import { getActiveWorkspace } from "@/lib/workspace/active";

export const dynamic = "force-dynamic";

type ListingRow = {
  id: string;
  shareholder_id: string;
  shares_offered: number | string;
  ask_price_sar: number | string;
  notes: string | null;
  status: "open" | "withdrawn" | "sold_off_platform";
  listed_at: string;
  expires_at: string | null;
  closed_at: string | null;
  shareholders: { name: string } | null;
};

function statusChip(status: ListingRow["status"]) {
  const map: Record<ListingRow["status"], { label: string; className: string }> = {
    open: {
      label: "Open",
      className: "bg-(--color-success-container) text-(--color-on-success-container)",
    },
    withdrawn: {
      label: "Withdrawn",
      className: "bg-(--color-surface-container-high) text-(--color-on-surface-variant)",
    },
    sold_off_platform: {
      label: "Sold off-platform",
      className: "bg-(--color-tertiary-container) text-(--color-on-tertiary-container)",
    },
  };
  const c = map[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-label-sm ${c.className}`}
    >
      {c.label}
    </span>
  );
}

export default async function MarketplacePage() {
  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/setup");

  const supabase = await createClient();
  const { data: listings } = await supabase
    .from("share_listings")
    .select(
      "id, shareholder_id, shares_offered, ask_price_sar, notes, status, listed_at, expires_at, closed_at, shareholders(name)",
    )
    .eq("workspace_id", workspace.id)
    .is("deleted_at", null)
    .order("listed_at", { ascending: false });

  const rows = (listings ?? []) as unknown as ListingRow[];
  const openCount = rows.filter((r) => r.status === "open").length;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      <header>
        <p className="text-label-md uppercase text-(--color-on-surface-variant)">Investment</p>
        <h1 className="mt-1 text-display-sm font-semibold tracking-tight">Marketplace</h1>
        <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
          Posted-ask secondary listings for existing shareholders. VenturePath is a
          bulletin board — closings happen off-platform via lawyer and board
          consent. No escrow, no fund movement on platform.
        </p>
      </header>

      <div className="flex items-center justify-between">
        <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
          {openCount} open · {rows.length} total
        </h2>
        <Link
          href="/marketplace/new"
          className="rounded-lg ghost-border px-4 py-2 text-label-sm hover:bg-(--color-surface-container-high)"
        >
          + New listing
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl ghost-border p-10 text-center space-y-3">
          <p className="text-body-lg">No listings yet.</p>
          <p className="text-body-sm text-(--color-on-surface-variant)">
            From the cap table, choose a shareholder row and click &ldquo;List for sale&rdquo; — or use the button above.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={`/marketplace/${row.id}`}
                className="block rounded-xl ghost-border p-5 hover:bg-(--color-surface-container-high) transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="text-body-lg font-semibold truncate">
                        {row.shareholders?.name ?? "Unknown shareholder"}
                      </p>
                      {statusChip(row.status)}
                    </div>
                    <p className="mt-1 text-body-sm text-(--color-on-surface-variant)">
                      Listed {new Date(row.listed_at).toLocaleDateString()}
                      {row.expires_at && ` · expires ${new Date(row.expires_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-body-lg font-semibold tabular-nums">
                      {formatSar(String(row.ask_price_sar))}
                    </p>
                    <p className="text-body-sm text-(--color-on-surface-variant) tabular-nums">
                      {formatShares(String(row.shares_offered))} shares · SAR{" "}
                      {pricePerShare(String(row.ask_price_sar), String(row.shares_offered))}/sh
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
