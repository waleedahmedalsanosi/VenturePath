import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { SettingsView } from "./settings-view";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  return (
    <SettingsView email={user.email ?? ""} createdAt={user.created_at ?? null} />
  );
}
