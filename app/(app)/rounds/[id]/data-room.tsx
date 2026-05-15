"use client";

import { useState, useTransition } from "react";

import { createDataRoomLink, revokeDataRoomLink } from "./data-room-actions";

interface DataRoomLink {
  id: string;
  label: string;
  token: string;
  is_active: boolean;
  view_count: number;
  expires_at: string | null;
  created_at: string;
}

interface DataRoomProps {
  roundId: string;
  links: DataRoomLink[];
  appUrl: string;
}

export function DataRoom({ roundId, links, appUrl }: DataRoomProps) {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createDataRoomLink(roundId, fd);
      if (!result.ok) setError(result.error ?? "Failed.");
      else { setShowForm(false); (e.target as HTMLFormElement).reset(); }
    });
  }

  function handleRevoke(linkId: string) {
    if (!confirm("Revoke this link? Anyone with the link will lose access.")) return;
    startTransition(async () => {
      const result = await revokeDataRoomLink(linkId, roundId);
      if (!result.ok) setError(result.error ?? "Failed.");
    });
  }

  function handleCopy(token: string) {
    const url = `${appUrl}/data-room/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(token);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const activeLinks = links.filter((l) => l.is_active);
  const revokedLinks = links.filter((l) => !l.is_active);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
          Data room
        </h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg ghost-border px-4 py-2 text-label-sm hover:bg-(--color-surface-container-high)"
        >
          {showForm ? "Cancel" : "+ Create link"}
        </button>
      </div>

      <p className="text-body-sm text-(--color-on-surface-variant)">
        Share a tracked link with investors. Each link shows documents marked
        as <strong>data room</strong> visibility in your Vault. Files can be
        downloaded by authenticated users — the link itself is open-access.
      </p>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl bg-(--color-surface-container-low) p-5 space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-label-lg" htmlFor="dr-label">Link label</label>
              <input id="dr-label" name="label" defaultValue="Investor Link"
                className="w-full rounded-lg bg-(--color-surface-container-high) px-3 py-2 text-body-md ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary)/40" />
              <p className="text-body-sm text-(--color-on-surface-variant)">Helps you identify which investor received which link.</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-label-lg" htmlFor="dr-expires">Expires after (days)</label>
              <input id="dr-expires" name="expires_days" type="number" min="0" max="365" defaultValue="0"
                className="w-full rounded-lg bg-(--color-surface-container-high) px-3 py-2 text-body-md ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary)/40" />
              <p className="text-body-sm text-(--color-on-surface-variant)">0 = no expiry.</p>
            </div>
          </div>
          {error && (
            <p className="rounded-md bg-(--color-error)/10 px-3 py-2 text-body-sm text-(--color-error)">{error}</p>
          )}
          <button type="submit" disabled={isPending}
            className="rounded-lg bg-(--color-primary)/15 px-5 py-2 text-label-lg text-(--color-primary) hover:bg-(--color-primary)/25 transition-colors disabled:opacity-50">
            {isPending ? "Creating…" : "Generate link"}
          </button>
        </form>
      )}

      {/* Active links */}
      {activeLinks.length === 0 && !showForm ? (
        <div className="rounded-xl bg-(--color-surface-container-low) px-6 py-8 text-center">
          <p className="text-body-md text-(--color-on-surface-variant)">
            No data room links yet. Create one to share with investors.
          </p>
        </div>
      ) : activeLinks.length > 0 ? (
        <div className="rounded-xl bg-(--color-surface-container-low) overflow-hidden">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="text-label-md uppercase text-(--color-on-surface-variant)">
                <th className="px-4 py-3 text-start font-normal">Label</th>
                <th className="px-4 py-3 text-start font-normal">Views</th>
                <th className="px-4 py-3 text-start font-normal hidden sm:table-cell">Expires</th>
                <th className="px-4 py-3 text-end font-normal" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {activeLinks.map((l) => (
                <tr key={l.id} className="border-t border-(--color-outline-variant)/15 align-middle group">
                  <td className="px-4 py-3">
                    <div className="font-medium">{l.label}</div>
                    <div className="text-body-sm text-(--color-on-surface-variant) font-mono truncate max-w-[200px]">
                      /data-room/{l.token}
                    </div>
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    <span className="text-display-sm font-semibold">{l.view_count}</span>
                  </td>
                  <td className="px-4 py-3 text-(--color-on-surface-variant) hidden sm:table-cell whitespace-nowrap">
                    {l.expires_at
                      ? new Date(l.expires_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                      : "Never"}
                  </td>
                  <td className="px-4 py-3 text-end">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => handleCopy(l.token)}
                        className="text-body-sm text-(--color-primary) hover:underline"
                      >
                        {copied === l.token ? "Copied!" : "Copy link"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRevoke(l.id)}
                        disabled={isPending}
                        className="text-body-sm text-(--color-on-surface-variant) hover:text-(--color-error) opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Revoke
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Revoked links (collapsed) */}
      {revokedLinks.length > 0 && (
        <p className="text-body-sm text-(--color-on-surface-variant)">
          {revokedLinks.length} revoked link{revokedLinks.length > 1 ? "s" : ""} not shown.
        </p>
      )}
    </section>
  );
}
