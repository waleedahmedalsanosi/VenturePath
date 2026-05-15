"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg btn-primary-gradient px-4 py-2 text-label-sm font-medium"
    >
      Print / PDF
    </button>
  );
}
