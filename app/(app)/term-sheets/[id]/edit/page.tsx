import Link from "next/link";
import { redirect, notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

import { TermSheetForm } from "../../term-sheet-form";
import { updateTermSheet } from "../../../rounds/[id]/term-sheet-actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTermSheetPage({ params }: PageProps) {
  const { id } = await params;

  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/setup");

  const supabase = await createClient();

  const { data: ts } = await supabase
    .from("term_sheets")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", workspace.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!ts) notFound();

  if (ts.status === "signed" || ts.status === "withdrawn") {
    redirect(`/term-sheets/${id}`);
  }

  async function action(formData: FormData) {
    "use server";
    return updateTermSheet(id, formData);
  }

  const terms = (ts.terms ?? {}) as Record<string, string | number | undefined>;

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link
        href={`/term-sheets/${id}`}
        className="text-body-sm text-(--color-on-surface-variant) underline"
      >
        ← Back to term sheet
      </Link>
      <h1 className="mt-4 text-display-sm font-semibold tracking-tight">
        Edit term sheet
      </h1>
      <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
        Currently version {ts.version} — saving will bump to v{ts.version + 1}.
      </p>

      <div className="mt-10">
        <TermSheetForm
          submitLabel="Save changes"
          action={action}
          defaults={{
            instrument_type: ts.instrument_type,
            investor_name: ts.investor_name,
            firm: ts.firm ?? "",
            investor_email: ts.investor_email ?? "",
            notes: ts.notes ?? "",
            pipeline_contact_id: ts.pipeline_contact_id ?? "",
            instrument_locked: true,
            terms,
          }}
        />
      </div>
    </main>
  );
}
