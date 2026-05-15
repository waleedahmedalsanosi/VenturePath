import Link from "next/link";
import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Explore startups — VenturePath",
  description:
    "Discover Sharia-compliant Saudi and MENA startups on VenturePath.",
  robots: { index: true, follow: true },
};

const CARDS_PER_PAGE = 24;

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export default async function ExploreIndex() {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("workspaces")
    .select("id, slug, name, one_liner, sector, country, funding_stage, created_at")
    .eq("public_profile_published", true)
    .not("slug", "is", null)
    .order("created_at", { ascending: false })
    .limit(CARDS_PER_PAGE);

  const rows = profiles ?? [];

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <header className="mb-12">
        <p className="text-label-md uppercase text-(--color-on-surface-variant)">
          Explore
        </p>
        <h1 className="mt-2 text-display-md font-semibold tracking-tight">
          KSA & MENA startups
        </h1>
        <p className="mt-3 text-body-md text-(--color-on-surface-variant) max-w-2xl">
          Published profiles from founders building on VenturePath. Sharia-compliant
          equity instruments, transparent traction, real companies.
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-xl bg-(--color-surface-container-low) p-16 text-center">
          <p className="text-headline-sm font-medium">
            No published profiles yet
          </p>
          <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
            Be the first.{" "}
            <Link href="/sign-up" className="text-(--color-primary) underline">
              Create an account
            </Link>{" "}
            and publish your profile.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((w) => (
            <Link
              key={w.id}
              href={`/explore/${w.slug}`}
              className="block rounded-xl bg-(--color-surface-container-low) p-6 hover:bg-(--color-surface-container-high) transition-colors"
            >
              <p className="text-label-md uppercase text-(--color-on-surface-variant)">
                {w.sector} · {w.country}
              </p>
              <h2 className="mt-2 text-headline-sm font-semibold tracking-tight">
                {w.name}
              </h2>
              <p className="mt-2 text-body-sm text-(--color-on-surface-variant) line-clamp-3">
                {w.one_liner}
              </p>
              <div className="mt-4 flex items-center gap-2 text-label-sm">
                <span className="inline-flex items-center rounded-full bg-(--color-surface-bright) px-2.5 py-0.5 uppercase tracking-wider">
                  {w.funding_stage}
                </span>
                <span className="ml-auto text-(--color-on-surface-variant) tabular-nums">
                  {fmtDate(w.created_at)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
