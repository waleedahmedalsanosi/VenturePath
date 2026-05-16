"use client";

import Link from "next/link";

import { useT } from "@/lib/i18n/useT";

import { InquiryActions, WithdrawButton } from "./inquiry-actions";
import { InquiryCta, type InquiryView } from "./inquiry-cta";

export type DetailListing = {
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

export type ReceivedInquiry = {
  id: string;
  status: "sent" | "accepted" | "declined" | "closed";
  sent_at: string;
  responded_at: string | null;
  message: string | null;
  inquirer_workspace_id: string;
  workspaces: { name: string } | null;
};

function TypeChip({ type, label }: { type: "exit" | "partnership"; label: string }) {
  const isExit = type === "exit";
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-label-sm font-medium uppercase tracking-[0.05em]"
      style={{
        backgroundColor: isExit ? "rgba(199, 62, 157, 0.15)" : "rgba(138, 111, 232, 0.15)",
        color: isExit ? "#C73E9D" : "#8A6FE8",
      }}
      aria-label={label}
    >
      {label}
    </span>
  );
}

function InquiryStatusChip({ status }: { status: ReceivedInquiry["status"] }) {
  const t = useT("connections");
  const map = {
    sent: { label: t("inquiry.status.sent.chip"), bg: "rgba(0, 101, 255, 0.15)", fg: "#0065FF" },
    accepted: { label: t("inquiry.status.accepted.chip"), bg: "rgba(0, 135, 90, 0.15)", fg: "#00875A" },
    declined: { label: t("inquiry.status.declined.chip"), bg: "rgba(222, 53, 11, 0.15)", fg: "#DE350B" },
    closed: { label: t("inquiry.status.closed.chip"), bg: "rgba(74, 81, 104, 0.15)", fg: "#4A5168" },
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

function renderTypeDetails(listing: DetailListing, t: (k: string, o?: Record<string, unknown>) => string) {
  if (!listing.type_data) return null;
  const td = listing.type_data;

  if (listing.listing_type === "exit") {
    return (
      <dl className="grid grid-cols-2 gap-4 text-body-sm">
        {td.ask_type ? (
          <Cell
            label={t("type_data.label.ask_type")}
            value={t(`type_data.ask_type_map.${td.ask_type}`)}
          />
        ) : null}
        {td.ask_amount_sar ? (
          <Cell label={t("type_data.label.ask_amount")} value={`SAR ${String(td.ask_amount_sar)}`} />
        ) : (
          <Cell label={t("type_data.label.ask_amount")} value={t("type_data.ask_type_map.open_to_offers")} />
        )}
        {td.sector ? <Cell label={t("type_data.label.ask_type")} value={String(td.sector)} /> : null}
        {td.stage ? <Cell label={t("type_data.label.ask_amount")} value={String(td.stage)} /> : null}
      </dl>
    );
  }

  const skills = Array.isArray(td.skills) ? (td.skills as string[]) : [];
  return (
    <div className="space-y-4 text-body-sm">
      <dl className="grid grid-cols-2 gap-4">
        {td.seeking_type ? (
          <Cell
            label={t("type_data.label.seeking")}
            value={t(`type_data.seeking_map.${td.seeking_type}`)}
          />
        ) : null}
        {td.commitment_type ? (
          <Cell
            label={t("type_data.label.commitment")}
            value={t(`type_data.commitment_map.${td.commitment_type}`)}
          />
        ) : null}
      </dl>
      {skills.length > 0 && (
        <div>
          <p className="text-label-md uppercase text-(--color-on-surface-variant) mb-2">
            {t("type_data.label.skills")}
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
            {t("type_data.label.equity_expectations")}
          </p>
          <p>{String(td.equity_expectations)}</p>
        </div>
      ) : null}
    </div>
  );
}

export function ConnectionDetailView({
  listing,
  isOwner,
  myInquiry,
  receivedInquiries,
}: {
  listing: DetailListing;
  isOwner: boolean;
  myInquiry: InquiryView | null;
  receivedInquiries: ReceivedInquiry[];
}) {
  const t = useT("connections");
  const companyName = listing.workspaces?.name ?? t("card.unknown_company");
  const pendingCount = receivedInquiries.filter((r) => r.status === "sent").length;
  const typeLabel = listing.listing_type === "exit" ? t("type.exit") : t("type.partnership");

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 space-y-8">
      <Link
        href="/connections"
        className="text-body-sm text-(--color-on-surface-variant) hover:underline"
      >
        {t("back_to")}
      </Link>

      <header className="space-y-3">
        <p className="text-label-md uppercase text-(--color-on-surface-variant)">
          {listing.status === "withdrawn"
            ? t("detail.eyebrow.withdrawn")
            : t("detail.eyebrow.listing")}
        </p>
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="text-display-sm font-semibold tracking-tight">{companyName}</h1>
          <TypeChip type={listing.listing_type} label={typeLabel} />
        </div>
        <p className="text-body-md text-(--color-on-surface-variant)">
          {t("detail.listed_on", { date: new Date(listing.listed_at).toLocaleDateString() })}
          {listing.closed_at &&
            ` · ${listing.status === "withdrawn" ? t("detail.withdrawn_on", { date: new Date(listing.closed_at).toLocaleDateString() }) : ""}`}
        </p>
      </header>

      <section className="rounded-xl ghost-border p-5 space-y-3">
        <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
          {t("detail.about")}
        </h2>
        <p className="text-body-md whitespace-pre-wrap">{listing.public_summary}</p>
      </section>

      <section className="rounded-xl ghost-border p-5 space-y-3">
        <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
          {t("detail.details")}
        </h2>
        {renderTypeDetails(listing, t)}
      </section>

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
            {t("detail.listing_withdrawn.title")}
          </h2>
          <p className="text-body-sm text-(--color-on-surface-variant)">
            {t("detail.listing_withdrawn.body", { company: companyName })}
          </p>
        </section>
      )}

      {isOwner && (
        <section className="rounded-xl ghost-border p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
              {t("detail.received_inquiries")}
            </h2>
            <div className="text-body-sm tabular-nums">
              <span>{t("inquiry.received.pending_count", { count: pendingCount })}</span>
              <span className="mx-2">·</span>
              <span>{t("inquiry.received.total_count", { count: receivedInquiries.length })}</span>
            </div>
          </div>

          {receivedInquiries.length === 0 ? (
            <p className="text-body-sm text-(--color-on-surface-variant)">
              {t("inquiry.received.empty")}
            </p>
          ) : (
            <ul className="divide-y divide-(--color-outline-variant)">
              {receivedInquiries.map((r) => (
                <li key={r.id} className="py-3 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="text-body-md font-medium">
                        {r.workspaces?.name ?? t("inquiry.received.unknown_inquirer")}
                      </p>
                      <p className="text-body-sm text-(--color-on-surface-variant) tabular-nums">
                        {t("inquiry.received.sent_on", { date: new Date(r.sent_at).toLocaleDateString() })}
                      </p>
                    </div>
                    <InquiryStatusChip status={r.status} />
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

      {isOwner && listing.status === "open" && (
        <section className="rounded-xl ghost-border p-5 space-y-3">
          <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
            {t("detail.manage_listing")}
          </h2>
          <p className="text-body-sm text-(--color-on-surface-variant)">
            {t("detail.manage_body")}
          </p>
          <WithdrawButton listingId={listing.id} />
        </section>
      )}

      {isOwner && listing.notes && (
        <section className="rounded-xl bg-(--color-surface-container-high) p-5 space-y-2">
          <p className="text-label-md uppercase text-(--color-on-surface-variant)">
            {t("detail.private_notes")}
          </p>
          <p className="text-body-sm whitespace-pre-wrap">{listing.notes}</p>
        </section>
      )}

      <section className="rounded-xl bg-(--color-surface-container-high) p-5 space-y-2">
        <p className="text-label-md font-semibold">{t("detail.how_it_works.title")}</p>
        <p className="text-body-sm text-(--color-on-surface-variant)">
          {t("detail.how_it_works.body")}
        </p>
      </section>
    </main>
  );
}
