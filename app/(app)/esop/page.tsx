import Link from "next/link";
import { redirect } from "next/navigation";

import { Dec } from "@/lib/cap-table/decimal";
import { DEPARTMENT_LABELS, GRANT_STATUS_LABELS, vestedFraction } from "@/lib/esop/vesting";
import { createClient } from "@/lib/supabase/server";

import { CreatePoolForm } from "./create-pool-form";
import { GrantRow } from "./grant-row";

function fmtShares(n: string | number): string {
  return new Dec(n).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function fmtSAR(n: string | number | null): string {
  if (n === null) return "—";
  return `SAR ${new Dec(n).toFixed(2)}`;
}

function fmtDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function EsopPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name")
    .eq("owner_user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!workspace) redirect("/setup");

  const { data: pool } = await supabase
    .from("esop_pools")
    .select("*")
    .eq("workspace_id", workspace.id)
    .maybeSingle();

  const { data: grants } = pool
    ? await supabase
        .from("esop_grants")
        .select("*")
        .eq("pool_id", pool.id)
        .is("deleted_at", null)
        .order("grant_date", { ascending: false })
    : { data: [] };

  const rows = grants ?? [];

  if (!pool) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-label-md uppercase text-(--color-on-surface-variant)">
          ESOP
        </p>
        <h1 className="mt-1 text-display-sm font-semibold tracking-tight">
          {workspace.name}
        </h1>
        <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
          Create your Employee Stock Option Pool. Reserves a portion of authorised
          shares for employee grants. You can expand the pool later.
        </p>
        <div className="mt-10">
          <CreatePoolForm />
        </div>
      </main>
    );
  }

  // Aggregate pool stats.
  let allocated = new Dec(0);
  let vestedSum = new Dec(0);
  for (const g of rows) {
    const opts = new Dec(g.options_count);
    allocated = allocated.plus(opts);
    vestedSum = vestedSum.plus(opts.mul(vestedFraction(g)));
  }
  const poolSize = new Dec(pool.total_pool_shares);
  const available = poolSize.minus(allocated);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-10">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-label-md uppercase text-(--color-on-surface-variant)">
            ESOP
          </p>
          <h1 className="mt-1 text-display-sm font-semibold tracking-tight">
            {workspace.name}
          </h1>
          <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
            Pool created {fmtDate(pool.pool_creation_date)}.
          </p>
        </div>
        <Link
          href="/esop/grants/add"
          className={
            rows.length === 0
              ? "btn-primary-gradient rounded-lg px-5 py-2 text-label-lg font-medium"
              : "rounded-lg ghost-border px-5 py-2 text-label-lg hover:bg-(--color-surface-container-high)"
          }
        >
          + Add grant
        </Link>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Tile label="Pool size" value={fmtShares(pool.total_pool_shares)} />
        <Tile label="Granted" value={fmtShares(allocated.toFixed(0))} />
        <Tile label="Available" value={fmtShares(available.toFixed(0))} />
        <Tile label="Vested" value={fmtShares(vestedSum.toFixed(0))} />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl bg-(--color-surface-container-low) p-12 text-center">
          <p className="text-body-md text-(--color-on-surface-variant)">
            No grants yet. Add your first employee grant to start tracking.
          </p>
        </div>
      ) : (
        <section>
          <h2 className="text-label-md uppercase text-(--color-on-surface-variant) mb-4">
            Grants
          </h2>
          <div className="rounded-xl bg-(--color-surface-container-low) overflow-hidden">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="text-label-md uppercase text-(--color-on-surface-variant)">
                  <th className="px-4 py-3 text-start font-normal">Employee</th>
                  <th className="px-4 py-3 text-start font-normal">Dept</th>
                  <th className="px-4 py-3 text-end font-normal">Options</th>
                  <th className="px-4 py-3 text-end font-normal">Strike</th>
                  <th className="px-4 py-3 text-start font-normal">Granted</th>
                  <th className="px-4 py-3 text-end font-normal">Vested</th>
                  <th className="px-4 py-3 text-start font-normal">Status</th>
                  <th className="px-4 py-3 text-end font-normal" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {rows.map((g) => {
                  const vestedPct = vestedFraction(g).mul(100);
                  return (
                    <GrantRow
                      key={g.id}
                      id={g.id}
                      employee={g.employee_name}
                      email={g.employee_email}
                      dept={DEPARTMENT_LABELS[g.department]}
                      options={fmtShares(g.options_count)}
                      strike={fmtSAR(g.strike_price_sar)}
                      grantedOn={fmtDate(g.grant_date)}
                      vestedPctLabel={`${vestedPct.toFixed(1)}%`}
                      status={GRANT_STATUS_LABELS[g.status]}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-(--color-surface-container-high) p-4">
      <p className="text-label-md uppercase text-(--color-on-surface-variant)">
        {label}
      </p>
      <p className="mt-2 text-display-sm font-semibold tracking-tight tabular-nums">
        {value}
      </p>
    </div>
  );
}
