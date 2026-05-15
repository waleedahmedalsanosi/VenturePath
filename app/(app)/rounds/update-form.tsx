"use client";

import { useRef, useState, useTransition } from "react";

interface UpdateFormDefaults {
  subject?: string;
  body?: string;
  mrr_sar?: string;
  runway_months?: string;
  highlights?: string;
}

interface UpdateFormProps {
  action: (formData: FormData) => Promise<{ ok: boolean; error?: string } | void>;
  submitLabel: string;
  defaults?: UpdateFormDefaults;
}

export function UpdateForm({ action, submitLabel, defaults = {} }: UpdateFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await action(fd);
      if (result && !result.ok) setError(result.error ?? "Failed.");
    });
  }

  return (
    <form ref={formRef} onSubmit={submit} className="space-y-6">
      {/* Subject */}
      <div>
        <label className="text-label-sm text-(--color-on-surface-variant) mb-1.5 block">
          Subject <span className="text-(--color-error)">*</span>
        </label>
        <input
          name="subject"
          type="text"
          required
          maxLength={300}
          defaultValue={defaults.subject ?? ""}
          placeholder="Seed round update — May 2026"
          className="w-full rounded-lg border border-(--color-outline-variant) bg-(--color-surface-container-high) px-3 py-2 text-body-sm focus:outline-none focus:ring-2 focus:ring-(--color-primary)/40"
        />
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-label-sm text-(--color-on-surface-variant) mb-1.5 block">
            MRR (SAR)
          </label>
          <input
            name="mrr_sar"
            type="number"
            min="0"
            step="0.01"
            defaultValue={defaults.mrr_sar ?? ""}
            placeholder="e.g. 120000"
            className="w-full rounded-lg border border-(--color-outline-variant) bg-(--color-surface-container-high) px-3 py-2 text-body-sm focus:outline-none focus:ring-2 focus:ring-(--color-primary)/40"
          />
          <p className="mt-1 text-label-sm text-(--color-on-surface-variant)">Pre-filled from traction metrics</p>
        </div>
        <div>
          <label className="text-label-sm text-(--color-on-surface-variant) mb-1.5 block">
            Runway (months)
          </label>
          <input
            name="runway_months"
            type="number"
            min="0"
            step="0.1"
            defaultValue={defaults.runway_months ?? ""}
            placeholder="e.g. 18"
            className="w-full rounded-lg border border-(--color-outline-variant) bg-(--color-surface-container-high) px-3 py-2 text-body-sm focus:outline-none focus:ring-2 focus:ring-(--color-primary)/40"
          />
        </div>
      </div>

      {/* Highlights */}
      <div>
        <label className="text-label-sm text-(--color-on-surface-variant) mb-1.5 block">
          Key highlights
          <span className="ml-1 text-(--color-on-surface-disabled)">(one per line, max 10)</span>
        </label>
        <textarea
          name="highlights"
          rows={4}
          defaultValue={defaults.highlights ?? ""}
          placeholder={"Launched in 3 new cities\nSigned Aramco pilot\nClosed SAR 500K from lead investor"}
          className="w-full rounded-lg border border-(--color-outline-variant) bg-(--color-surface-container-high) px-3 py-2 text-body-sm focus:outline-none focus:ring-2 focus:ring-(--color-primary)/40 resize-none"
        />
      </div>

      {/* Body */}
      <div>
        <label className="text-label-sm text-(--color-on-surface-variant) mb-1.5 block">
          Full update <span className="text-(--color-error)">*</span>
        </label>
        <textarea
          name="body"
          rows={10}
          required
          defaultValue={defaults.body ?? ""}
          placeholder="Write a detailed update for your investors — progress, challenges, next milestones, and how they can help."
          className="w-full rounded-lg border border-(--color-outline-variant) bg-(--color-surface-container-high) px-3 py-2 text-body-sm focus:outline-none focus:ring-2 focus:ring-(--color-primary)/40 resize-y"
        />
      </div>

      {error && <p className="text-body-sm text-(--color-error)">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-(--color-primary) px-6 py-2.5 text-label-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
