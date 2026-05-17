import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { formatSar, formatShares, pricePerShare } from "@/lib/marketplace/money";
import { getActiveWorkspace } from "@/lib/workspace/active";

import { ListingActions } from "./listing-actions";
import { ListingVisibilityToggle } from "./visibility-toggle";
import { RofrRowActions } from "./rofr-row-actions";

export const dynamic = "force-dynamic";

type Notif = {
  id: string;
  notified_shareholder_id: string;
  window_expires_at: string;
  response: "exercise" | "decline" | null;
  responded_at: string | null;
  email_sent_at: string | null;
  shareholders: { name: string; email: string | null } | null;
};

function effectiveStatus(n: Notif): "exercise" | "decline" | "no_response" | "pending" {
  if (n.response) return n.response;
  return new Date(n.window_expires_at) < new Date() ? "no_response" : "pending";
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/setup");

  const supabase = await createClient();

  const { data: listing } = await supabase
    .from("share_listings")
    .select(
      "id, workspace_id, shareholder_id, seller_user_id, shares_offered, ask_price_sar, notes, status, is_public, listed_at, expires_at, closed_at, closed_reason, shareholders(name)",
    )
    .eq("id", id)
    .eq("workspace_id", workspace.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!listing) notFound();

  const sellerName = (listing.shareholders as { name: string } | null)?.name ?? "Unknown";

  const { data: notifs } = await supabase
    .from("rofr_notifications")
    .select(
      "id, notified_shareholder_id, window_expires_at, response, responded_at, email_sent_at, shareholders(name, email)",
    )
    .eq("listing_id", id)
    .order("created_at");

  const rofrRows = (notifs ?? []) as unknown as Notif[];

  // ROFR lock: latest unresponded window still open → disable visibility toggle.
  const pendingRofr = rofrRows
    .filter((r) => r.response === null && new Date(r.window_expires_at) > new Date())
    .sort((a, b) => new Date(b.window_expires_at).getTime() - new Date(a.window_expires_at).getTime());
  const rofrLockedUntil = pendingRofr[0]?.window_expires_at ?? null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isSeller = user?.id === listing.seller_user_id;
  const isOwner = user?.id === workspace.owner_user_id;

  const counts = {
    exercise: rofrRows.filter((r) => effectiveStatus(r) === "exercise").length,
    decline: rofrRows.filter((r) => effectiveStatus(r) === "decline").length,
    no_response: rofrRows.filter((r) => effectiveStatus(r) === "no_response").length,
    pending: rofrRows.filter((r) => effectiveStatus(r) === "pending").length,
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-10 space-y-8">
      <Link href="/marketplace" className="text-body-sm text-(--color-on-surface-variant) hover:underline">
        ← Back to marketplace
      </Link>

      <header className="space-y-3">
        <p className="text-label-md uppercase text-(--color-on-surface-variant)">Listing</p>
        <h1 className="text-display-sm font-semibold tracking-tight">{sellerName}</h1>
        <div className="flex items-baseline gap-4">
          <p className="text-display-md font-semibold tabular-nums">
            {formatSar(String(listing.ask_price_sar))}
          </p>
          <p className="text-body-md text-(--color-on-surface-variant) tabular-nums">
            {formatShares(String(listing.shares_offered))} shares · SAR{" "}
            {pricePerShare(String(listing.ask_price_sar), String(listing.shares_offered))}/sh
          </p>
        </div>
        <p className="text-body-sm text-(--color-on-surface-variant)">
          Status: <strong>{listing.status.replace(/_/g, " ")}</strong> · Listed{" "}
          {new Date(listing.listed_at).toLocaleDateString()}
          {listing.expires_at && ` · Expires ${new Date(listing.expires_at).toLocaleDateString()}`}
        </p>
      </header>

      {listing.notes && (
        <section className="rounded-xl ghost-border p-5">
          <p className="text-label-md uppercase text-(--color-on-surface-variant) mb-2">Notes</p>
          <p className="text-body-md whitespace-pre-wrap">{listing.notes}</p>
        </section>
      )}

      <section className="rounded-xl ghost-border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
            ROFR — Right of First Refusal
          </h2>
          <div className="flex gap-3 text-body-sm tabular-nums">
            <span>Exercise: <strong>{counts.exercise}</strong></span>
            <span>Decline: <strong>{counts.decline}</strong></span>
            <span>No response: <strong>{counts.no_response}</strong></span>
            <span>Pending: <strong>{counts.pending}</strong></span>
          </div>
        </div>

        {rofrRows.length === 0 ? (
          <p className="text-body-sm text-(--color-on-surface-variant)">
            No other ordinary-share holders to notify.
          </p>
        ) : (
          <table className="w-full text-body-sm">
            <thead className="text-label-sm uppercase text-(--color-on-surface-variant)">
              <tr className="text-left">
                <th className="py-2">Shareholder</th>
                <th className="py-2">Window expires</th>
                <th className="py-2">Status</th>
                <th className="py-2">Email sent</th>
                {isOwner && <th className="py-2">Action</th>}
              </tr>
            </thead>
            <tbody>
              {rofrRows.map((r) => {
                const status = effectiveStatus(r);
                return (
                  <tr key={r.id} className="border-t border-(--color-outline-variant)">
                    <td className="py-2">{r.shareholders?.name ?? "—"}</td>
                    <td className="py-2 tabular-nums">
                      {new Date(r.window_expires_at).toLocaleDateString()}
                    </td>
                    <td className="py-2">
                      <span className="rounded-full px-2 py-0.5 text-label-sm bg-(--color-surface-container-high)">
                        {status === "no_response" ? "no response (window expired)" : status}
                      </span>
                    </td>
                    <td className="py-2 text-(--color-on-surface-variant)">
                      {r.email_sent_at ? new Date(r.email_sent_at).toLocaleDateString() : "—"}
                    </td>
                    {isOwner && (
                      <td className="py-2">
                        {status === "pending" && (
                          <RofrRowActions notificationId={r.id} />
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {(isSeller || isOwner) && listing.status === "open" && (
        <ListingVisibilityToggle
          listingId={listing.id}
          isPublic={(listing as unknown as { is_public: boolean }).is_public ?? false}
          rofrLockedUntil={rofrLockedUntil}
        />
      )}

      {isSeller && listing.status === "open" && (
        <section className="rounded-xl ghost-border p-5 space-y-3">
          <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
            Manage listing
          </h2>
          <p className="text-body-sm text-(--color-on-surface-variant)">
            Once you&rsquo;ve closed off-platform, mark this listing sold so the
            kill-criteria analytics reflect the outcome. If the deal fell
            through, withdraw the listing.
          </p>
          <ListingActions listingId={listing.id} />
        </section>
      )}

      <section className="rounded-xl bg-(--color-surface-container-high) p-5 space-y-2">
        <p className="text-label-md font-semibold">How closing works</p>
        <p className="text-body-sm text-(--color-on-surface-variant)">
          VenturePath is a posted-ask bulletin board. Closing happens off-platform:
          buyer and seller engage lawyers, draft an SPA, capture board consent,
          and update the registry. VenturePath does not handle funds, custody,
          or settlement. Capital-gains tax treatment (ZATCA) is the seller&rsquo;s
          responsibility.
        </p>
      </section>
    </main>
  );
}
