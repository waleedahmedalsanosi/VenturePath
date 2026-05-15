import { redirect } from "next/navigation";
import Link from "next/link";

import { getActiveWorkspace } from "@/lib/workspace/active";

import { NewRoundForm } from "./form";

export default async function NewRoundPage() {
  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/setup");

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link
        href="/rounds"
        className="text-body-sm text-(--color-on-surface-variant) underline"
      >
        ← Back to rounds
      </Link>
      <h1 className="mt-4 text-display-sm font-semibold tracking-tight">
        New round
      </h1>
      <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
        Open a round to start tracking investors. A draft board resolution is
        created automatically — you can edit it in Governance before submitting
        for approval.
      </p>
      <div className="mt-10">
        <NewRoundForm />
      </div>
    </main>
  );
}
