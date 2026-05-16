import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { listAccessibleWorkspaces } from "@/lib/workspace/active";

import { ProfileView } from "./profile-view";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const workspaces = await listAccessibleWorkspaces();

  return (
    <ProfileView
      email={user.email ?? ""}
      createdAt={user.created_at ?? null}
      userId={user.id}
      workspaces={workspaces.map((w) => ({
        id: w.id,
        name: w.name,
        slug: w.slug ?? null,
        isOwner: w.owner_user_id === user.id,
      }))}
    />
  );
}
