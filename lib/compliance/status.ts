/**
 * Compliance status — computed from due_date and completed_at.
 * Never stored in the DB (per migration comment).
 */

import type { Database } from "@/lib/supabase/types";

export type ComplianceStatus = "complete" | "overdue" | "due_soon" | "upcoming";

type ObligationRow = Database["public"]["Tables"]["compliance_obligations"]["Row"];

/** Threshold for "due soon" badge — within 30 days of due date. */
export const DUE_SOON_DAYS = 30;

export function computeStatus(
  row: Pick<ObligationRow, "due_date" | "completed_at">,
  now: Date = new Date(),
): ComplianceStatus {
  if (row.completed_at !== null) return "complete";

  const due = new Date(`${row.due_date}T00:00:00Z`);
  const msPerDay = 86_400_000;
  const daysUntil = Math.floor((due.getTime() - now.getTime()) / msPerDay);

  if (daysUntil < 0) return "overdue";
  if (daysUntil <= DUE_SOON_DAYS) return "due_soon";
  return "upcoming";
}

/** Compute the next due date for a recurring obligation. */
export function nextDueDate(
  current: string,
  recurrence: Database["public"]["Enums"]["compliance_recurrence"],
): string | null {
  if (recurrence === "one_time") return null;

  const d = new Date(`${current}T00:00:00Z`);
  switch (recurrence) {
    case "monthly":
      d.setUTCMonth(d.getUTCMonth() + 1);
      break;
    case "quarterly":
      d.setUTCMonth(d.getUTCMonth() + 3);
      break;
    case "annual":
      d.setUTCFullYear(d.getUTCFullYear() + 1);
      break;
  }
  return d.toISOString().slice(0, 10);
}

export const CATEGORY_LABELS: Record<
  Database["public"]["Enums"]["compliance_category"],
  string
> = {
  tax: "Tax",
  commercial: "Commercial",
  regulatory: "Regulatory",
  administrative: "Administrative",
};

export const RECURRENCE_LABELS: Record<
  Database["public"]["Enums"]["compliance_recurrence"],
  string
> = {
  one_time: "One-time",
  monthly: "Monthly",
  quarterly: "Quarterly",
  annual: "Annual",
};

export const STATUS_LABELS: Record<ComplianceStatus, string> = {
  complete: "Complete",
  overdue: "Overdue",
  due_soon: "Due soon",
  upcoming: "Upcoming",
};
