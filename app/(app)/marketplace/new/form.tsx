"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { formatSar, formatShares } from "@/lib/marketplace/money";

import { createListing } from "../actions";

type Shareholder = {
  id: string;
  name: string;
  shares: string;
  pricePerShare: string;
};

export function NewListingForm({
  shareholders,
  preselectedId,
}: {
  shareholders: Shareholder[];
  preselectedId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string>(
    preselectedId && shareholders.some((s) => s.id === preselectedId)
      ? preselectedId
      : (shareholders[0]?.id ?? ""),
  );
  const [error, setError] = useState<string | null>(null);

  const selected = shareholders.find((s) => s.id === selectedId);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createListing(formData);
      if (!result.ok) {
        setError(result.error ?? "Failed to create listing.");
        return;
      }
      if (result.listingId) {
        router.push(`/marketplace/${result.listingId}`);
      } else {
        router.push("/marketplace");
      }
      router.refresh();
    });
  }

  return (
    <form action={onSubmit} className="space-y-6 rounded-xl ghost-border p-6">
      <div className="space-y-2">
        <label htmlFor="shareholder_id" className="text-label-md">
          Shareholder
        </label>
        <select
          id="shareholder_id"
          name="shareholder_id"
          required
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full rounded-lg ghost-border bg-(--color-surface) px-3 py-2 text-body-md"
        >
          {shareholders.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {formatShares(s.shares)} shares held
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="shares_offered" className="text-label-md">
            Shares to list
          </label>
          <input
            id="shares_offered"
            name="shares_offered"
            type="number"
            min="1"
            max={selected?.shares ?? undefined}
            step="1"
            required
            className="w-full rounded-lg ghost-border bg-(--color-surface) px-3 py-2 text-body-md tabular-nums"
          />
          {selected && (
            <p className="text-body-sm text-(--color-on-surface-variant)">
              Up to {formatShares(selected.shares)} shares available
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="ask_price_sar" className="text-label-md">
            Total ask price (SAR)
          </label>
          <input
            id="ask_price_sar"
            name="ask_price_sar"
            type="number"
            min="1"
            step="0.01"
            required
            className="w-full rounded-lg ghost-border bg-(--color-surface) px-3 py-2 text-body-md tabular-nums"
          />
          {selected && selected.pricePerShare !== "0" && (
            <p className="text-body-sm text-(--color-on-surface-variant)">
              Last priced round: {formatSar(selected.pricePerShare)}/sh
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="expires_at" className="text-label-md">
          Listing expires (optional)
        </label>
        <input
          id="expires_at"
          name="expires_at"
          type="date"
          className="w-full rounded-lg ghost-border bg-(--color-surface) px-3 py-2 text-body-md"
        />
        <p className="text-body-sm text-(--color-on-surface-variant)">
          Leave blank for no expiry. After expiry the listing closes automatically.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="notes" className="text-label-md">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="w-full rounded-lg ghost-border bg-(--color-surface) px-3 py-2 text-body-md"
          placeholder="Context for ROFR-holders and prospective buyers — vesting status, lockup, sale reason"
        />
      </div>

      <div className="rounded-lg bg-(--color-surface-container-high) p-4 space-y-2">
        <p className="text-label-md font-semibold">Before you list</p>
        <ul className="text-body-sm text-(--color-on-surface-variant) space-y-1 list-disc list-inside">
          <li>You confirm the shares are vested and free of transfer restrictions.</li>
          <li>Every other ordinary-share holder gets a 14-day ROFR notification.</li>
          <li>Closing happens off-platform — lawyer-drafted SPA, board consent, registry update. VenturePath does not handle funds.</li>
          <li>
            <strong>ZATCA notice:</strong> capital-gains tax treatment for individual sellers in KSA is your responsibility — consult a tax advisor before signing.
          </li>
        </ul>
      </div>

      {error && (
        <p className="text-body-sm text-(--color-error)">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-(--color-primary) px-5 py-2 text-(--color-on-primary) text-label-md hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Listing…" : "Create listing"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg ghost-border px-4 py-2 text-label-sm hover:bg-(--color-surface-container-high)"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
