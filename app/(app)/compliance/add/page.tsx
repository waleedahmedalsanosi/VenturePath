import Link from "next/link";

import { AddObligationForm } from "./add-form";

export default function AddCompliancePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link
        href="/compliance"
        className="text-body-sm text-(--color-on-surface-variant) underline"
      >
        ← Back to compliance
      </Link>
      <h1 className="mt-4 text-display-sm font-semibold tracking-tight">
        Add compliance obligation
      </h1>
      <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
        ZATCA filing, Commercial Registration renewal, or any deadline you need
        a reminder for.
      </p>
      <div className="mt-10">
        <AddObligationForm />
      </div>
    </main>
  );
}
