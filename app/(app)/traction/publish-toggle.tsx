"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { setPublished } from "./actions";

export function PublishToggle({
  initialPublished,
  publicUrl,
}: {
  initialPublished: boolean;
  publicUrl: string;
}) {
  const router = useRouter();
  const [published, setPublishedState] = useState(initialPublished);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    startTransition(async () => {
      setError(null);
      const next = !published;
      const result = await setPublished(next);
      if (!result.ok) {
        setError(result.error ?? "Failed.");
        return;
      }
      setPublishedState(next);
      router.refresh();
    });
  }

  return (
    <section className="rounded-xl bg-(--color-surface-container-low) p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
            Public profile
          </h2>
          <p className="mt-1 text-body-md">
            {published ? (
              <>
                Published at{" "}
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono underline text-(--color-primary) break-all"
                >
                  {publicUrl}
                </a>
              </>
            ) : (
              "Profile is draft. Only you can see it."
            )}
          </p>
          <p className="mt-1 text-body-sm text-(--color-on-surface-variant)">
            When published, anyone can view this page. Traction metrics show
            only if you&apos;ve enabled them above.
          </p>
        </div>
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          className={
            published
              ? "rounded-lg ghost-border px-5 py-2 text-label-lg disabled:opacity-50"
              : "btn-primary-gradient rounded-lg px-5 py-2 text-label-lg font-medium disabled:opacity-50"
          }
        >
          {pending ? "Saving…" : published ? "Unpublish" : "Publish"}
        </button>
      </div>
      {error && (
        <p className="mt-3 text-body-sm text-(--color-error)" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
