import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { UploadForm } from "./upload-form";
import { DocumentRow } from "./document-row";

function fmtBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export default async function VaultPage() {
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

  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("workspace_id", workspace.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const rows = documents ?? [];

  return (
    <main className="mx-auto max-w-4xl px-6 py-10 space-y-10">
      <header>
        <p className="text-label-md uppercase text-(--color-on-surface-variant)">
          Document vault
        </p>
        <h1 className="mt-1 text-display-sm font-semibold tracking-tight">
          {workspace.name}
        </h1>
        <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
          PDF, DOCX, XLSX, JPG, PNG. Max 50 MB per file. 1 GB total on free
          tier. Files are encrypted at rest by Supabase Storage and visible
          only to the workspace owner.
        </p>
      </header>

      <UploadForm />

      <section>
        <h2 className="text-label-md uppercase text-(--color-on-surface-variant) mb-4">
          {rows.length === 0 ? "No documents yet" : `${rows.length} document${rows.length === 1 ? "" : "s"}`}
        </h2>

        {rows.length === 0 ? (
          <div className="rounded-xl bg-(--color-surface-container-low) p-12 text-center">
            <p className="text-body-md text-(--color-on-surface-variant)">
              Upload a document to start your vault. Incorporation papers, SHAs,
              iSAFE term sheets — anything you want one place for.
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-(--color-surface-container-low) overflow-hidden">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="text-label-md uppercase text-(--color-on-surface-variant)">
                  <th className="px-4 py-3 text-start font-normal">Name</th>
                  <th className="px-4 py-3 text-start font-normal">Type</th>
                  <th className="px-4 py-3 text-end font-normal">Size</th>
                  <th className="px-4 py-3 text-end font-normal">Uploaded</th>
                  <th className="px-4 py-3 text-end font-normal" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {rows.map((doc) => (
                  <DocumentRow
                    key={doc.id}
                    id={doc.id}
                    name={doc.name}
                    mimeType={doc.mime_type}
                    sizeLabel={fmtBytes(doc.size_bytes)}
                    createdAt={doc.created_at}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
