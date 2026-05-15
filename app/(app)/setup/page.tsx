import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { SetupForm } from "./setup-form";

export default async function SetupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  // If they already have a workspace, skip setup.
  const { data: existing } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (existing) redirect("/cap-table");

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <div className="mb-10">
        <h1 className="text-display-sm font-semibold tracking-tight">
          Create your startup workspace
        </h1>
        <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
          One workspace per user in the prototype. You can add shareholders next.
        </p>
      </div>
      <SetupForm />
    </main>
  );
}
