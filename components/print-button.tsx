"use client";

export function PrintButton({ label = "Export PDF" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg ghost-border px-4 py-2 text-label-sm hover:bg-(--color-surface-container-high) transition-colors print:hidden"
    >
      {label}
    </button>
  );
}
