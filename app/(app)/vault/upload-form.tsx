"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

import { uploadDocument } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary-gradient rounded-lg px-5 py-2 text-label-lg font-medium disabled:opacity-50"
    >
      {pending ? "Uploading…" : "Upload"}
    </button>
  );
}

export function UploadForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>("");

  async function handle(formData: FormData) {
    setError(null);
    const result = await uploadDocument(formData);
    if (!result.ok) {
      setError(result.error ?? "Upload failed.");
      return;
    }
    setFilename("");
    router.refresh();
  }

  return (
    <form
      action={handle}
      className="rounded-xl bg-(--color-surface-container-low) p-6 flex flex-wrap items-end gap-4"
    >
      <label className="flex-1 min-w-48 block">
        <span className="text-label-md uppercase text-(--color-on-surface-variant)">
          File
        </span>
        <input
          name="file"
          type="file"
          required
          accept=".pdf,.docx,.xlsx,.doc,.xls,.jpg,.jpeg,.png"
          onChange={(e) => setFilename(e.currentTarget.files?.[0]?.name ?? "")}
          className="mt-1 block w-full rounded-sm bg-(--color-surface-container-high) ghost-border px-3 py-2 file:mr-3 file:rounded-sm file:border-0 file:bg-(--color-primary)/15 file:px-3 file:py-1 file:text-(--color-primary)"
        />
      </label>

      <label className="flex-1 min-w-48 block">
        <span className="text-label-md uppercase text-(--color-on-surface-variant)">
          Display name (optional)
        </span>
        <input
          name="name"
          type="text"
          maxLength={200}
          placeholder={filename || "Defaults to filename"}
          className="mt-1 block w-full rounded-sm bg-(--color-surface-container-high) ghost-border px-3 py-2"
        />
      </label>

      <SubmitButton />

      {error && (
        <p className="basis-full text-body-sm text-(--color-error)" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
