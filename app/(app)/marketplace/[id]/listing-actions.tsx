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

  // Buyer fields for cap-table sync
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [salePriceSar, setSalePriceSar] = useState("");

  // Confirmation step: "filling" → user filling form; "confirming" → modal shown
  const [soldStep, setSoldStep] = useState<"filling" | "confirming">("filling");

  const hasBuyer = Boolean(buyerName.trim() && buyerEmail.trim());

  function resetSoldState() {
    setMode("none");
    setReason("");
    setBuyerName("");
    setBuyerEmail("");
    setSalePriceSar("");
    setSoldStep("filling");
    setError(null);
  }

  function submitWithdraw() {
    setError(null);
    const data = new FormData();
    data.set("listing_id", listingId);
    data.set("reason", reason);
    startTransition(async () => {
      const result = await withdrawListing(data);
      if (!result.ok) {
        setError(result.error ?? "Failed.");
        return;
      }
      setMode("none");
      setReason("");
      router.refresh();
    });
  }

  function submitSold() {
    setError(null);
    const data = new FormData();
    data.set("listing_id", listingId);
    data.set("reason", reason);
    if (hasBuyer) {
      data.set("buyer_name", buyerName.trim());
      data.set("buyer_email", buyerEmail.trim());
      if (salePriceSar.trim()) {
        data.set("sale_price_sar", salePriceSar.trim());
      }
    }
    startTransition(async () => {
      const result = await markSoldOffPlatform(data);
      if (!result.ok) {
        setError(result.error ?? "Failed.");
        setSoldStep("filling");
        return;
      }
      resetSoldState();
      router.refresh();
    });
  }

  // ── Idle state ───────────────────────────────────────────────────────────────
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

  // ── Withdraw form ────────────────────────────────────────────────────────────
  if (mode === "withdraw") {
    return (
      <div className="space-y-3">
        <label htmlFor="reason" className="text-label-md block">
          Withdrawal reason (optional)
        </label>
        <textarea
          id="reason"
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-lg ghost-border bg-(--color-surface) px-3 py-2 text-body-sm"
          placeholder="e.g. seller changed mind / no buyer interest"
        />
        {error && <p className="text-body-sm text-(--color-error)">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={submitWithdraw}
            disabled={pending}
            className="rounded-lg bg-(--color-primary) px-4 py-2 text-(--color-on-primary) text-label-sm hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Confirm withdraw"}
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

  // ── Sold form — filling step ─────────────────────────────────────────────────
  if (mode === "sold" && soldStep === "filling") {
    return (
      <div className="space-y-4">
        {/* Closing context (kept for backward compat) */}
        <div className="space-y-1">
          <label htmlFor="reason" className="text-label-md block">
            Closing context (optional)
          </label>
          <textarea
            id="reason"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg ghost-border bg-(--color-surface) px-3 py-2 text-body-sm"
            placeholder="e.g. closed with a co-shareholder via ROFR exercise"
          />
        </div>

        {/* Cap-table sync card */}
        <div className="rounded-xl bg-(--color-surface-container) p-4 space-y-3">
          <p className="text-label-sm text-(--color-on-surface-variant)">
            Buyer details — cap table sync
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="buyer_name" className="text-label-sm block">
                Buyer name
              </label>
              <input
                id="buyer_name"
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="e.g. Mohammed Al-Rashid"
                className="w-full rounded-lg ghost-border bg-(--color-surface) px-3 py-2 text-body-sm"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="buyer_email" className="text-label-sm block">
                Buyer email
              </label>
              <input
                id="buyer_email"
                type="email"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                placeholder="buyer@example.com"
                className="w-full rounded-lg ghost-border bg-(--color-surface) px-3 py-2 text-body-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="sale_price_sar" className="text-label-sm block">
              Sale price (SAR) — optional
            </label>
            <input
              id="sale_price_sar"
              type="number"
              min="0"
              step="any"
              value={salePriceSar}
              onChange={(e) => setSalePriceSar(e.target.value)}
              placeholder="Total sale price in SAR"
              className="w-full rounded-lg ghost-border bg-(--color-surface) px-3 py-2 text-body-sm"
            />
          </div>

          {hasBuyer ? (
            <p className="text-body-sm text-(--color-primary)">
              Providing buyer details will automatically update your cap table.
            </p>
          ) : (
            <p className="text-body-sm text-(--color-on-surface-variant)">
              Providing buyer details will automatically update your cap table.
            </p>
          )}
        </div>

        {error && <p className="text-body-sm text-(--color-error)">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              if (hasBuyer) {
                setSoldStep("confirming");
              } else {
                submitSold();
              }
            }}
            disabled={pending}
            className="rounded-lg bg-(--color-primary) px-4 py-2 text-(--color-on-primary) text-label-sm hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Confirm sold"}
          </button>
          <button
            type="button"
            onClick={resetSoldState}
            className="rounded-lg ghost-border px-3 py-2 text-label-sm hover:bg-(--color-surface-container-high)"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ── Sold form — confirmation step (only shown when buyer details provided) ───
  if (mode === "sold" && soldStep === "confirming") {
    return (
      <div className="rounded-xl bg-(--color-surface-container) p-5 space-y-4">
        <div className="space-y-1">
          <p className="text-title-sm">Confirm secondary sale</p>
          <p className="text-body-sm text-(--color-on-surface-variant)">
            This will update your cap table and cannot be undone.
          </p>
        </div>

        <div className="rounded-lg bg-(--color-surface) p-3 space-y-1 text-body-sm">
          <div className="flex justify-between">
            <span className="text-(--color-on-surface-variant)">Buyer name</span>
            <span>{buyerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-(--color-on-surface-variant)">Buyer email</span>
            <span>{buyerEmail}</span>
          </div>
          {salePriceSar && (
            <div className="flex justify-between">
              <span className="text-(--color-on-surface-variant)">Sale price (SAR)</span>
              <span>{salePriceSar}</span>
            </div>
          )}
        </div>

        {error && <p className="text-body-sm text-(--color-error)">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={submitSold}
            disabled={pending}
            className="rounded-lg bg-(--color-primary) px-4 py-2 text-(--color-on-primary) text-label-sm hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Recording…" : "Record sale"}
          </button>
          <button
            type="button"
            onClick={() => {
              setSoldStep("filling");
              setError(null);
            }}
            disabled={pending}
            className="rounded-lg ghost-border px-3 py-2 text-label-sm hover:bg-(--color-surface-container-high) disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return null;
}
