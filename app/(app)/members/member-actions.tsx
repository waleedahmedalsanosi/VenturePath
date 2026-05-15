"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { removeMember, revokeInvitation } from "./actions";

export function MemberActions({
  kind,
  id,
  workspaceId,
  userId,
  inviteToken,
}: {
  kind: "member" | "invitation";
  id: string;
  workspaceId: string;
  userId: string;
  inviteToken?: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function copyInviteLink() {
    if (!inviteToken) return;
    const link = `${window.location.origin}/invite/${inviteToken}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // ignore
    }
  }

  function onConfirm() {
    startTransition(async () => {
      setError(null);
      const result =
        kind === "invitation"
          ? await revokeInvitation(id)
          : await removeMember(workspaceId, userId);
      if (!result.ok) {
        setError(result.error ?? "Failed.");
        return;
      }
      setConfirming(false);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-end gap-3 whitespace-nowrap">
      {kind === "invitation" && inviteToken && (
        <button
          type="button"
          onClick={copyInviteLink}
          className="text-body-sm text-(--color-on-surface-variant) hover:text-(--color-primary)"
        >
          Copy link
        </button>
      )}
      {confirming ? (
        <>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-sm bg-(--color-error)/15 px-2 py-1 text-label-sm font-medium text-(--color-error) disabled:opacity-50"
          >
            {busy ? "…" : kind === "invitation" ? "Revoke" : "Remove"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={busy}
            className="rounded-sm px-2 py-1 text-label-sm text-(--color-on-surface-variant)"
          >
            Cancel
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="text-body-sm text-(--color-on-surface-variant) hover:text-(--color-error)"
        >
          {kind === "invitation" ? "Revoke" : "Remove"}
        </button>
      )}
      {error && (
        <p className="text-body-sm text-(--color-error)" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
