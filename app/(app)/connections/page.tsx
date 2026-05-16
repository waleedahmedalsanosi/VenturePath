import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

export const dynamic = "force-dynamic";

type Listing = {
  id: string;
  workspace_id: string;
  listing_type: "exit" | "partnership";
  status: "open" | "withdrawn";
  public_summary: string;
  type_data: {
    ask_type?: string;
    ask_amount_sar?: string;
    sector?: string;
    stage?: string;
    seeking_type?: string;
    commitment_type?: string;
  } | null;
  listed_at: string;
  workspaces: { name: string } | null;
};

type FilterType = "all" | "exit" | "partnership" | "mine";

function typeChip(type: "exit" | "partnership") {
  // Per DESIGN.md §3.6 Connections Hub Listing Type Identity:
  //   exit        → #C73E9D magenta (chart palette #4)
  //   partnership → #8A6FE8 lavender (chart palette #5)
  // 15% bg opacity, full text color. label-sm ALL CAPS 0.05em letter-spacing.
  const isExit = type === "exit";
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-label-sm font-medium uppercase tracking-[0.05em]"
      style={{
        backgroundColor: isExit ? "rgba(199, 62, 157, 0.15)" : "rgba(138, 111, 232, 0.15)",
        color: isExit ? "#C73E9D" : "#8A6FE8",
      }}
      aria-label={isExit ? "Exit listing" : "Partnership listing"}
    >
      {isExit ? "Exit" : "Partnership"}
    </span>
  );
}

function summarizeTypeData(l: Listing): string {
  if (l.listing_type === "exit") {
    const askMap: Record<string, string> = {
      active_sale: "Active sale",
      open_to_offers: "Open to offers",
      acqui_hire: "Acqui-hire",
      merger: "Merger",
    };
    const ask = l.type_data?.ask_type ? askMap[l.type_data.ask_type] : "Listed";
    const amt = l.type_data?.ask_amount_sar;
    return amt ? `${ask} · SAR ${amt}` : ask;
  }
  const seekMap: Record<string, string> = {
    co_founder: "Co-founder",
    advisor: "Advisor",
    senior_hire: "Senior hire",
    business_partner: "Business partner",
  };
  const seek = l.type_data?.seeking_type ? seekMap[l.type_data.seeking_type] : "Seeking";
  const commitMap: Record<string, string> = {
    full_time: "Full-time",
    part_time: "Part-time",
    advisory: "Advisory",
    flexible: "Flexible",
  };
  const commit = l.type_data?.commitment_type
    ? commitMap[l.type_data.commitment_type]
    : null;
  return commit ? `${seek} · ${commit}` : seek;
}

export default async function ConnectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter: filterRaw } = await searchParams;
  const filter: FilterType = ["all", "exit", "partnership", "mine"].includes(filterRaw ?? "")
    ? (filterRaw as FilterType)
    : "all";

  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/setup");

  const supabase = await createClient();

  let query = supabase
    .from("connection_listings")
    .select("id, workspace_id, listing_type, status, public_summary, type_data, listed_at, workspaces(name)")
    .eq("status", "open")
    .is("deleted_at", null)
    .order("listed_at", { ascending: false });

  if (filter === "exit") query = query.eq("listing_type", "exit");
  if (filter === "partnership") query = query.eq("listing_type", "partnership");
  if (filter === "mine") query = query.eq("workspace_id", workspace.id);

  const { data: rows } = await query;
  const listings = (rows ?? []) as unknown as Listing[];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      <header>
        <p className="text-label-md uppercase text-(--color-on-surface-variant)">Investment</p>
        <h1 className="mt-1 text-display-sm font-semibold tracking-tight">Connections</h1>
        <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
          Cross-workspace listings for whole-company exits and founder partnerships.
          VenturePath is a posted-ask board — contact is exchanged after both parties
          confirm. No fund movement on platform.
        </p>
      </header>

      <FilterChips active={filter} />

      <div className="flex items-center justify-between">
        <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
          {listings.length} {filter === "all" ? "open" : filter} listing
          {listings.length === 1 ? "" : "s"}
        </h2>
        <Link
          href="/connections/new"
          className="rounded-lg ghost-border px-4 py-2 text-label-sm hover:bg-(--color-surface-container-high)"
        >
          + New listing
        </Link>
      </div>

      {listings.length === 0 ? (
        filter === "mine" ? (
          <EmptyMine />
        ) : filter !== "all" ? (
          <EmptyFiltered />
        ) : (
          <EmptyColdStart />
        )
      ) : (
        <ul className="space-y-3">
          {listings.map((l) => (
            <li key={l.id}>
              <Link
                href={`/connections/${l.id}`}
                className="block rounded-xl ghost-border p-5 hover:bg-(--color-surface-container-high) transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="text-body-lg font-semibold truncate">
                      {l.workspaces?.name ?? "Unknown company"}
                    </p>
                    {typeChip(l.listing_type)}
                  </div>
                  <p className="text-body-md text-(--color-on-surface-variant) line-clamp-2">
                    {l.public_summary}
                  </p>
                  <div className="flex items-center gap-3 text-body-sm text-(--color-on-surface-variant)">
                    <span className="tabular-nums">{summarizeTypeData(l)}</span>
                    <span>·</span>
                    <span className="tabular-nums">
                      Listed {new Date(l.listed_at).toLocaleDateString()}
                    </span>
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

function FilterChips({ active }: { active: FilterType }) {
  const filters: { value: FilterType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "exit", label: "Exit" },
    { value: "partnership", label: "Partnership" },
    { value: "mine", label: "My listings" },
  ];
  return (
    <nav className="flex gap-2 flex-wrap" aria-label="Filter listings">
      {filters.map((f) => {
        const isActive = active === f.value;
        return (
          <Link
            key={f.value}
            href={f.value === "all" ? "/connections" : `/connections?filter=${f.value}`}
            className={`rounded-full px-3 py-1 text-label-sm transition-colors ${
              isActive
                ? "bg-(--color-primary) text-(--color-on-primary)"
                : "ghost-border hover:bg-(--color-surface-container-high)"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {f.label}
          </Link>
        );
      })}
    </nav>
  );
}

function EmptyColdStart() {
  return (
    <div className="rounded-xl ghost-border p-10 text-center space-y-4">
      <p className="text-body-lg font-semibold">The Connections Hub is brand new.</p>
      <p className="text-body-sm text-(--color-on-surface-variant) max-w-md mx-auto">
        Be the first to list. Listings are visible to all VenturePath members. No
        fund movement on platform — closing happens between you and the other party.
      </p>
      <div className="flex gap-3 justify-center pt-2">
        <Link
          href="/connections/new?type=exit"
          className="rounded-lg ghost-border px-4 py-2 text-label-sm hover:bg-(--color-surface-container-high)"
        >
          List for exit
        </Link>
        <Link
          href="/connections/new?type=partnership"
          className="rounded-lg bg-(--color-primary) text-(--color-on-primary) px-4 py-2 text-label-sm hover:opacity-90"
        >
          Find a partner
        </Link>
      </div>
    </div>
  );
}

function EmptyFiltered() {
  return (
    <div className="rounded-xl ghost-border p-10 text-center space-y-3">
      <p className="text-body-lg">No listings match your filters.</p>
      <Link href="/connections" className="text-body-sm underline">
        Clear filters
      </Link>
    </div>
  );
}

function EmptyMine() {
  return (
    <div className="rounded-xl ghost-border p-10 text-center space-y-3">
      <p className="text-body-lg">You haven&rsquo;t created a listing yet.</p>
      <Link
        href="/connections/new"
        className="inline-block rounded-lg bg-(--color-primary) text-(--color-on-primary) px-4 py-2 text-label-sm hover:opacity-90"
      >
        Create your first listing
      </Link>
    </div>
  );
}
