"use client";

import { useTransition, useState } from "react";
import Link from "next/link";

import { publishInvestorUpdate, deleteInvestorUpdate } from "../../rounds/[id]/update-actions";

export function UpdateActions({
  updateId,
  roundId,
  status,
  publicUrl,
}: {
  updateId: string;
  roundId: string;
  status: string;
  publicUrl: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  function onPublish() {
    if (!confirm("Publish this update? The public link will become active.")) return;
    startTransition(async () => {
      await publishInvestorUpdate(updateId);
    });
  }

  function onDelete() {
    if (!confirm("Delete this update? This cannot be undone via the UI.")) return;
    startTransition(async () => {
      await deleteInvestorUpdate(updateId, roundId);
    });
  }

  function copyLink() {
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {status === "draft" && (
        <>
          <Link
            href={`/investor-updates/${updateId}/edit`}
            className="rounded-lg ghost-border px-4 py-2 text-label-sm hover:bg-(--color-surface-container-high)"
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={onPublish}
            disabled={isPending}
            className="rounded-lg bg-(--color-success)/15 px-4 py-2 text-label-sm text-(--color-success) hover:bg-(--color-success)/25 disabled:opacity-50"
          >
            {isPending ? "Publishing…" : "Publish & share"}
          </button>
        </>
      )}
      {status === "published" && (
        <button
          type="button"
          onClick={copyLink}
          className="rounded-lg ghost-border px-4 py-2 text-label-sm hover:bg-(--color-surface-container-high)"
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
      )}
      <button
        type="button"
        onClick={onDelete}
        disabled={isPending}
        className="text-label-sm text-(--color-on-surface-variant) hover:text-(--color-error) px-3 py-2 disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
