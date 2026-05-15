"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

import { exportAuditCsv } from "./actions";

export function DownloadCsvButton({ workspaceId }: { workspaceId: string }) {
  const params = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setBusy(true);
    setError(null);
    const result = await exportAuditCsv(workspaceId, {
      entity: params.get("entity") ?? undefined,
      actor: params.get("actor") ?? undefined,
      since: params.get("since") ?? undefined,
      until: params.get("until") ?? undefined,
    });
    setBusy(false);
    if (!result.ok || !result.csv) {
      setError(result.error ?? "Export failed.");
      return;
    }
    const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={download}
        disabled={busy}
        className="rounded-lg ghost-border px-5 py-2 text-label-lg hover:bg-(--color-surface-container-high) disabled:opacity-50"
      >
        {busy ? "Exporting…" : "Export CSV"}
      </button>
      {error && (
        <p className="text-body-sm text-(--color-error)" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
