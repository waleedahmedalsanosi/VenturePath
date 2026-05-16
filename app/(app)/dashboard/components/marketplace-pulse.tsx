import Link from "next/link";

import { Dec } from "@/lib/cap-table/decimal";
import { formatSar } from "@/lib/marketplace/money";
import { createClient } from "@/lib/supabase/server";

/**
 * Kill-criteria analytics tile. Per eng review T8 and the design doc's
 * Success Criteria: month-0 ≥3 listings within 2 weeks, ≥1 sold within
 * 6 weeks. This tile surfaces the raw signal — listings live, sold, and
 * total-listed-value — so the founder can see the kill-criteria gauge
 * without leaving the dashboard.
 */
export async function MarketplacePulse({ workspaceId }: { workspaceId: string }) {
  const supabase = await createClient();
  const { data: listings } = await supabase
    .from("share_listings")
    .select("status, ask_price_sar, listed_at")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null);

  const rows = listings ?? [];
  const open = rows.filter((r) => r.status === "open").length;
  const sold = rows.filter((r) => r.status === "sold_off_platform").length;

  let totalListedValue = new Dec(0);
  for (const r of rows) {
    if (r.status === "open") totalListedValue = totalListedValue.plus(new Dec(String(r.ask_price_sar)));
  }

  if (rows.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="text-label-md uppercase text-(--color-on-surface-variant) mb-3">
        Marketplace pulse
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Tile label="Open listings" value={String(open)} href="/marketplace" />
        <Tile
          label="Listed value"
          value={totalListedValue.gt(0) ? formatSar(totalListedValue.toFixed(0)) : "—"}
          href="/marketplace"
          sub="open lots, aggregate"
        />
        <Tile
          label="Sold off-platform"
          value={String(sold)}
          href="/marketplace"
          sub="closed via SPA"
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
