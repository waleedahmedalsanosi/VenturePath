import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { AddGrantForm } from "./add-grant-form";

export default async function AddGrantPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!workspace) redirect("/setup");

  const { data: pool } = await supabase
    .from("esop_pools")
    .select("id, total_pool_shares")
    .eq("workspace_id", workspace.id)
    .maybeSingle();
  if (!pool) redirect("/esop");

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link
        href="/esop"
        className="text-body-sm text-(--color-on-surface-variant) underline"
      >
        ← Back to ESOP
      </Link>
      <h1 className="mt-4 text-display-sm font-semibold tracking-tight">
        Add ESOP grant
      </h1>
      <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
        Pool size: {Number(pool.total_pool_shares).toLocaleString()} options total.
      </p>
      <div className="mt-10">
        <AddGrantForm />
      </div>
    </main>
  );
}
