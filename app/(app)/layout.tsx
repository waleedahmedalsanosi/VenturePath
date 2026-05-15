import { redirect } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

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

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-(--color-outline-variant)/20 px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <Link href="/" className="text-headline-sm font-semibold tracking-tight">
            VenturePath
          </Link>
          <div className="flex items-center gap-4 text-body-sm text-(--color-on-surface-variant)">
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
