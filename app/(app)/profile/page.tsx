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

  const [workspaces, profileResult] = await Promise.all([
    listAccessibleWorkspaces(),
    supabase
      .from("user_profiles")
      .select("display_name, bio, avatar_url, linkedin_url, location")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const profile = profileResult.data;

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
      displayName={profile?.display_name ?? null}
      bio={profile?.bio ?? null}
      avatarUrl={profile?.avatar_url ?? null}
      linkedinUrl={profile?.linkedin_url ?? null}
      location={profile?.location ?? null}
    />
  );
}
