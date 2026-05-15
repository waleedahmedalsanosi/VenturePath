import Link from "next/link";

export function CapTableEmpty({ workspaceName }: { workspaceName: string }) {
  return (
    <section className="py-16">
      <div className="mb-10">
        <p className="text-label-md uppercase text-(--color-on-surface-variant)">
          Your ownership
        </p>
        <p className="mt-2 text-display-lg font-semibold tracking-tight tabular-nums">
          100.0%
        </p>
        <p className="mt-1 text-body-md text-(--color-on-surface-variant)">
          of {workspaceName}
        </p>
      </div>

      <div className="rounded-xl bg-(--color-surface-container-low) p-12 text-center">
        <div className="mx-auto h-48 w-48 rounded-full border-2 border-dashed border-(--color-outline-variant)/40" />
        <h2 className="mt-8 text-headline-md font-medium">
          Your cap table is empty
        </h2>
        <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
          Add your first shareholder to start tracking ownership.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/cap-table/add"
            className="btn-primary-gradient rounded-lg px-6 py-2.5 text-label-lg font-medium"
          >
            Add your first shareholder
          </Link>
        </div>
      </div>
    </section>
  );
}
