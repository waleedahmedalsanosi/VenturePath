import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

/**
 * Connections Hub dashboard tile. Single-query aggregation per eng-review D9:
 *   - open listings owned by this workspace
 *   - inquiries received this week (across all the workspace's listings)
 *
 * Renders null when both counts are 0 (per design — no clutter on cold dashboards).
 */
export async function ConnectionsPulse({ workspaceId }: { workspaceId: string }) {
  const supabase = await createClient();

  // Open listings owned by this workspace.
  const { data: openListings } = await supabase
    .from("connection_listings")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("status", "open")
    .is("deleted_at", null);
  const openCount = (openListings ?? []).length;
  const listingIds = (openListings ?? []).map((l) => l.id);

  // Inquiries on the workspace's listings in the last 7 days.
  let newInquiries = 0;
  if (listingIds.length > 0) {
    // eslint-disable-next-line react-hooks/purity -- server component, runs once per request
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: inquiries } = await supabase
      .from("connection_inquiries")
      .select("id")
      .in("listing_id", listingIds)
      .gte("sent_at", sevenDaysAgo)
      .is("deleted_at", null);
    newInquiries = (inquiries ?? []).length;
  }

  if (openCount === 0 && newInquiries === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="text-label-md uppercase text-(--color-on-surface-variant) mb-3">
        Connections pulse
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <Tile
          label="Open listings"
          value={String(openCount)}
          href="/connections?filter=mine"
        />
        <Tile
          label="New inquiries"
          value={String(newInquiries)}
          href="/connections?filter=mine"
          sub="past 7 days"
        />
      </div>
    </section>
  );
}

function Tile({
  label,
  value,
  href,
  sub,
}: {
  label: string;
  value: string;
  href: string;
  sub?: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl bg-(--color-surface-container-low) px-4 py-4 hover:bg-(--color-surface-container-high) transition-colors block"
    >
      <p className="text-label-md uppercase text-(--color-on-surface-variant)">{label}</p>
      <p className="mt-1 text-display-sm font-semibold tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-body-sm text-(--color-on-surface-variant)">{sub}</p>}
    </Link>
  );
}
