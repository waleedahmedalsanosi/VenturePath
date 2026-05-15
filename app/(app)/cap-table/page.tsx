import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

import { CapTableEmpty } from "./components/empty-state";
import { CapTablePopulated } from "./components/populated";

export default async function CapTablePage() {
  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/setup");

  const supabase = await createClient();
  const { data: shareholders } = await supabase
    .from("shareholders")
    .select("*")
    .eq("workspace_id", workspace.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  const rows = shareholders ?? [];

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {rows.length === 0 ? (
        <CapTableEmpty workspaceName={workspace.name} />
      ) : (
        <CapTablePopulated workspace={workspace} shareholders={rows} />
      )}
    </main>
  );
}
