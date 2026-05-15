import Link from "next/link";

import { AddShareholderForm } from "./add-form";

export default function AddShareholderPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link
        href="/cap-table"
        className="text-body-sm text-(--color-on-surface-variant) underline"
      >
        ← Back to cap table
      </Link>
      <h1 className="mt-4 text-display-sm font-semibold tracking-tight">
        Add a shareholder
      </h1>
      <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
        Prototype supports Ordinary Shares and iSAFE notes. Other instruments
        come later.
      </p>
      <div className="mt-10">
        <AddShareholderForm />
      </div>
    </main>
  );
}
