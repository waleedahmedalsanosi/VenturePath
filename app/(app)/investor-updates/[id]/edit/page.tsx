import Link from "next/link";
import { redirect, notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

import { UpdateForm } from "../../../rounds/update-form";
import { updateInvestorUpdate } from "../../../rounds/[id]/update-actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditInvestorUpdatePage({ params }: PageProps) {
  const { id } = await params;

  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/setup");

  const supabase = await createClient();

  const { data: update } = await supabase
    .from("investor_updates")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", workspace.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!update) notFound();

  if (update.status === "published") redirect(`/investor-updates/${id}`);

  async function action(formData: FormData) {
    "use server";
    return updateInvestorUpdate(id, formData);
  }

  const highlights = ((update.highlights ?? []) as string[]).join("\n");

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link
        href={`/investor-updates/${id}`}
        className="text-body-sm text-(--color-on-surface-variant) underline"
      >
        ← Back to update
      </Link>
      <h1 className="mt-4 text-display-sm font-semibold tracking-tight">
        Edit update
      </h1>
      <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
        Editing draft — once published the update becomes publicly accessible.
      </p>

      <div className="mt-10">
        <UpdateForm
          action={action}
          submitLabel="Save changes"
          defaults={{
            subject: update.subject,
            body: update.body,
            mrr_sar: update.mrr_sar != null ? String(update.mrr_sar) : "",
            runway_months: update.runway_months != null ? String(update.runway_months) : "",
            highlights,
          }}
        />
      </div>
    </main>
  );
}
