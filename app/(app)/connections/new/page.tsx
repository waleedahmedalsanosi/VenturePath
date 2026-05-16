import Link from "next/link";
import { redirect } from "next/navigation";

import { getActiveWorkspace } from "@/lib/workspace/active";

import { NewListingForm } from "./form";

export const dynamic = "force-dynamic";

export default async function NewConnectionListingPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const initialType = type === "partnership" ? "partnership" : "exit";

  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/setup");

  return (
    <main className="mx-auto max-w-2xl px-6 py-10 space-y-8">
      <Link
        href="/connections"
        className="text-body-sm text-(--color-on-surface-variant) hover:underline"
      >
        ← Back to Connections
      </Link>

      <header className="space-y-2">
        <p className="text-label-md uppercase text-(--color-on-surface-variant)">
          Investment
        </p>
        <h1 className="text-display-sm font-semibold tracking-tight">
          New connection listing
        </h1>
        <p className="text-body-md text-(--color-on-surface-variant)">
          {workspace.name} will appear by name on the Connections Hub. Other
          VenturePath members can send an inquiry; you accept or decline each one.
        </p>
      </header>

      <NewListingForm initialType={initialType} workspaceName={workspace.name} />
    </main>
  );
}
