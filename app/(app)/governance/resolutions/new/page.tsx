import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

import { NewResolutionForm } from "./form";

export default async function NewResolutionPage() {
  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/setup");

  const supabase = await createClient();
  const { data: meetings } = await supabase
    .from("board_meetings")
    .select("id, title, meeting_at")
    .eq("workspace_id", workspace.id)
    .is("deleted_at", null)
    .order("meeting_at", { ascending: false });

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link
        href="/governance"
        className="text-body-sm text-(--color-on-surface-variant) underline"
      >
        ← Back to governance
      </Link>
      <h1 className="mt-4 text-display-sm font-semibold tracking-tight">
        New resolution
      </h1>
      <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
        Pick a template or start from scratch. The resolution starts as Draft —
        you can edit freely until you Submit it for approval.
      </p>
      <div className="mt-10">
        <NewResolutionForm meetings={meetings ?? []} />
      </div>
    </main>
  );
}
