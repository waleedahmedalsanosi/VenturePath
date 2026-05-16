import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";

import {
  ExploreView,
  type ExitCard,
  type PartnershipCard,
  type SecondaryCard,
  type CompanyCard,
} from "./explore-view";

export const metadata: Metadata = {
  title: "Explore — VenturePath",
  description:
    "Discover KSA and MENA startups, exit listings, founder partnerships, and secondary share opportunities on VenturePath.",
  robots: { index: true, follow: true },
};

export const dynamic = "force-dynamic";

export default async function ExploreIndex() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isSignedIn = !!user;

  // Companies — public always.
  const { data: profiles } = await supabase
    .from("workspaces")
    .select("id, slug, name, one_liner, sector, country, city, funding_stage, created_at")
    .eq("public_profile_published", true)
    .not("slug", "is", null)
    .order("created_at", { ascending: false })
    .limit(24);

  const { data: openRounds } = await supabase
    .from("financing_rounds")
    .select("workspace_id")
    .eq("status", "open")
    .eq("is_public", true)
    .is("deleted_at", null);

  const raisingIds = new Set((openRounds ?? []).map((r) => r.workspace_id));
  const companies: CompanyCard[] = (profiles ?? [])
    .filter((w): w is typeof w & { slug: string } => w.slug !== null)
    .map((w) => ({
      id: w.id,
      slug: w.slug,
      name: w.name,
      one_liner: w.one_liner ?? "",
      sector: w.sector ?? "",
      country: w.country ?? "",
      city: w.city,
      funding_stage: w.funding_stage ?? "",
      created_at: w.created_at,
      is_raising: raisingIds.has(w.id),
    }));

  // Cross-workspace listings — visible to signed-in users (RLS enforces).
  let exits: ExitCard[] = [];
  let partnerships: PartnershipCard[] = [];
  let secondaries: SecondaryCard[] = [];

  if (isSignedIn) {
    const [{ data: exitRows }, { data: partnershipRows }, { data: secondaryRows }] =
      await Promise.all([
        supabase
          .from("connection_listings")
          .select("id, public_summary, type_data, listed_at, workspaces(name, slug)")
          .eq("status", "open")
          .eq("listing_type", "exit")
          .is("deleted_at", null)
          .order("listed_at", { ascending: false })
          .limit(6),
        supabase
          .from("connection_listings")
          .select("id, public_summary, type_data, listed_at, workspaces(name, slug)")
          .eq("status", "open")
          .eq("listing_type", "partnership")
          .is("deleted_at", null)
          .order("listed_at", { ascending: false })
          .limit(6),
        supabase
          .from("share_listings")
          .select(
            "id, shares_offered, ask_price_sar, listed_at, workspaces(name, slug), shareholders(name)",
          )
          .eq("status", "open")
          .eq("is_public", true)
          .is("deleted_at", null)
          .order("listed_at", { ascending: false })
          .limit(6),
      ]);

    exits = ((exitRows ?? []) as unknown as Array<{
      id: string;
      public_summary: string;
      type_data: Record<string, unknown> | null;
      listed_at: string;
      workspaces: { name: string; slug: string | null } | null;
    }>).map((r) => ({
      id: r.id,
      summary: r.public_summary,
      ask_type: (r.type_data?.ask_type as string | undefined) ?? null,
      ask_amount_sar: (r.type_data?.ask_amount_sar as string | undefined) ?? null,
      listed_at: r.listed_at,
      company_name: r.workspaces?.name ?? null,
      company_slug: r.workspaces?.slug ?? null,
    }));

    partnerships = ((partnershipRows ?? []) as unknown as Array<{
      id: string;
      public_summary: string;
      type_data: Record<string, unknown> | null;
      listed_at: string;
      workspaces: { name: string; slug: string | null } | null;
    }>).map((r) => ({
      id: r.id,
      summary: r.public_summary,
      seeking_type: (r.type_data?.seeking_type as string | undefined) ?? null,
      commitment_type: (r.type_data?.commitment_type as string | undefined) ?? null,
      listed_at: r.listed_at,
      company_name: r.workspaces?.name ?? null,
      company_slug: r.workspaces?.slug ?? null,
    }));

    secondaries = ((secondaryRows ?? []) as unknown as Array<{
      id: string;
      shares_offered: number | string;
      ask_price_sar: number | string;
      listed_at: string;
      workspaces: { name: string; slug: string | null } | null;
      shareholders: { name: string } | null;
    }>).map((r) => ({
      id: r.id,
      shares_offered: String(r.shares_offered),
      ask_price_sar: String(r.ask_price_sar),
      listed_at: r.listed_at,
      company_name: r.workspaces?.name ?? null,
      company_slug: r.workspaces?.slug ?? null,
      shareholder_name: r.shareholders?.name ?? null,
    }));
  }

  return (
    <ExploreView
      isSignedIn={isSignedIn}
      exits={exits}
      partnerships={partnerships}
      secondaries={secondaries}
      companies={companies}
    />
  );
}
