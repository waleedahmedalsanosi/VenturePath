import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { listAccessibleWorkspaces } from "@/lib/workspace/active";

import { SettingsView } from "./settings-view";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const [workspaces, profileResult, deletionResult] = await Promise.all([
    listAccessibleWorkspaces(),
    supabase
      .from("user_profiles")
      .select("date_format, timezone")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("account_deletion_requests")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  return (
    <SettingsView
      email={user.email ?? ""}
      createdAt={user.created_at ?? null}
      workspaces={workspaces.map((w) => ({
        id: w.id,
        name: w.name,
        slug: w.slug ?? null,
        isOwner: w.owner_user_id === user.id,
      }))}
      dateFormat={
        (profileResult.data?.date_format as "iso" | "us" | "eu") ?? "iso"
      }
      timezone={profileResult.data?.timezone ?? "Asia/Riyadh"}
      hasPendingDeletion={deletionResult.data?.status === "pending"}
    />
  );
}
