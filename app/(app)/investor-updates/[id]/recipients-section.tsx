"use client";

import { useTransition } from "react";
import { resendToUnopenedRecipients } from "../../rounds/[id]/update-actions";

export interface RecipientRow {
  id: string;
  email: string;
  name: string | null;
  sent_at: string | null;
  opened_at: string | null;
}

interface Props {
  updateId: string;
  recipients: RecipientRow[];
}

function fmtDate(s: string | null | undefined): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function RecipientsSection({ updateId, recipients }: Props) {
  const [isPending, startTransition] = useTransition();

  const hasUnopenedRecipients = recipients.some((r) => r.opened_at === null);

  function onResend() {
    startTransition(async () => {
      await resendToUnopenedRecipients(updateId);
    });
  }

  if (recipients.length === 0) {
    return (
      <section className="space-y-2">
        <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">Recipients</h2>
        <p className="text-body-sm text-(--color-on-surface-variant)">
          No recipients yet. Send this update to populate the list.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">Recipients</h2>
        {hasUnopenedRecipients && (
          <button
            type="button"
            onClick={onResend}
            disabled={isPending}
            className="rounded-lg bg-(--color-primary)/10 px-3 py-1.5 text-label-sm text-(--color-primary) hover:bg-(--color-primary)/20 disabled:opacity-50 transition-colors"
          >
            {isPending ? "Sending…" : "Re-send to unopened"}
          </button>
        )}
      </div>

      <div className="rounded-xl bg-(--color-surface-container-low) overflow-hidden">
        <table className="w-full text-body-sm">
          <thead>
            <tr className="text-label-md uppercase text-(--color-on-surface-variant)">
              <th className="px-4 py-3 text-start font-normal">Name</th>
              <th className="px-4 py-3 text-start font-normal">Email</th>
              <th className="px-4 py-3 text-start font-normal tabular-nums">Sent</th>
              <th className="px-4 py-3 text-start font-normal tabular-nums">Opened</th>
              <th className="px-4 py-3 text-start font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {recipients.map((r) => (
              <tr key={r.id} className="border-t border-(--color-outline-variant)/15">
                <td className="px-4 py-3 text-(--color-on-surface)">{r.name ?? "—"}</td>
                <td className="px-4 py-3 text-(--color-on-surface-variant) font-mono text-body-xs">
                  {r.email}
                </td>
                <td className="px-4 py-3 tabular-nums text-(--color-on-surface-variant)">
                  {fmtDate(r.sent_at)}
                </td>
                <td className="px-4 py-3 tabular-nums text-(--color-on-surface-variant)">
                  {fmtDate(r.opened_at)}
                </td>
                <td className="px-4 py-3">
                  {r.opened_at ? (
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-label-sm font-medium bg-(--color-success)/15 text-(--color-success)">
                      Opened
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-label-sm font-medium bg-(--color-surface-bright) text-(--color-on-surface-variant)">
                      Not opened
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
