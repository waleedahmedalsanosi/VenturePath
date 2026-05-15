import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { TEMPLATE_LABELS } from "@/lib/governance/templates";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

import { ResolutionActions } from "../../resolution-actions";

const RESOLUTION_STATUS_STYLES: Record<string, string> = {
  draft: "bg-(--color-surface-bright) text-(--color-on-surface-variant)",
  pending: "bg-(--color-warning)/20 text-(--color-warning)",
  passed: "bg-(--color-success)/20 text-(--color-success)",
  rejected: "bg-(--color-error)/15 text-(--color-error)",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ResolutionPage({ params }: PageProps) {
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

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link
        href="/governance"
        className="text-body-sm text-(--color-on-surface-variant) underline"
      >
        ← Back to governance
      </Link>

      <header className="mt-4 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-label-md uppercase text-(--color-on-surface-variant)">
            {TEMPLATE_LABELS[r.template]}
          </p>
          <h1 className="mt-1 text-display-sm font-semibold tracking-tight">
            {r.title}
          </h1>
          <p className="mt-2 text-body-sm text-(--color-on-surface-variant)">
            Created {new Date(r.created_at).toLocaleString()}
            {r.decided_at && (
              <> · Decided {new Date(r.decided_at).toLocaleString()}</>
            )}
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-label-md font-medium uppercase tracking-wider ${RESOLUTION_STATUS_STYLES[r.status]}`}
        >
          {r.status}
        </span>
      </header>

      <article className="mt-10 rounded-xl bg-(--color-surface-container-low) p-6 whitespace-pre-wrap font-mono text-body-sm">
        {r.body}
      </article>

      <div className="mt-6 flex items-center justify-end">
        <ResolutionActions id={r.id} status={r.status} />
      </div>
    </main>
  );
}
