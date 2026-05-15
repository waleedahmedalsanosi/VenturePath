"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

import { createInvitation } from "./actions";

const inputClass =
  "block w-full rounded-sm bg-(--color-surface-container-high) ghost-border px-3 py-2 focus:outline-none focus:border-(--color-primary)";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary-gradient rounded-lg px-5 py-2 text-label-lg font-medium disabled:opacity-50"
    >
      {pending ? "Creating…" : "Create invitation"}
    </button>
  );
}

export function InviteForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);

  async function handle(formData: FormData) {
    setError(null);
    setLink(null);
    const result = await createInvitation(formData);
    if (!result.ok) {
      setError(result.error ?? "Failed.");
      return;
    }
    if (result.invitationLink) {
      const absolute = `${window.location.origin}${result.invitationLink}`;
      setLink(absolute);
      router.refresh();
    }
  }

  async function copyLink() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // ignore
    }
  }

  return (
    <form action={handle} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="block sm:col-span-2">
          <span className="text-label-md uppercase text-(--color-on-surface-variant)">
            Email *
          </span>
          <input
            name="invited_email"
            type="email"
            required
            className={inputClass}
            placeholder="invitee@example.com"
          />
        </label>
        <label className="block">
          <span className="text-label-md uppercase text-(--color-on-surface-variant)">
            Role
          </span>
          <select name="role" defaultValue="viewer" className={inputClass}>
            <option value="viewer">Viewer (read-only)</option>
            <option value="admin">Admin (read-only in prototype)</option>
          </select>
        </label>
      </div>
      <p className="text-body-sm text-(--color-on-surface-variant)">
        No email infra in the prototype yet — copy the generated link and send
        it to the invitee yourself.
      </p>
      <SubmitButton />

      {error && (
        <p className="text-body-sm text-(--color-error)" role="alert">
          {error}
        </p>
      )}

      {link && (
        <div className="mt-2 rounded-md bg-(--color-success)/10 px-4 py-3">
          <p className="text-body-sm text-(--color-success) mb-2">
            Invitation created. Share this link with the invitee (expires in 7
            days):
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <code className="flex-1 min-w-0 break-all text-body-sm font-mono bg-(--color-surface-container-high) rounded-sm px-2 py-1">
              {link}
            </code>
            <button
              type="button"
              onClick={copyLink}
              className="rounded-sm ghost-border px-3 py-1 text-label-sm hover:bg-(--color-surface-container-high)"
            >
              Copy
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
