"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { saveResolution } from "../../../actions";
import type { Database } from "@/lib/supabase/types";

type Resolution = Database["public"]["Tables"]["resolutions"]["Row"];

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
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}

interface Meeting {
  id: string;
  title: string;
  meeting_at: string;
}

export function EditResolutionForm({
  resolution,
  meetings,
}: {
  resolution: Resolution;
  meetings: Meeting[];
}) {
  const [title, setTitle] = useState(resolution.title);
  const [body, setBody] = useState(resolution.body);
  const [error, setError] = useState<string | null>(null);

  async function handle(formData: FormData) {
    setError(null);
    formData.set("resolution_id", resolution.id);
    formData.set("template", resolution.template);
    formData.set("title", title);
    formData.set("body", body);
    const r = await saveResolution(formData);
    if (r && !r.ok) setError(r.error ?? "Failed.");
  }

  return (
    <form action={handle} className="space-y-6">
      <label className="block">
        <span className="text-label-md uppercase text-(--color-on-surface-variant)">Title *</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="text-label-md uppercase text-(--color-on-surface-variant)">Body *</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={16}
          className={`${inputClass} font-mono text-body-sm`}
        />
      </label>

      <label className="block">
        <span className="text-label-md uppercase text-(--color-on-surface-variant)">
          Linked board meeting (optional)
        </span>
        <select
          name="meeting_id"
          defaultValue={resolution.meeting_id ?? ""}
          className={inputClass}
        >
          <option value="">None</option>
          {meetings.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title} — {new Date(m.meeting_at).toLocaleDateString()}
            </option>
          ))}
        </select>
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
