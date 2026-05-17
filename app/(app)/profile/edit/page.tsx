import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { ProfileEditForm } from "./profile-edit-form";

export const dynamic = "force-dynamic";

export default async function ProfileEditPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name, bio, avatar_url, linkedin_url, location")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <ProfileEditForm
      initial={{
        display_name: profile?.display_name ?? "",
        bio: profile?.bio ?? "",
        avatar_url: profile?.avatar_url ?? "",
        linkedin_url: profile?.linkedin_url ?? "",
        location: profile?.location ?? "",
      }}
    />
  );
}
