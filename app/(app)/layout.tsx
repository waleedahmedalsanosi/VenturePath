import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace, listAccessibleWorkspaces } from "@/lib/workspace/active";

import { AppShell } from "./shell";
import { LanguageToggle } from "./components/language-toggle";
import { NotificationsButton } from "./components/notifications-button";
import { ThemeToggle } from "./components/theme-toggle";
import { UserAvatarMenu } from "./components/user-avatar-menu";
import { WorkspaceSwitcher } from "./components/workspace-switcher";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const active = await getActiveWorkspace();
  const all = await listAccessibleWorkspaces();

  const headerLeft = (
    <>
      {active && all.length > 0 && (
        <WorkspaceSwitcher
          active={{ id: active.id, name: active.name }}
          options={all.map((w) => ({ id: w.id, name: w.name }))}
        />
      )}
    </>
  );

  const headerRight = (
    <div className="flex items-center gap-2">
      <LanguageToggle />
      <ThemeToggle />
      <NotificationsButton />
      <UserAvatarMenu email={user.email ?? ""} />
    </div>
  );

  return (
    <AppShell headerLeft={headerLeft} headerRight={headerRight} hasWorkspace={!!active}>
      {children}
    </AppShell>
  );
}
