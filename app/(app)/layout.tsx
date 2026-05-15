import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace, listAccessibleWorkspaces } from "@/lib/workspace/active";

import { AppShell } from "./shell";
import { LanguageToggle } from "./components/language-toggle";
import { ThemeToggle } from "./components/theme-toggle";
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
    <div className="flex items-center gap-3 text-body-sm text-(--color-on-surface-variant)">
      <LanguageToggle />
      <span className="text-(--color-outline-variant)" aria-hidden>·</span>
      <ThemeToggle />
      <span className="text-(--color-outline-variant)" aria-hidden>·</span>
      <span className="font-mono hidden sm:inline">{user.email}</span>
      <form action="/auth/sign-out" method="post">
        <button
          type="submit"
          className="underline hover:text-(--color-on-surface)"
        >
          Sign out
        </button>
      </form>
    </div>
  );

  return (
    <AppShell headerLeft={headerLeft} headerRight={headerRight}>
      {children}
    </AppShell>
  );
}
