"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export interface ProfileUpdateInput {
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  linkedin_url: string | null;
  location: string | null;
}

export async function upsertUserProfile(
  input: ProfileUpdateInput,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };

  // Enforce 500-char bio limit server-side.
  const bio =
    typeof input.bio === "string" && input.bio.length > 500
      ? input.bio.slice(0, 500)
      : input.bio;

  const { error } = await supabase.from("user_profiles").upsert(
    {
      user_id: user.id,
      display_name: input.display_name ?? null,
      bio: bio ?? null,
      avatar_url: input.avatar_url ?? null,
      linkedin_url: input.linkedin_url ?? null,
      location: input.location ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) return { error: error.message };

  revalidatePath("/profile");
  return { error: null };
}
