import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

import { EditShareholderForm } from "./edit-form";

export default async function EditShareholderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: shareholder } = await supabase
    .from("shareholders")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!shareholder) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link
        href="/cap-table"
        className="text-body-sm text-(--color-on-surface-variant) underline"
      >
        ← Back to cap table
      </Link>
      <h1 className="mt-4 text-display-sm font-semibold tracking-tight">
        Edit shareholder
      </h1>
      <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
        Instrument type can&apos;t change after creation — delete and re-add to
        switch types.
      </p>
      <div className="mt-10">
        <EditShareholderForm shareholder={shareholder} />
      </div>
    </main>
  );
}
