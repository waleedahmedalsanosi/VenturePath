import { redirect } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace, listAccessibleWorkspaces } from "@/lib/workspace/active";

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

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-(--color-outline-variant)/20 px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-headline-sm font-semibold tracking-tight">
              VenturePath
            </Link>
            {active && all.length > 0 && (
              <WorkspaceSwitcher
                active={{ id: active.id, name: active.name }}
                options={all.map((w) => ({ id: w.id, name: w.name }))}
              />
            )}
            <nav className="flex items-center gap-4 text-body-sm">
              <Link
                href="/dashboard"
                className="text-(--color-on-surface-variant) hover:text-(--color-on-surface)"
              >
                Dashboard
              </Link>
              <Link
                href="/company"
                className="text-(--color-on-surface-variant) hover:text-(--color-on-surface)"
              >
                Company
              </Link>
              <Link
                href="/cap-table"
                className="text-(--color-on-surface-variant) hover:text-(--color-on-surface)"
              >
                Cap table
              </Link>
              <Link
                href="/esop"
                className="text-(--color-on-surface-variant) hover:text-(--color-on-surface)"
              >
                ESOP
              </Link>
              <Link
                href="/dilution"
                className="text-(--color-on-surface-variant) hover:text-(--color-on-surface)"
              >
                Dilution
              </Link>
              <Link
                href="/waterfall"
                className="text-(--color-on-surface-variant) hover:text-(--color-on-surface)"
              >
                Waterfall
              </Link>
              <Link
                href="/acquisition"
                className="text-(--color-on-surface-variant) hover:text-(--color-on-surface)"
              >
                M&amp;A
              </Link>
              <Link
                href="/valuation"
                className="text-(--color-on-surface-variant) hover:text-(--color-on-surface)"
              >
                Valuation
              </Link>
              <Link
                href="/vault"
                className="text-(--color-on-surface-variant) hover:text-(--color-on-surface)"
              >
                Vault
              </Link>
              <Link
                href="/compliance"
                className="text-(--color-on-surface-variant) hover:text-(--color-on-surface)"
              >
                Compliance
              </Link>
              <Link
                href="/governance"
                className="text-(--color-on-surface-variant) hover:text-(--color-on-surface)"
              >
                Governance
              </Link>
              <Link
                href="/traction"
                className="text-(--color-on-surface-variant) hover:text-(--color-on-surface)"
              >
                Traction
              </Link>
              <Link
                href="/audit"
                className="text-(--color-on-surface-variant) hover:text-(--color-on-surface)"
              >
                Audit
              </Link>
              <Link
                href="/members"
                className="text-(--color-on-surface-variant) hover:text-(--color-on-surface)"
              >
                Members
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-body-sm text-(--color-on-surface-variant)">
            <LanguageToggle />
            <span className="text-(--color-outline-variant)" aria-hidden>·</span>
            <ThemeToggle />
            <span className="text-(--color-outline-variant)" aria-hidden>·</span>
            <span className="font-mono">{user.email}</span>
            <form action="/auth/sign-out" method="post">
              <button
                type="submit"
                className="underline hover:text-(--color-on-surface)"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
