"use server";

import { createClient } from "@/lib/supabase/server";

export interface ExportResult {
  ok: boolean;
  error?: string;
  csv?: string;
}

interface Filters {
  entity?: string;
  actor?: string;
  since?: string;
  until?: string;
}

// CSV escaping: double-quote any field with comma/quote/newline; escape
// embedded quotes by doubling them. RFC 4180 compliant.
function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = typeof value === "string" ? value : JSON.stringify(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function exportAuditCsv(
  workspaceId: string,
  filters: Filters,
): Promise<ExportResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  let q = supabase
    .from("audit_events")
    .select("*")
    .eq("workspace_id", workspaceId);

  if (filters.entity && filters.entity !== "all") {
    q = q.eq(
      "entity_type",
      filters.entity as "workspace" | "shareholder" | "document" | "compliance_obligation",
    );
  }
  if (filters.actor) {
    q = q.ilike("actor_email", `%${filters.actor}%`);
  }
  if (filters.since) {
    q = q.gte("created_at", `${filters.since}T00:00:00Z`);
  }
  if (filters.until) {
    q = q.lte("created_at", `${filters.until}T23:59:59Z`);
  }

  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "No data." };

  const header = [
    "timestamp_iso",
    "actor_email",
    "entity_type",
    "entity_id",
    "action",
    "description",
    "payload_json",
  ];
  const lines = [header.join(",")];
  for (const e of data) {
    lines.push(
      [
        e.created_at,
        e.actor_email,
        e.entity_type,
        e.entity_id ?? "",
        e.action,
        e.description,
        e.payload === null ? "" : JSON.stringify(e.payload),
      ]
        .map(csvEscape)
        .join(","),
    );
  }

  return { ok: true, csv: lines.join("\r\n") };
}
