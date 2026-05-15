"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { scheduleMeeting } from "../../actions";

const inputClass =
  "block w-full rounded-sm bg-(--color-surface-container-high) ghost-border px-3 py-2 focus:outline-none focus:border-(--color-primary)";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary-gradient rounded-lg px-6 py-2.5 text-label-lg font-medium disabled:opacity-50"
    >
      {pending ? "Saving…" : "Schedule meeting"}
    </button>
  );
}

function defaultDateTime(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(10, 0, 0, 0);
  return d.toISOString().slice(0, 16);
}

export function NewMeetingForm() {
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState<"virtual" | "in_person">("virtual");

  async function handle(formData: FormData) {
    setError(null);
    formData.set("format", format);
    const r = await scheduleMeeting(formData);
    if (r && !r.ok) setError(r.error ?? "Failed.");
  }

  return (
    <form action={handle} className="space-y-6">
      <label className="block">
        <span className="text-label-md uppercase text-(--color-on-surface-variant)">Title *</span>
        <input
          name="title"
          required
          maxLength={200}
          placeholder="e.g. Q3 Board Meeting"
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="text-label-md uppercase text-(--color-on-surface-variant)">When *</span>
        <input
          name="meeting_at"
          type="datetime-local"
          required
          defaultValue={defaultDateTime()}
          className={inputClass}
        />
      </label>

      <div>
        <span className="text-label-md uppercase text-(--color-on-surface-variant)">Format *</span>
        <div className="mt-1 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormat("virtual")}
            aria-pressed={format === "virtual"}
            className={`rounded-md p-3 text-start transition-colors ${
              format === "virtual"
                ? "bg-(--color-primary)/15 border border-(--color-primary)"
                : "bg-(--color-surface-container-high) ghost-border hover:bg-(--color-surface-bright)"
            }`}
          >
            <p className="text-label-lg font-medium">Virtual</p>
            <p className="text-body-sm text-(--color-on-surface-variant)">Zoom / Meet / Teams</p>
          </button>
          <button
            type="button"
            onClick={() => setFormat("in_person")}
            aria-pressed={format === "in_person"}
            className={`rounded-md p-3 text-start transition-colors ${
              format === "in_person"
                ? "bg-(--color-primary)/15 border border-(--color-primary)"
                : "bg-(--color-surface-container-high) ghost-border hover:bg-(--color-surface-bright)"
            }`}
          >
            <p className="text-label-lg font-medium">In person</p>
            <p className="text-body-sm text-(--color-on-surface-variant)">Physical address</p>
          </button>
        </div>
      </div>

      <label className="block">
        <span className="text-label-md uppercase text-(--color-on-surface-variant)">
          Location / link
        </span>
        <input
          name="location"
          type="text"
          placeholder={format === "virtual" ? "Meeting URL" : "Address"}
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="text-label-md uppercase text-(--color-on-surface-variant)">
          Agenda
        </span>
        <textarea name="agenda" rows={6} className={inputClass} />
      </label>

      {error && (
        <p className="text-body-sm text-(--color-error)" role="alert">
          {error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
