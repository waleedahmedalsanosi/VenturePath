"use client";

import { useState, useTransition } from "react";

import { addPipelineContact, updatePipelineStatus, deletePipelineContact } from "./crm-actions";

const STATUSES = [
  { value: "prospect",      label: "Prospect",      color: "bg-(--color-surface-bright) text-(--color-on-surface-variant)" },
  { value: "contacted",     label: "Contacted",     color: "bg-(--color-info)/10 text-(--color-info)" },
  { value: "in_discussion", label: "In discussion", color: "bg-(--color-primary)/10 text-(--color-primary)" },
  { value: "term_sheet",    label: "Term sheet",    color: "bg-(--color-warning)/15 text-(--color-warning)" },
  { value: "passed",        label: "Passed",        color: "bg-(--color-surface-bright) text-(--color-on-surface-disabled)" },
  { value: "invested",      label: "Invested",      color: "bg-(--color-success)/15 text-(--color-success)" },
] as const;

type Status = typeof STATUSES[number]["value"];

interface Contact {
  id: string;
  name: string;
  email: string | null;
  firm: string | null;
  status: Status;
  notes: string | null;
  last_contacted_at: string | null;
}

interface CrmProps {
  roundId: string;
  contacts: Contact[];
}

export function InvestorCrm({ roundId, contacts }: CrmProps) {
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function statusStyle(s: Status) {
    return STATUSES.find((x) => x.value === s)?.color ?? "";
  }
  function statusLabel(s: Status) {
    return STATUSES.find((x) => x.value === s)?.label ?? s;
  }

  function handleAddSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await addPipelineContact(roundId, fd);
      if (!result.ok) setFormError(result.error ?? "Failed.");
      else { setShowForm(false); (e.target as HTMLFormElement).reset(); }
    });
  }

  function handleStatusChange(contactId: string, status: "prospect" | "contacted" | "in_discussion" | "term_sheet" | "passed" | "invested") {
    startTransition(async () => {
      await updatePipelineStatus(contactId, roundId, status);
    });
  }

  function handleDelete(contactId: string) {
    if (!confirm("Remove this contact?")) return;
    startTransition(async () => {
      await deletePipelineContact(contactId, roundId);
    });
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
          Investor pipeline
        </h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg ghost-border px-4 py-2 text-label-sm hover:bg-(--color-surface-container-high)"
        >
          {showForm ? "Cancel" : "+ Add contact"}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form
          onSubmit={handleAddSubmit}
          className="rounded-xl bg-(--color-surface-container-low) p-5 grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <div className="space-y-1.5">
            <label className="text-label-lg" htmlFor="pip-name">Name *</label>
            <input id="pip-name" name="name" required placeholder="Sarah Al-Hassan"
              className="w-full rounded-lg bg-(--color-surface-container-high) px-3 py-2 text-body-md ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary)/40" />
          </div>
          <div className="space-y-1.5">
            <label className="text-label-lg" htmlFor="pip-firm">Firm</label>
            <input id="pip-firm" name="firm" placeholder="Sanabil Investments"
              className="w-full rounded-lg bg-(--color-surface-container-high) px-3 py-2 text-body-md ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary)/40" />
          </div>
          <div className="space-y-1.5">
            <label className="text-label-lg" htmlFor="pip-email">Email</label>
            <input id="pip-email" name="email" type="email" placeholder="sarah@vc.com"
              className="w-full rounded-lg bg-(--color-surface-container-high) px-3 py-2 text-body-md ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary)/40" />
          </div>
          <div className="space-y-1.5">
            <label className="text-label-lg" htmlFor="pip-status">Status</label>
            <select id="pip-status" name="status"
              className="w-full rounded-lg bg-(--color-surface-container-high) px-3 py-2 text-body-md ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary)/40">
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-label-lg" htmlFor="pip-last">Last contacted</label>
            <input id="pip-last" name="last_contacted_at" type="date"
              className="w-full rounded-lg bg-(--color-surface-container-high) px-3 py-2 text-body-md ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary)/40" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-label-lg" htmlFor="pip-notes">Notes</label>
            <textarea id="pip-notes" name="notes" rows={2} placeholder="Meeting notes, follow-up items…"
              className="w-full rounded-lg bg-(--color-surface-container-high) px-3 py-2 text-body-md ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary)/40 resize-none" />
          </div>
          {formError && (
            <p className="sm:col-span-2 rounded-md bg-(--color-error)/10 px-3 py-2 text-body-sm text-(--color-error)">{formError}</p>
          )}
          <div className="sm:col-span-2">
            <button type="submit" disabled={isPending}
              className="rounded-lg bg-(--color-primary)/15 px-5 py-2 text-label-lg text-(--color-primary) hover:bg-(--color-primary)/25 transition-colors disabled:opacity-50">
              {isPending ? "Adding…" : "Add contact"}
            </button>
          </div>
        </form>
      )}

      {/* Pipeline table */}
      {contacts.length === 0 && !showForm ? (
        <div className="rounded-xl bg-(--color-surface-container-low) px-6 py-8 text-center">
          <p className="text-body-md text-(--color-on-surface-variant)">
            No investors tracked yet. Add contacts to manage your pipeline.
          </p>
        </div>
      ) : contacts.length > 0 ? (
        <div className="rounded-xl bg-(--color-surface-container-low) overflow-hidden">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="text-label-md uppercase text-(--color-on-surface-variant)">
                <th className="px-4 py-3 text-start font-normal">Investor</th>
                <th className="px-4 py-3 text-start font-normal">Status</th>
                <th className="px-4 py-3 text-start font-normal hidden sm:table-cell">Last contact</th>
                <th className="px-4 py-3 text-end font-normal" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id} className="border-t border-(--color-outline-variant)/15 align-middle group">
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.name}</div>
                    {c.firm && <div className="text-body-sm text-(--color-on-surface-variant)">{c.firm}</div>}
                    {c.email && <div className="text-body-sm text-(--color-on-surface-variant)">{c.email}</div>}
                    {c.notes && <div className="text-body-sm text-(--color-on-surface-variant) mt-1 line-clamp-2 italic">{c.notes}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={c.status}
                      onChange={(e) => handleStatusChange(c.id, e.target.value as "prospect" | "contacted" | "in_discussion" | "term_sheet" | "passed" | "invested")}
                      disabled={isPending}
                      className={`rounded-full px-2.5 py-0.5 text-label-sm font-medium uppercase tracking-wider cursor-pointer appearance-none ${statusStyle(c.status)}`}
                    >
                      {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-(--color-on-surface-variant) hidden sm:table-cell whitespace-nowrap">
                    {c.last_contacted_at
                      ? new Date(c.last_contacted_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-end">
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      disabled={isPending}
                      className="text-body-sm text-(--color-on-surface-variant) hover:text-(--color-error) opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
