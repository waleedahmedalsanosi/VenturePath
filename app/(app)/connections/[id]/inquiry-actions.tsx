"use client";

import { useState, useTransition } from "react";

import {
  acceptConnectionInquiry,
  declineConnectionInquiry,
} from "../actions";

export function InquiryActions({ inquiryId }: { inquiryId: string }) {
  const [pending, startTransition] = useTransition();
  const [showDecline, setShowDecline] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  function handleAccept() {
    setError(null);
    setWarning(null);
    const fd = new FormData();
    fd.set("inquiry_id", inquiryId);
    fd.set("access_tier", "standard");
    fd.set("token_ttl_days", "14");
    startTransition(async () => {
      const res = await acceptConnectionInquiry(fd);
      if (!res.ok) {
        setError(res.error ?? "Failed to accept.");
        return;
      }
      if (res.emailWarning) setWarning(res.emailWarning);
    });
  }

  function handleDecline() {
    setError(null);
    setWarning(null);
    const fd = new FormData();
    fd.set("inquiry_id", inquiryId);
    fd.set("reason", declineReason);
    startTransition(async () => {
      const res = await declineConnectionInquiry(fd);
      if (!res.ok) {
        setError(res.error ?? "Failed to decline.");
        return;
      }
      if (res.emailWarning) setWarning(res.emailWarning);
      setShowDecline(false);
    });
  }

  if (showDecline) {
    return (
      <div className="space-y-2">
        <input
          type="text"
          value={declineReason}
          onChange={(e) => setDeclineReason(e.target.value)}
          placeholder="Reason (optional)"
          maxLength={200}
          className="w-full rounded-lg bg-(--color-surface-container-high) px-3 py-2 ghost-border text-body-sm focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
        />
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => setShowDecline(false)}
            className="rounded-lg ghost-border px-3 py-1 text-label-sm min-h-[44px] hover:bg-(--color-surface-container-high)"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDecline}
            disabled={pending}
            className="rounded-lg bg-(--color-error) text-white px-3 py-1 text-label-sm min-h-[44px] hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Declining…" : "Confirm decline"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleAccept}
          disabled={pending}
          className="rounded-lg bg-(--color-primary) text-(--color-on-primary) px-3 py-1 text-label-sm min-h-[44px] hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Accepting…" : "Accept"}
        </button>
        <button
          type="button"
          onClick={() => setShowDecline(true)}
          className="rounded-lg ghost-border px-3 py-1 text-label-sm min-h-[44px] hover:bg-(--color-surface-container-high)"
        >
          Decline
        </button>
      </div>
      {error && (
        <p role="alert" className="text-body-sm text-(--color-error)">
          {error}
        </p>
      )}
      {warning && (
        <p className="text-body-sm text-(--color-on-surface-variant)">
          Note: {warning}
        </p>
      )}
    </div>
  );
}

export function WithdrawButton({ listingId }: { listingId: string }) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleWithdraw() {
    setError(null);
    const fd = new FormData();
    fd.set("listing_id", listingId);
    fd.set("reason", reason);
    startTransition(async () => {
      const { withdrawConnectionListing } = await import("../actions");
      const res = await withdrawConnectionListing(fd);
      if (!res.ok) {
        setError(res.error ?? "Failed to withdraw.");
      }
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-lg ghost-border px-4 py-2 text-label-sm min-h-[44px] hover:bg-(--color-surface-container-high)"
      >
        Withdraw listing
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason (optional)"
        maxLength={200}
        className="w-full rounded-lg bg-(--color-surface-container-high) px-3 py-2 ghost-border text-body-sm focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
      />
      {error && (
        <p role="alert" className="text-body-sm text-(--color-error)">
          {error}
        </p>
      )}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-lg ghost-border px-3 py-1 text-label-sm min-h-[44px] hover:bg-(--color-surface-container-high)"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleWithdraw}
          disabled={pending}
          className="rounded-lg bg-(--color-error) text-white px-3 py-1 text-label-sm min-h-[44px] hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Withdrawing…" : "Confirm withdraw"}
        </button>
      </div>
    </div>
  );
}
