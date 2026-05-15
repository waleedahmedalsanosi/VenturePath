import Link from "next/link";
import { redirect, notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

import { TermSheetForm } from "../../../../term-sheets/term-sheet-form";
import { createTermSheet } from "../../term-sheet-actions";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ contact?: string }>;
}

export default async function NewTermSheetPage({ params, searchParams }: PageProps) {
  const { id: roundId } = await params;
  const { contact } = await searchParams;

  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/setup");

  const supabase = await createClient();

  const { data: round } = await supabase
    .from("financing_rounds")
    .select("id, name, instrument_type, pre_money_valuation_sar, target_raise_sar")
    .eq("id", roundId)
    .eq("workspace_id", workspace.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!round) notFound();

  const { data: contacts } = await supabase
    .from("investor_pipeline")
    .select("id, name, firm, email, ticket_size_sar")
    .eq("round_id", roundId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  type Contact = NonNullable<typeof contacts>[number];
  let preselected: Contact | null = null;
  if (contact && contacts) {
    preselected = contacts.find((c) => c.id === contact) ?? null;
  }

  // Pre-fill investment amount from the round target or preselected contact
  // ticket size, when available.
  const initialAmount = preselected?.ticket_size_sar
    ? String(preselected.ticket_size_sar)
    : "";

  async function action(formData: FormData) {
    "use server";
    return createTermSheet(roundId, formData);
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link
        href={`/rounds/${roundId}`}
        className="text-body-sm text-(--color-on-surface-variant) underline"
      >
        ← Back to {round.name}
      </Link>
      <h1 className="mt-4 text-display-sm font-semibold tracking-tight">
        Draft term sheet
      </h1>
      <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
        Capture the agreed terms with a specific investor before they sign. You
        can revise this draft any number of times — each save bumps the version.
      </p>

      <div className="mt-10">
        <TermSheetForm
          submitLabel="Save draft"
          action={action}
          pipelineContacts={contacts ?? []}
          defaults={{
            instrument_type: round.instrument_type as "isafe" | "safe" | "convertible_note" | "ordinary",
            investor_name: preselected?.name ?? "",
            firm: preselected?.firm ?? "",
            investor_email: preselected?.email ?? "",
            pipeline_contact_id: preselected?.id ?? "",
            terms: {
              investment_sar: initialAmount,
              valuation_cap_sar: round.pre_money_valuation_sar
                ? String(round.pre_money_valuation_sar)
                : "",
            },
          }}
        />
      </div>
    </main>
  );
}
