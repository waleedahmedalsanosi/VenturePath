import Link from "next/link";
import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";

import { ExploreGrid } from "./explore-grid";

export const metadata: Metadata = {
  title: "Explore startups — VenturePath",
  description:
    "Discover Sharia-compliant Saudi and MENA startups on VenturePath.",
  robots: { index: true, follow: true },
};

export default async function ExploreIndex() {
  const supabase = await createClient();
  const [{ data: profiles }, { data: openRounds }] = await Promise.all([
    supabase
      .from("workspaces")
      .select("id, slug, name, one_liner, sector, country, city, funding_stage, created_at")
      .eq("public_profile_published", true)
      .not("slug", "is", null)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("financing_rounds")
      .select("workspace_id")
      .eq("status", "open")
      .eq("is_public", true)
      .is("deleted_at", null),
  ]);

  const raisingIds = new Set((openRounds ?? []).map((r) => r.workspace_id));
  const rows = (profiles ?? [])
    .filter((w): w is typeof w & { slug: string } => w.slug !== null)
    .map((w) => ({ ...w, is_raising: raisingIds.has(w.id) }));

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-10">
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
          <p className="text-headline-sm font-medium">No published profiles yet</p>
          <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
            Be the first.{" "}
            <Link href="/sign-up" className="text-(--color-primary) underline">
              Create an account
            </Link>{" "}
            and publish your profile.
          </p>
        </div>
      ) : (
        <ExploreGrid workspaces={rows} />
      )}
    </main>
  );
}
