"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { markSoldOffPlatform, withdrawListing } from "../actions";

export function ListingActions({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"none" | "sold" | "withdraw">("none");
  const [reason, setReason] = useState("");

  function submit(action: "sold" | "withdraw") {
    setError(null);
    const fn = action === "sold" ? markSoldOffPlatform : withdrawListing;
    const data = new FormData();
    data.set("listing_id", listingId);
    data.set("reason", reason);
    startTransition(async () => {
      const result = await fn(data);
      if (!result.ok) {
        setError(result.error ?? "Failed.");
        return;
      }
      setMode("none");
      setReason("");
      router.refresh();
    });
  }

  if (mode === "none") {
    return (
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setMode("sold")}
          className="rounded-lg bg-(--color-primary) px-4 py-2 text-(--color-on-primary) text-label-sm hover:opacity-90"
        >
          Mark sold off-platform
        </button>
        <button
          type="button"
          onClick={() => setMode("withdraw")}
          className="rounded-lg ghost-border px-4 py-2 text-label-sm hover:bg-(--color-surface-container-high)"
        >
          Withdraw
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label htmlFor="reason" className="text-label-md block">
        {mode === "sold" ? "Closing context (optional)" : "Withdrawal reason (optional)"}
      </label>
      <textarea
        id="reason"
        rows={2}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full rounded-lg ghost-border bg-(--color-surface) px-3 py-2 text-body-sm"
        placeholder={
          mode === "sold"
            ? "e.g. closed with a co-shareholder via ROFR exercise"
            : "e.g. seller changed mind / no buyer interest"
        }
      />
      {error && <p className="text-body-sm text-(--color-error)">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => submit(mode)}
          disabled={pending}
          className="rounded-lg bg-(--color-primary) px-4 py-2 text-(--color-on-primary) text-label-sm hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : mode === "sold" ? "Confirm sold" : "Confirm withdraw"}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("none");
            setReason("");
            setError(null);
          }}
          className="rounded-lg ghost-border px-3 py-2 text-label-sm hover:bg-(--color-surface-container-high)"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
