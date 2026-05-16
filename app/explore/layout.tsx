import { AppShell } from "@/app/(app)/shell";
import { LanguageToggle } from "@/app/(app)/components/language-toggle";
import { NotificationsButton } from "@/app/(app)/components/notifications-button";
import { ThemeToggle } from "@/app/(app)/components/theme-toggle";
import { UserAvatarMenu } from "@/app/(app)/components/user-avatar-menu";
import { WorkspaceSwitcher } from "@/app/(app)/components/workspace-switcher";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace, listAccessibleWorkspaces } from "@/lib/workspace/active";

import { GuestHeader } from "./layout-client";

export default async function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Logged-in users: render the full app shell (sidebar + header)
  if (user) {
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

  return (
    <div className="min-h-screen">
      <GuestHeader />
      {children}
    </div>
  );
}
