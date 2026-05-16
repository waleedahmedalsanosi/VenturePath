import { Dec } from "@/lib/cap-table/decimal";
import { formatSar } from "@/lib/marketplace/money";
import { createClient } from "@/lib/supabase/server";

import { MarketplacePulseTiles } from "./marketplace-pulse-client";

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
    <MarketplacePulseTiles
      openCount={open}
      soldCount={sold}
      listedValueLabel={totalListedValue.gt(0) ? formatSar(totalListedValue.toFixed(0)) : "—"}
    />
  );
}
