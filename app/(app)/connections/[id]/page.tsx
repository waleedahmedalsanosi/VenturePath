import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

import { InquiryActions, WithdrawButton } from "./inquiry-actions";
import { InquiryCta, type InquiryView } from "./inquiry-cta";

export const dynamic = "force-dynamic";

type Listing = {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  listing_type: "exit" | "partnership";
  status: "open" | "withdrawn";
  public_summary: string;
  type_data: Record<string, unknown> | null;
  notes: string | null;
  listed_at: string;
  closed_at: string | null;
  closed_reason: string | null;
  workspaces: { name: string } | null;
};

type ReceivedInquiry = {
  id: string;
  status: "sent" | "accepted" | "declined" | "closed";
  sent_at: string;
  responded_at: string | null;
  message: string | null;
  inquirer_workspace_id: string;
  workspaces: { name: string } | null;
};

function typeChip(type: "exit" | "partnership") {
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

function inquiryStatusChip(status: ReceivedInquiry["status"]) {
  const map = {
    sent: { label: "Pending", bg: "rgba(0, 101, 255, 0.15)", fg: "#0065FF" },
    accepted: { label: "Accepted", bg: "rgba(0, 135, 90, 0.15)", fg: "#00875A" },
    declined: { label: "Declined", bg: "rgba(222, 53, 11, 0.15)", fg: "#DE350B" },
    closed: { label: "Closed", bg: "rgba(74, 81, 104, 0.15)", fg: "#4A5168" },
  }[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-label-sm font-medium uppercase tracking-[0.05em]"
      style={{ backgroundColor: map.bg, color: map.fg }}
    >
      {map.label}
    </span>
  );
}

function renderTypeDetails(listing: Listing) {
  if (!listing.type_data) return null;
  const td = listing.type_data as Record<string, unknown>;

  if (listing.listing_type === "exit") {
    const askMap: Record<string, string> = {
      active_sale: "Active sale",
      open_to_offers: "Open to offers",
      acqui_hire: "Acqui-hire",
      merger: "Merger",
    };
    return (
      <dl className="grid grid-cols-2 gap-4 text-body-sm">
        {td.ask_type ? (
          <Cell label="Ask type" value={askMap[td.ask_type as string] ?? String(td.ask_type)} />
        ) : null}
        {td.ask_amount_sar ? (
          <Cell label="Ask amount" value={`SAR ${String(td.ask_amount_sar)}`} />
        ) : (
          <Cell label="Ask amount" value="Open to offers" />
        )}
        {td.sector ? <Cell label="Sector" value={String(td.sector)} /> : null}
        {td.stage ? <Cell label="Stage" value={String(td.stage)} /> : null}
      </dl>
    );
  }

  // partnership
  const seekMap: Record<string, string> = {
    co_founder: "Co-founder",
    advisor: "Advisor",
    senior_hire: "Senior hire",
    business_partner: "Business partner",
  };
  const commitMap: Record<string, string> = {
    full_time: "Full-time",
    part_time: "Part-time",
    advisory: "Advisory",
    flexible: "Flexible",
  };
  const skills = Array.isArray(td.skills) ? (td.skills as string[]) : [];
  return (
    <div className="space-y-4 text-body-sm">
      <dl className="grid grid-cols-2 gap-4">
        {td.seeking_type ? (
          <Cell
            label="Seeking"
            value={seekMap[td.seeking_type as string] ?? String(td.seeking_type)}
          />
        ) : null}
        {td.commitment_type ? (
          <Cell
            label="Commitment"
            value={commitMap[td.commitment_type as string] ?? String(td.commitment_type)}
          />
        ) : null}
      </dl>
      {skills.length > 0 && (
        <div>
          <p className="text-label-md uppercase text-(--color-on-surface-variant) mb-2">
            Skills
          </p>
          <div className="flex gap-2 flex-wrap">
            {skills.map((s) => (
              <span
                key={s}
                className="inline-flex rounded-full px-2 py-0.5 text-label-sm bg-(--color-surface-container-high)"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
      {td.equity_expectations ? (
        <div>
          <p className="text-label-md uppercase text-(--color-on-surface-variant) mb-1">
            Equity expectations
          </p>
          <p>{String(td.equity_expectations)}</p>
        </div>
      ) : null}
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-label-md uppercase text-(--color-on-surface-variant) mb-1">
        {label}
      </dt>
      <dd className="text-body-md">{value}</dd>
    </div>
  );
}

export default async function ConnectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/setup");

  const supabase = await createClient();

  const { data: listingRow } = await supabase
    .from("connection_listings")
    .select(
      "id, workspace_id, owner_user_id, listing_type, status, public_summary, type_data, notes, listed_at, closed_at, closed_reason, workspaces(name)",
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!listingRow) notFound();
  const listing = listingRow as unknown as Listing;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === listing.owner_user_id;

  // Non-owner: load own inquiry on this listing (if any).
  let myInquiry: InquiryView | null = null;
  if (!isOwner && user) {
    const { data: inq } = await supabase
      .from("connection_inquiries")
      .select(
        "id, status, sent_at, responded_at, closed_at, data_room_link_id",
      )
      .eq("listing_id", listing.id)
      .eq("inquirer_user_id", user.id)
      .is("deleted_at", null)
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (inq) {
      // If accepted, fetch the data room token + owner contact via the
      // SECURITY DEFINER helper (cross-workspace user can't read auth.users
      // directly).
      let token: string | null = null;
      let ownerEmail: string | null = null;
      if (inq.status === "accepted") {
        const { data: contacts } = await supabase.rpc(
          "get_connection_inquiry_emails",
          { p_inquiry_id: inq.id },
        );
        const contact = Array.isArray(contacts) ? contacts[0] : null;
        ownerEmail = contact?.owner_email ?? null;
        if (inq.data_room_link_id) {
          const { data: link } = await supabase
            .from("data_room_links")
            .select("token")
            .eq("id", inq.data_room_link_id)
            .maybeSingle();
          token = (link as { token?: string } | null)?.token ?? null;
        }
      }
      myInquiry = {
        id: inq.id,
        status: inq.status,
        sent_at: inq.sent_at,
        responded_at: inq.responded_at,
        closed_at: inq.closed_at,
        data_room_token: token,
        owner_email: ownerEmail,
        owner_name: null,
      };
    }
  }

  // Owner: load received inquiries.
  let receivedInquiries: ReceivedInquiry[] = [];
  if (isOwner) {
    const { data: rows } = await supabase
      .from("connection_inquiries")
      .select(
        "id, status, sent_at, responded_at, message, inquirer_workspace_id, workspaces!connection_inquiries_inquirer_workspace_id_fkey(name)",
      )
      .eq("listing_id", listing.id)
      .is("deleted_at", null)
      .order("sent_at", { ascending: false });
    receivedInquiries = (rows ?? []) as unknown as ReceivedInquiry[];
  }

  const companyName = listing.workspaces?.name ?? "Unknown company";
  const pendingCount = receivedInquiries.filter((r) => r.status === "sent").length;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 space-y-8">
      <Link
        href="/connections"
        className="text-body-sm text-(--color-on-surface-variant) hover:underline"
      >
        ← Back to Connections
      </Link>

      <header className="space-y-3">
        <p className="text-label-md uppercase text-(--color-on-surface-variant)">
          {listing.status === "withdrawn" ? "Withdrawn listing" : "Listing"}
        </p>
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="text-display-sm font-semibold tracking-tight">{companyName}</h1>
          {typeChip(listing.listing_type)}
        </div>
        <p className="text-body-md text-(--color-on-surface-variant)">
          Listed {new Date(listing.listed_at).toLocaleDateString()}
          {listing.closed_at &&
            ` · ${listing.status === "withdrawn" ? "Withdrawn" : "Closed"} ${new Date(listing.closed_at).toLocaleDateString()}`}
        </p>
      </header>

      <section className="rounded-xl ghost-border p-5 space-y-3">
        <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
          About
        </h2>
        <p className="text-body-md whitespace-pre-wrap">{listing.public_summary}</p>
      </section>

      <section className="rounded-xl ghost-border p-5 space-y-3">
        <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
          Details
        </h2>
        {renderTypeDetails(listing)}
      </section>

      {/* Non-owner: inquiry CTA / status panel */}
      {!isOwner && listing.status === "open" && (
        <InquiryCta
          listingId={listing.id}
          inquiry={myInquiry}
          ownerCompanyName={companyName}
        />
      )}

      {!isOwner && listing.status === "withdrawn" && (
        <section className="rounded-lg p-5 ghost-border space-y-2">
          <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
            Listing withdrawn
          </h2>
          <p className="text-body-sm text-(--color-on-surface-variant)">
            {companyName} has withdrawn this listing.
          </p>
        </section>
      )}

      {/* Owner: received inquiries (ROFR-row pattern adapted for inquiries) */}
      {isOwner && (
        <section className="rounded-xl ghost-border p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
              Received inquiries
            </h2>
            <div className="text-body-sm tabular-nums">
              <span>
                Pending: <strong>{pendingCount}</strong>
              </span>
              <span className="mx-2">·</span>
              <span>
                Total: <strong>{receivedInquiries.length}</strong>
              </span>
            </div>
          </div>

          {receivedInquiries.length === 0 ? (
            <p className="text-body-sm text-(--color-on-surface-variant)">
              No inquiries yet. You will receive an email when someone is interested.
            </p>
          ) : (
            <ul className="divide-y divide-(--color-outline-variant)">
              {receivedInquiries.map((r) => (
                <li key={r.id} className="py-3 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="text-body-md font-medium">
                        {r.workspaces?.name ?? "Unknown"}
                      </p>
                      <p className="text-body-sm text-(--color-on-surface-variant) tabular-nums">
                        Sent {new Date(r.sent_at).toLocaleDateString()}
                      </p>
                    </div>
                    {inquiryStatusChip(r.status)}
                  </div>
                  {r.message && (
                    <p className="text-body-sm text-(--color-on-surface-variant) italic">
                      &ldquo;{r.message}&rdquo;
                    </p>
                  )}
                  {r.status === "sent" && <InquiryActions inquiryId={r.id} />}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Owner: manage listing */}
      {isOwner && listing.status === "open" && (
        <section className="rounded-xl ghost-border p-5 space-y-3">
          <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
            Manage listing
          </h2>
          <p className="text-body-sm text-(--color-on-surface-variant)">
            Withdrawing closes the listing for new inquiries. Existing accepted
            inquiries remain valid for their data-room TTL.
          </p>
          <WithdrawButton listingId={listing.id} />
        </section>
      )}

      {/* Owner-only: private notes */}
      {isOwner && listing.notes && (
        <section className="rounded-xl bg-(--color-surface-container-high) p-5 space-y-2">
          <p className="text-label-md uppercase text-(--color-on-surface-variant)">
            Private notes
          </p>
          <p className="text-body-sm whitespace-pre-wrap">{listing.notes}</p>
        </section>
      )}

      {/* Trailing context — matches share marketplace pattern */}
      <section className="rounded-xl bg-(--color-surface-container-high) p-5 space-y-2">
        <p className="text-label-md font-semibold">How this works</p>
        <p className="text-body-sm text-(--color-on-surface-variant)">
          VenturePath is a posted-ask board for connections. When the owner accepts an
          inquiry, both parties exchange contact details and the inquirer gets a
          time-limited data room token. Closing happens between the two parties,
          off-platform.
        </p>
      </section>
    </main>
  );
}
