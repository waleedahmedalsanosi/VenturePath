"use client";

import { useState, useTransition } from "react";

import { closeConnectionInquiry, sendConnectionInquiry } from "../actions";

type InquiryStatus = "sent" | "accepted" | "declined" | "closed";

export interface InquiryView {
  id: string;
  status: InquiryStatus;
  sent_at: string;
  responded_at: string | null;
  closed_at: string | null;
  data_room_token: string | null;
  owner_email: string | null;
  owner_name: string | null;
}

export function InquiryCta({
  listingId,
  inquiry,
  ownerCompanyName,
}: {
  listingId: string;
  inquiry: InquiryView | null;
  ownerCompanyName: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSend() {
    setError(null);
    setWarning(null);
    const fd = new FormData();
    fd.set("listing_id", listingId);
    fd.set("message", message);
    startTransition(async () => {
      const res = await sendConnectionInquiry(fd);
      if (!res.ok) {
        setError(res.error ?? "Failed to send inquiry.");
        return;
      }
      if (res.emailWarning) setWarning(res.emailWarning);
      setShowForm(false);
    });
  }

  function handleClose() {
    if (!inquiry) return;
    const fd = new FormData();
    fd.set("inquiry_id", inquiry.id);
    fd.set("reason", "Closed by inquirer");
    startTransition(async () => {
      await closeConnectionInquiry(fd);
    });
  }

  // ── State: no inquiry yet — show CTA ─────────────────────────────────────
  if (!inquiry) {
    if (showForm) {
      return (
        <section className="rounded-lg p-5 ghost-border space-y-3">
          <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
            Send inquiry
          </h2>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Optional: why you&rsquo;re interested (max 500 chars)"
            className="w-full rounded-lg bg-(--color-surface-container-high) px-3 py-2 ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
          />
          {error && (
            <p role="alert" className="text-body-sm text-(--color-error)">
              {error}
            </p>
          )}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg ghost-border px-4 py-2 text-label-sm hover:bg-(--color-surface-container-high)"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={pending}
              className="rounded-lg bg-(--color-primary) text-(--color-on-primary) px-4 py-2 text-label-sm hover:opacity-90 disabled:opacity-50 min-h-[44px]"
            >
              {pending ? "Sending…" : "Send inquiry"}
            </button>
          </div>
        </section>
      );
    }
    return (
      <section className="rounded-lg p-5 ghost-border space-y-3">
        <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
          Interested?
        </h2>
        <p className="text-body-sm text-(--color-on-surface-variant)">
          Send an inquiry. {ownerCompanyName} can accept (revealing contact details
          and granting data room access) or decline.
        </p>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-(--color-primary) text-(--color-on-primary) px-4 py-2 text-label-sm hover:opacity-90 min-h-[44px]"
        >
          I&rsquo;m interested
        </button>
        {warning && (
          <p className="text-body-sm text-(--color-on-surface-variant)">
            Note: {warning}
          </p>
        )}
      </section>
    );
  }

  // ── State: glass-card status panel per inquiry state (per DESIGN.md §8) ──
  return (
    <GlassStatusPanel
      inquiry={inquiry}
      ownerCompanyName={ownerCompanyName}
      onClose={inquiry.status === "accepted" ? handleClose : undefined}
      pending={pending}
    />
  );
}

function GlassStatusPanel({
  inquiry,
  ownerCompanyName,
  onClose,
  pending,
}: {
  inquiry: InquiryView;
  ownerCompanyName: string;
  onClose?: () => void;
  pending: boolean;
}) {
  // Per DESIGN.md §8 Glass-card Status Panel:
  //   bg surface_container_high @ 40%
  //   backdrop-blur 24px
  //   border-radius lg
  const baseClass =
    "rounded-lg p-5 space-y-3 backdrop-blur-[24px] bg-(--color-surface-container-high)/40";

  const chip = (label: string, color: "info" | "success" | "error" | "neutral") => {
    const styles = {
      info: { bg: "rgba(0, 101, 255, 0.15)", fg: "#0065FF" },
      success: { bg: "rgba(0, 135, 90, 0.15)", fg: "#00875A" },
      error: { bg: "rgba(222, 53, 11, 0.15)", fg: "#DE350B" },
      neutral: { bg: "rgba(74, 81, 104, 0.15)", fg: "#4A5168" },
    }[color];
    return (
      <span
        className="inline-flex items-center rounded-full px-2 py-0.5 text-label-sm font-medium uppercase tracking-[0.05em]"
        style={{ backgroundColor: styles.bg, color: styles.fg }}
      >
        {label}
      </span>
    );
  };

  if (inquiry.status === "sent") {
    return (
      <section className={baseClass} aria-label="Inquiry pending">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
            Your inquiry
          </h2>
          {chip("Pending", "info")}
        </div>
        <p className="text-body-md">
          Sent {relativeTime(inquiry.sent_at)}. You&rsquo;ll be notified when{" "}
          {ownerCompanyName} responds.
        </p>
      </section>
    );
  }

  if (inquiry.status === "accepted") {
    return (
      <section className={baseClass} aria-label="Inquiry accepted">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
            Inquiry accepted
          </h2>
          {chip("Accepted", "success")}
        </div>
        <div className="rounded-lg bg-(--color-surface-container-low) p-4 space-y-1">
          <p className="text-label-md uppercase text-(--color-on-surface-variant)">
            Contact
          </p>
          <p className="text-body-lg font-semibold">
            {inquiry.owner_name ?? ownerCompanyName}
          </p>
          {inquiry.owner_email && (
            <p className="text-body-md">
              <a
                href={`mailto:${inquiry.owner_email}`}
                className="text-(--color-primary) hover:underline"
              >
                {inquiry.owner_email}
              </a>
            </p>
          )}
        </div>
        {inquiry.data_room_token && (
          <a
            href={`/data-room/${inquiry.data_room_token}`}
            className="inline-block rounded-lg bg-(--color-primary) text-(--color-on-primary) px-4 py-2 text-label-sm hover:opacity-90 min-h-[44px]"
          >
            Open data room →
          </a>
        )}
        {onClose && (
          <div className="pt-2 border-t border-(--color-outline-variant)">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="text-body-sm text-(--color-on-surface-variant) hover:underline disabled:opacity-50"
            >
              Mark conversation complete
            </button>
          </div>
        )}
      </section>
    );
  }

  if (inquiry.status === "declined") {
    return (
      <section className={baseClass} aria-label="Inquiry declined">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
            Inquiry update
          </h2>
          {chip("Declined", "error")}
        </div>
        <p className="text-body-md text-(--color-on-surface-variant)">
          {ownerCompanyName} is not pursuing this at the moment.
        </p>
      </section>
    );
  }

  // closed
  return (
    <section className={baseClass} aria-label="Inquiry closed">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
          Inquiry closed
        </h2>
        {chip("Closed", "neutral")}
      </div>
      <p className="text-body-md text-(--color-on-surface-variant)">
        Closed on{" "}
        {inquiry.closed_at
          ? new Date(inquiry.closed_at).toLocaleDateString()
          : "an earlier date"}
        .
      </p>
    </section>
  );
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
