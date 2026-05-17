"use client";

import { useState, useTransition } from "react";

import { useT } from "@/lib/i18n/useT";

import { sendConnectionInquiry } from "../actions";
import { type InquiryView } from "./inquiry-cta";

export function EquityGate({
  listingId,
  ownerCompanyName,
  inquiry,
}: {
  listingId: string;
  ownerCompanyName: string;
  inquiry: InquiryView | null;
}) {
  const t = useT("connections");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Inquiry already exists
  if (inquiry) {
    // Any status other than "sent" means it was declined/closed — show generic gate
    if (inquiry.status === "sent") {
      return (
        <div className="rounded-lg ghost-border p-4 space-y-2">
          <p className="text-label-md uppercase text-(--color-on-surface-variant)">
            {t("detail.equity.gated_title")}
          </p>
          <p className="text-body-sm text-(--color-on-surface-variant)">
            {t("detail.equity.gated_pending")}
          </p>
        </div>
      );
    }
    // For declined/closed, show as if no inquiry (allow re-request)
    if (inquiry.status !== "declined" && inquiry.status !== "closed") {
      // accepted — this branch should never be hit (canSeeEquityTerms would be true)
      return null;
    }
  }

  function handleRequest() {
    setError(null);
    const fd = new FormData();
    fd.set("listing_id", listingId);
    fd.set("message", "");
    startTransition(async () => {
      const res = await sendConnectionInquiry(fd);
      if (!res.ok) {
        setError(res.error ?? "Failed to send inquiry.");
      }
      // On success, revalidatePath in action will refresh the page and
      // canSeeEquityTerms / inquiry state will update server-side.
    });
  }

  return (
    <div className="rounded-lg ghost-border p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(138, 111, 232, 0.15)" }}
          aria-hidden
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
            style={{ color: "#8A6FE8" }}
          >
            <path
              d="M8 1a4 4 0 0 1 4 4v1h1a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h1V5a4 4 0 0 1 4-4zm0 8a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm0-6a2 2 0 0 0-2 2v1h4V5a2 2 0 0 0-2-2z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-label-md text-(--color-on-surface)">
            {t("detail.equity.gated_title")}
          </p>
          <p className="text-body-sm text-(--color-on-surface-variant) mt-0.5">
            {t("detail.equity.gated_body", { company: ownerCompanyName })}
          </p>
        </div>
      </div>
      {error && (
        <p role="alert" className="text-body-sm text-(--color-error)">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={handleRequest}
        disabled={pending}
        className="rounded-lg ghost-border px-4 py-2 text-label-sm hover:bg-(--color-surface-container-high) disabled:opacity-50 min-h-[44px]"
      >
        {pending ? "…" : t("detail.equity.gated_button")}
      </button>
    </div>
  );
}
