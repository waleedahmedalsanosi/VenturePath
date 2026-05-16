import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { LandingPage } from "./landing-page";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Signed-in users skip the marketing page and go straight to /explore.
  // First-time signed-in users without a workspace still see /explore;
  // they can create a workspace later via the sidebar.
  if (user) {
    redirect("/explore");
  }

  return <LandingPage />;
}
