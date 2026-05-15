import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

import { AcceptButton } from "./accept-button";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function AcceptInvitePage({ params }: PageProps) {
  const { token } = await params;
  const supabase = await createClient();

  // The invitation row is owner-only via RLS. Read it via a service-role
  // path... we don't have a service-role client. Instead, we'll let the user
  // attempt acceptance via the server action, which handles all checks.
  // For UX we still want to show invite details — but RLS blocks anon SELECT.
  // Workaround: read the workspace by joining? Also blocked.
  // Cleanest: show a generic "accept invitation" page and let the action
  // surface specific errors (expired, already accepted, etc).

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Not signed in. Redirect to sign-in with a returnTo back here.
    redirect(`/sign-in?returnTo=/invite/${encodeURIComponent(token)}`);
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-display-sm font-semibold tracking-tight">
        Join workspace
      </h1>
      <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
        You&apos;ve been invited to a VenturePath workspace as a viewer.
        Accept to gain read-only access to the cap table, vault, compliance,
        and metrics.
      </p>
      <div className="mt-8 rounded-xl bg-(--color-surface-container-low) p-6">
        <p className="text-body-sm text-(--color-on-surface-variant) mb-4">
          Signed in as <span className="font-mono">{user.email}</span>
        </p>
        <AcceptButton token={token} />
      </div>
      <div className="mt-6 text-body-sm text-(--color-on-surface-variant)">
        Not the right account?{" "}
        <Link href="/auth/sign-out" className="underline">
          Sign out
        </Link>
        .
      </div>
    </main>
  );
}
