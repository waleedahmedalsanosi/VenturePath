import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

import { EditResolutionForm } from "./form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditResolutionPage({ params }: PageProps) {
  const { id } = await params;
  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/setup");

  const supabase = await createClient();
  const { data: r } = await supabase
    .from("resolutions")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", workspace.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!r) notFound();

  if (r.status !== "draft") {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
        <Link
          href={`/governance/resolutions/${id}`}
          className="text-body-sm text-(--color-on-surface-variant) underline"
        >
          ← Back to resolution
        </Link>
        <h1 className="mt-4 text-display-sm font-semibold tracking-tight">
          Cannot edit
        </h1>
        <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
          This resolution is <strong>{r.status}</strong> — only drafts are
          editable. Passed and rejected resolutions are permanent records.
        </p>
      </main>
    );
  }

  const { data: meetings } = await supabase
    .from("board_meetings")
    .select("id, title, meeting_at")
    .eq("workspace_id", workspace.id)
    .is("deleted_at", null)
    .order("meeting_at", { ascending: false });

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link
        href={`/governance/resolutions/${id}`}
        className="text-body-sm text-(--color-on-surface-variant) underline"
      >
        ← Back to resolution
      </Link>
      <h1 className="mt-4 text-display-sm font-semibold tracking-tight">
        Edit resolution
      </h1>
      <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
        Drafts can be edited freely. Once submitted, the resolution is locked
        until passed or rejected.
      </p>
      <div className="mt-10">
        <EditResolutionForm resolution={r} meetings={meetings ?? []} />
      </div>
    </main>
  );
}
