"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

import { uploadDocument } from "./actions";

interface Category {
  id: string;
  name: string;
  is_data_room: boolean;
}

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

export function UploadForm({ categories }: { categories: Category[] }) {
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

  const dataRoom = categories.find((c) => c.is_data_room);

  return (
    <form
      action={handle}
      className="rounded-xl bg-(--color-surface-container-low) p-6 grid grid-cols-1 md:grid-cols-12 gap-4"
    >
      <label className="md:col-span-4 block">
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

      <label className="md:col-span-3 block">
        <span className="text-label-md uppercase text-(--color-on-surface-variant)">
          Display name
        </span>
        <input
          name="name"
          type="text"
          maxLength={200}
          placeholder={filename || "Defaults to filename"}
          className="mt-1 block w-full rounded-sm bg-(--color-surface-container-high) ghost-border px-3 py-2"
        />
      </label>

      <label className="md:col-span-2 block">
        <span className="text-label-md uppercase text-(--color-on-surface-variant)">
          Category
        </span>
        <select
          name="category_id"
          className="mt-1 block w-full rounded-sm bg-(--color-surface-container-high) ghost-border px-3 py-2"
          defaultValue=""
        >
          <option value="">Uncategorized</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.is_data_room ? "🔒 " : ""}{c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="md:col-span-2 block">
        <span className="text-label-md uppercase text-(--color-on-surface-variant)">
          Visibility
        </span>
        <select
          name="visibility"
          defaultValue="internal"
          className="mt-1 block w-full rounded-sm bg-(--color-surface-container-high) ghost-border px-3 py-2"
        >
          <option value="internal">Internal (owner)</option>
          <option value="data_room">Data Room (invited)</option>
          <option value="public">Public (anyone)</option>
        </select>
      </label>

      <div className="md:col-span-1 flex items-end">
        <SubmitButton />
      </div>

      {error && (
        <p className="md:col-span-12 text-body-sm text-(--color-error)" role="alert">
          {error}
        </p>
      )}

      {dataRoom && (
        <p className="md:col-span-12 text-body-sm text-(--color-on-surface-variant)">
          Tip: documents tagged as <strong>Data Room</strong> visibility appear
          in the Data Room category for invited investors. Tag as{" "}
          <strong>Public</strong> to show on your public profile.
        </p>
      )}
    </form>
  );
}
