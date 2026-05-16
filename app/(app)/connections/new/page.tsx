import { redirect } from "next/navigation";

import { getActiveWorkspace } from "@/lib/workspace/active";

import { NewListingPageContent } from "./page-content";

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
    <NewListingPageContent
      initialType={initialType}
      workspaceName={workspace.name}
    />
  );
}
