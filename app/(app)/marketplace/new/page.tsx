import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

import { NewListingForm } from "./form";

export const dynamic = "force-dynamic";

type Shareholder = {
  id: string;
  name: string;
  shares: string;
  pricePerShare: string;
};

export default async function NewListingPage({
  searchParams,
}: {
  searchParams: Promise<{ shareholder?: string }>;
}) {
  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/setup");

  const supabase = await createClient();
  const { data: holders } = await supabase
    .from("shareholders")
    .select("id, name, instrument_data, instrument_type")
    .eq("workspace_id", workspace.id)
    .eq("instrument_type", "ordinary")
    .is("deleted_at", null)
    .order("name");

  const eligible: Shareholder[] = (holders ?? [])
    .map((h) => {
      const data = h.instrument_data as { shares?: string; price_per_share_sar?: string } | null;
      return {
        id: h.id,
        name: h.name,
        shares: data?.shares ?? "0",
        pricePerShare: data?.price_per_share_sar ?? "0",
      };
    })
    .filter((h) => Number(h.shares) > 0);

  const { shareholder: preselected } = await searchParams;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 space-y-8">
      <header>
        <p className="text-label-md uppercase text-(--color-on-surface-variant)">Marketplace</p>
        <h1 className="mt-1 text-display-sm font-semibold tracking-tight">New listing</h1>
        <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
          Post an ask price for vested ordinary shares. Existing shareholders
          receive a 14-day ROFR (right of first refusal) notification. After the
          window, the listing proceeds to off-platform closing.
        </p>
      </header>

      {eligible.length === 0 ? (
        <div className="rounded-xl ghost-border p-10 text-center space-y-3">
          <p className="text-body-lg">No ordinary-share holders found.</p>
          <p className="text-body-sm text-(--color-on-surface-variant)">
            Only holders of converted ordinary shares can list. Convert iSAFE
            holdings via the round-close flow first.
          </p>
        </div>
      ) : (
        <NewListingForm shareholders={eligible} preselectedId={preselected ?? null} />
      )}
    </main>
  );
}
