"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { cycleVisibility, deleteDocument, getSignedDownloadUrl } from "./actions";

const MIME_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "application/msword": "DOC",
  "application/vnd.ms-excel": "XLS",
  "image/jpeg": "JPEG",
  "image/png": "PNG",
};

const VISIBILITY_STYLES: Record<string, { label: string; bg: string; fg: string; hint: string }> = {
  internal: {
    label: "Internal",
    bg: "bg-(--color-surface-bright)",
    fg: "text-(--color-on-surface-variant)",
    hint: "Owner only — click to share with data room",
  },
  data_room: {
    label: "Data Room",
    bg: "bg-(--color-warning)/20",
    fg: "text-(--color-warning)",
    hint: "Invited investors only — click to make public",
  },
  public: {
    label: "Public",
    bg: "bg-(--color-success)/20",
    fg: "text-(--color-success)",
    hint: "Anyone can view — click to make internal",
  },
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function DocumentRow({
  id,
  name,
  mimeType,
  visibility,
  sizeLabel,
  createdAt,
}: {
  id: string;
  name: string;
  mimeType: string | null;
  visibility: "internal" | "data_room" | "public";
  sizeLabel: string;
  createdAt: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function onDownload() {
    setError(null);
    const result = await getSignedDownloadUrl(id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    window.open(result.url, "_blank", "noopener");
  }

  function onCycleVisibility() {
    startTransition(async () => {
      setError(null);
      const r = await cycleVisibility(id);
      if (!r.ok) {
        setError(r.error ?? "Failed.");
        return;
      }
      router.refresh();
    });
  }

  function onDelete() {
    startTransition(async () => {
      const result = await deleteDocument(id);
      if (!result.ok) {
        setError(result.error ?? "Delete failed.");
        return;
      }
      setConfirming(false);
      router.refresh();
    });
  }

  const typeLabel = mimeType
    ? MIME_LABELS[mimeType] ?? mimeType.split("/")[1]?.toUpperCase()
    : "?";
  const vis = VISIBILITY_STYLES[visibility] ?? VISIBILITY_STYLES.internal!;

  return (
    <tr className="border-t border-(--color-outline-variant)/15">
      <td className="px-4 py-3 font-medium break-all">{name}</td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center rounded-full bg-(--color-surface-bright) px-2.5 py-0.5 text-label-sm font-medium uppercase tracking-wider">
          {typeLabel}
        </span>
      </td>
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={onCycleVisibility}
          disabled={busy}
          title={vis.hint}
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-label-sm font-medium uppercase tracking-wider hover:opacity-80 disabled:opacity-50 ${vis.bg} ${vis.fg}`}
        >
          {vis.label}
        </button>
      </td>
      <td className="px-4 py-3 text-end tabular-nums text-(--color-on-surface-variant)">
        {sizeLabel}
      </td>
      <td className="px-4 py-3 text-end tabular-nums text-(--color-on-surface-variant)">
        {fmtDate(createdAt)}
      </td>
      <td className="px-4 py-3">
        {confirming ? (
          <div className="flex items-center justify-end gap-2 whitespace-nowrap">
            <span className="text-body-sm text-(--color-on-surface-variant)">
              Delete?
            </span>
            <button
              type="button"
              onClick={onDelete}
              disabled={busy}
              className="rounded-sm bg-(--color-error)/15 px-2 py-1 text-label-sm font-medium text-(--color-error) disabled:opacity-50"
            >
              {busy ? "…" : "Confirm"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={busy}
              className="rounded-sm px-2 py-1 text-label-sm text-(--color-on-surface-variant) hover:text-(--color-on-surface)"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-3 whitespace-nowrap">
            <button
              type="button"
              onClick={onDownload}
              className="text-body-sm text-(--color-on-surface-variant) hover:text-(--color-primary)"
            >
              Download
            </button>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="text-body-sm text-(--color-on-surface-variant) hover:text-(--color-error)"
            >
              Delete
            </button>
          </div>
        )}
        {error && (
          <p className="mt-1 text-body-sm text-(--color-error) text-end" role="alert">
            {error}
          </p>
        )}
      </td>
    </tr>
  );
}
