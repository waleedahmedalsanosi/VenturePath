"use client";

import { useState, useTransition } from "react";

import { acceptInvitation } from "./actions";

export function AcceptButton({ token }: { token: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    startTransition(async () => {
      setError(null);
      const result = await acceptInvitation(token);
      if (!result.ok) {
        setError(result.error ?? "Acceptance failed.");
      }
    });
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="btn-primary-gradient w-full rounded-lg py-2.5 text-label-lg font-medium disabled:opacity-50"
      >
        {pending ? "Accepting…" : "Accept invitation"}
      </button>
      {error && (
        <p className="text-body-sm text-(--color-error)" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
