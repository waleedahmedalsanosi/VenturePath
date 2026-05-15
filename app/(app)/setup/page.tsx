import { redirect } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { listAccessibleWorkspaces } from "@/lib/workspace/active";

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

  // Redirect to dashboard only if the user already owns/is-a-member-of a
  // workspace and didn't explicitly ask to add a new one. We use
  // listAccessibleWorkspaces (owner-or-member filter) instead of a raw query
  // so that public demo profiles don't count as "existing" workspaces.
  const owned = await listAccessibleWorkspaces();
  if (owned.length > 0 && !wantsNew) redirect("/dashboard");

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
