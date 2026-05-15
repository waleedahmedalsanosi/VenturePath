import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

import { EditGrantForm } from "./form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditGrantPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/setup");

  const { data: grant } = await supabase
    .from("esop_grants")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", workspace.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!grant) notFound();

  if (grant.status === "terminated") {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
        <Link href="/esop" className="text-body-sm text-(--color-on-surface-variant) underline">
          ← Back to ESOP
        </Link>
        <h1 className="mt-4 text-display-sm font-semibold tracking-tight">Cannot edit</h1>
        <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
          This grant has been terminated and is a permanent record.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/esop" className="text-body-sm text-(--color-on-surface-variant) underline">
        ← Back to ESOP
      </Link>
      <h1 className="mt-4 text-display-sm font-semibold tracking-tight">Edit grant</h1>
      <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
        Editing {grant.employee_name}&rsquo;s grant.{" "}
        <span className="text-(--color-on-surface-variant)">
          Options count and vesting type are locked after creation.
        </span>
      </p>
      <div className="mt-10">
        <EditGrantForm grantId={id} grant={grant} />
      </div>
    </main>
  );
}
