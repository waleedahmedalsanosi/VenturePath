import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

import { UploadForm } from "./upload-form";
import { DocumentRow } from "./document-row";
import { CategorySidebar } from "./category-sidebar";

interface PageProps {
  searchParams: Promise<{ category?: string }>;
}

function fmtBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export default async function VaultPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filterCategoryId = params.category ?? null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/setup");

  const { data: categories } = await supabase
    .from("vault_categories")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("sort_order", { ascending: true });

  // Count documents per category for the sidebar.
  const { data: allDocs } = await supabase
    .from("documents")
    .select("id, category_id")
    .eq("workspace_id", workspace.id)
    .is("deleted_at", null);

  const countsByCategory: Record<string, number> = {};
  let uncategorizedCount = 0;
  for (const d of allDocs ?? []) {
    if (d.category_id) {
      countsByCategory[d.category_id] = (countsByCategory[d.category_id] ?? 0) + 1;
    } else {
      uncategorizedCount += 1;
    }
  }

  let docsQuery = supabase
    .from("documents")
    .select("*")
    .eq("workspace_id", workspace.id)
    .is("deleted_at", null);
  if (filterCategoryId === "uncategorized") {
    docsQuery = docsQuery.is("category_id", null);
  } else if (filterCategoryId) {
    docsQuery = docsQuery.eq("category_id", filterCategoryId);
  }
  const { data: documents } = await docsQuery.order("created_at", { ascending: false });

  const rows = documents ?? [];

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 space-y-10">
      <header>
        <p className="text-label-md uppercase text-(--color-on-surface-variant)">
          Document vault
        </p>
        <h1 className="mt-1 text-display-sm font-semibold tracking-tight">
          {workspace.name}
        </h1>
        <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
          PDF, DOCX, XLSX, JPG, PNG. Max 50 MB per file. Categorise documents and
          set per-document visibility — Internal (owner only), Data Room
          (invited investors), Public (anyone).
        </p>
      </header>

      <UploadForm categories={categories ?? []} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1">
          <CategorySidebar
            categories={categories ?? []}
            countsByCategory={countsByCategory}
            uncategorizedCount={uncategorizedCount}
            activeCategoryId={filterCategoryId}
          />
        </aside>

        <section className="lg:col-span-3">
          <h2 className="text-label-md uppercase text-(--color-on-surface-variant) mb-4">
            {rows.length === 0
              ? "No documents in this view"
              : `${rows.length} document${rows.length === 1 ? "" : "s"}`}
          </h2>

          {rows.length === 0 ? (
            <div className="rounded-xl bg-(--color-surface-container-low) p-12 text-center">
              <p className="text-body-md text-(--color-on-surface-variant)">
                Upload documents to populate this category.
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-(--color-surface-container-low) overflow-hidden">
              <table className="w-full text-body-sm">
                <thead>
                  <tr className="text-label-md uppercase text-(--color-on-surface-variant)">
                    <th className="px-4 py-3 text-start font-normal">Name</th>
                    <th className="px-4 py-3 text-start font-normal">Type</th>
                    <th className="px-4 py-3 text-start font-normal">Visibility</th>
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
                      visibility={doc.visibility}
                      sizeLabel={fmtBytes(doc.size_bytes)}
                      createdAt={doc.created_at}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
