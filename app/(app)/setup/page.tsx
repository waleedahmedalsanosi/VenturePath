import { redirect } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

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

  // First-time setup: redirect to cap-table only if user already has any
  // workspace AND didn't explicitly request a new one.
  const { data: existing } = await supabase
    .from("workspaces")
    .select("id")
    .limit(1)
    .maybeSingle();
  if (existing && !wantsNew) redirect("/cap-table");

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      {wantsNew && (
        <Link
          href="/"
          className="text-body-sm text-(--color-on-surface-variant) underline"
        >
          ← Back
        </Link>
      )}
      <div className="mt-4 mb-10">
        <h1 className="text-display-sm font-semibold tracking-tight">
          {wantsNew ? "Add a new startup" : "Create your startup workspace"}
        </h1>
        <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
          {wantsNew
            ? "A new workspace with its own cap table, vault, and ESOP. You can switch between workspaces from the header."
            : "One workspace per startup. You can add more anytime from the workspace switcher."}
        </p>
      </div>
      <SetupForm />
    </main>
  );
}
