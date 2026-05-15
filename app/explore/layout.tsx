import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export default async function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen">
      <header className="border-b border-(--color-outline-variant)/20 px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-headline-sm font-semibold tracking-tight"
          >
            VenturePath
          </Link>
          <nav className="flex items-center gap-4 text-body-sm">
            {user ? (
              <Link
                href="/dashboard"
                className="text-(--color-on-surface-variant) hover:text-(--color-on-surface) transition-colors"
              >
                ← Dashboard
              </Link>
            ) : (
              <>
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
              </>
            )}
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
