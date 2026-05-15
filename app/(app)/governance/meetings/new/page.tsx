import Link from "next/link";

import { NewMeetingForm } from "./form";

export default function NewMeetingPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link
        href="/governance"
        className="text-body-sm text-(--color-on-surface-variant) underline"
      >
        ← Back to governance
      </Link>
      <h1 className="mt-4 text-display-sm font-semibold tracking-tight">
        Schedule board meeting
      </h1>
      <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
        Records the meeting on the governance timeline. Notifying attendees is
        a future feature — for now, share the details out-of-band.
      </p>
      <div className="mt-10">
        <NewMeetingForm />
      </div>
    </main>
  );
}
