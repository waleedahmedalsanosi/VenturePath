import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { listAccessibleWorkspaces } from "@/lib/workspace/active";

import { SetupHeader } from "./setup-header";
import { SetupForm } from "./setup-form";

interface PageProps {
  searchParams: Promise<{ new?: string }>;
}

export default async function SetupPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const wantsNew = params.new === "1";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const owned = await listAccessibleWorkspaces();
  if (owned.length > 0 && !wantsNew) redirect("/dashboard");

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <SetupHeader wantsNew={wantsNew} />
      <SetupForm />
    </main>
  );
}
