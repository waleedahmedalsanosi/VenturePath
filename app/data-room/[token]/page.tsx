import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: Promise<{ token: string }>;
}

function fmtBytes(n: number | null): string {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDate(s: string | null): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

const MIME_ICON: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "image/jpeg": "JPG",
  "image/png": "PNG",
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_data_room", { p_token: token }).limit(1);
  const first = data?.[0];
  if (!first) return { title: "Data Room — VenturePath", robots: { index: false, follow: false } };
  return {
    title: `${first.workspace_name} — Data Room`,
    robots: { index: false, follow: false },
  };
}

export default async function DataRoomPage({ params }: PageProps) {
  const { token } = await params;
  const supabase = await createClient();

  // Fetch data room content via security-definer RPC (no auth required).
  const { data: rows, error } = await supabase.rpc("get_data_room", { p_token: token });

  if (error || !rows || rows.length === 0) notFound();

  // Increment view count (fire and forget).
  supabase.rpc("record_data_room_view", { p_token: token }).then(() => {});

  const first = rows[0]!;
  const docs = rows.filter((r) => r.doc_id !== null);

  return (
    <main className="min-h-screen bg-(--color-surface)">
      <div className="mx-auto max-w-3xl px-6 py-16 space-y-10">
        {/* Header */}
        <header className="space-y-2">
          <p className="text-label-md uppercase text-(--color-on-surface-variant)">
            Data Room
          </p>
          <h1 className="text-display-md font-semibold tracking-tight">
            {first.workspace_name}
          </h1>
          {first.round_name && (
            <p className="text-body-lg text-(--color-on-surface-variant)">
              {first.round_name}{" "}
              {first.round_status && (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-label-sm font-medium uppercase tracking-wider ms-2 ${
                    first.round_status === "open"
                      ? "bg-(--color-info)/15 text-(--color-info)"
                      : "bg-(--color-success)/20 text-(--color-success)"
                  }`}
                >
                  {first.round_status}
                </span>
              )}
            </p>
          )}
        </header>

        {/* Documents */}
        <section className="space-y-3">
          <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
            Documents
          </h2>

          {docs.length === 0 ? (
            <div className="rounded-xl bg-(--color-surface-container-low) px-6 py-10 text-center space-y-2">
              <p className="text-body-lg font-medium">No documents yet.</p>
              <p className="text-body-md text-(--color-on-surface-variant)">
                The company will upload documents to this data room shortly.
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-(--color-surface-container-low) overflow-hidden">
              <table className="w-full text-body-sm">
                <thead>
                  <tr className="text-label-md uppercase text-(--color-on-surface-variant)">
                    <th className="px-4 py-3 text-start font-normal">Document</th>
                    <th className="px-4 py-3 text-start font-normal hidden sm:table-cell">Type</th>
                    <th className="px-4 py-3 text-start font-normal hidden sm:table-cell">Size</th>
                    <th className="px-4 py-3 text-start font-normal hidden sm:table-cell">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((doc) => (
                    <tr key={doc.doc_id} className="border-t border-(--color-outline-variant)/15 align-middle">
                      <td className="px-4 py-3 font-medium">{doc.doc_name}</td>
                      <td className="px-4 py-3 text-(--color-on-surface-variant) hidden sm:table-cell">
                        {MIME_ICON[doc.doc_mime_type ?? ""] ?? "File"}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-(--color-on-surface-variant) hidden sm:table-cell">
                        {fmtBytes(doc.doc_size_bytes)}
                      </td>
                      <td className="px-4 py-3 text-(--color-on-surface-variant) hidden sm:table-cell whitespace-nowrap">
                        {fmtDate(doc.doc_created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-body-sm text-(--color-on-surface-variant)">
            To request access to these files, contact the company directly.
          </p>
        </section>

        {/* Footer */}
        <footer className="pt-6 border-t border-(--color-outline-variant)/20 text-body-sm text-(--color-on-surface-variant)">
          Powered by{" "}
          <a href="/" className="text-(--color-primary) underline">VenturePath</a>
          {" "}— the Sharia-compliant cap table for KSA founders.
        </footer>
      </div>
    </main>
  );
}
