import Link from "next/link";

import { AppShell } from "@/app/(app)/shell";
import { LanguageToggle } from "@/app/(app)/components/language-toggle";
import { ThemeToggle } from "@/app/(app)/components/theme-toggle";
import { WorkspaceSwitcher } from "@/app/(app)/components/workspace-switcher";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace, listAccessibleWorkspaces } from "@/lib/workspace/active";

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
      <AppShell headerLeft={headerLeft} headerRight={headerRight} hasWorkspace={!!active}>
        {children}
      </AppShell>
    );
  }

  // Guests: simple public header
  return (
    <div className="min-h-screen">
      <header className="px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-headline-sm font-semibold tracking-tight"
          >
            VenturePath
          </Link>
          <nav className="flex items-center gap-4 text-body-sm">
            <Link
              href="/sign-in"
              className="text-(--color-on-surface-variant) hover:text-(--color-on-surface) transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="btn-primary-gradient rounded-lg px-4 py-1.5 text-label-lg font-medium"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
