import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(
    /^https:\/\/([^.]+)\./,
  )?.[1];

  return (
    <main className="mx-auto max-w-2xl px-6 py-24 font-sans">
      <h1 className="text-4xl font-semibold tracking-tight">VenturePath</h1>
      <p className="mt-3 text-lg text-zinc-500">
        The Kinetic Sovereign cap table — prototype.
      </p>

      <section className="mt-12 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
          Supabase connection
        </h2>
        <p className="mt-2 font-mono text-sm">Project: {projectRef ?? "missing"}</p>
        <p className="mt-1 font-mono text-sm">
          Session: {user ? `signed in as ${user.email}` : "anonymous"}
        </p>
      </section>

      <section className="mt-8 text-sm text-zinc-500">
        <p>
          Next:{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-800">
            lib/cap-table/isafe-math.ts
          </code>{" "}
          and the cap-table screen per{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-800">
            cap-table-overview-design.md
          </code>
          .
        </p>
      </section>
    </main>
  );
}
