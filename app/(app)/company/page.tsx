import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

import { CompanyForm } from "./form";

export default async function CompanyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/setup");

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <p className="text-label-md uppercase text-(--color-on-surface-variant)">
        Company info
      </p>
      <h1 className="mt-1 text-display-sm font-semibold tracking-tight">
        {workspace.name}
      </h1>
      <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
        Edit the company details that appear on your public profile and across
        the app. Changes are logged in the audit trail.
      </p>
      <div className="mt-10">
        <CompanyForm workspace={workspace} />
      </div>
    </main>
  );
}
