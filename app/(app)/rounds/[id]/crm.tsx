"use client";

import { useState, useTransition } from "react";

import {
  addPipelineContact,
  updatePipelineContact,
  updatePipelineStatus,
  deletePipelineContact,
} from "./crm-actions";

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
  ticket_size_sar: number | null;
  is_hot: boolean;
}

interface CrmProps {
  roundId: string;
  contacts: Contact[];
  targetRaiseSar: number | null;
}

const INPUT =
  "w-full rounded-lg bg-(--color-surface-container-high) px-3 py-2 text-body-md ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary)/40";

function fmtSar(n: number | null | undefined) {
  if (n == null) return null;
  if (n >= 1_000_000) return `SAR ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `SAR ${(n / 1_000).toFixed(0)}K`;
  return `SAR ${n.toLocaleString()}`;
}

function ContactForm({
  defaultValues,
  isPending,
  submitLabel,
  onSubmit,
  onCancel,
  error,
}: {
  defaultValues?: Partial<Contact>;
  isPending: boolean;
  submitLabel: string;
  onSubmit: (fd: FormData) => void;
  onCancel: () => void;
  error: string | null;
}) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit(new FormData(e.currentTarget));
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl bg-(--color-surface-container-low) p-5 grid grid-cols-1 gap-4 sm:grid-cols-2"
    >
      <div className="space-y-1.5">
        <label className="text-label-lg">Name *</label>
        <input name="name" required placeholder="Sarah Al-Hassan" defaultValue={defaultValues?.name ?? ""}
          className={INPUT} />
      </div>
      <div className="space-y-1.5">
        <label className="text-label-lg">Firm</label>
        <input name="firm" placeholder="Sanabil Investments" defaultValue={defaultValues?.firm ?? ""}
          className={INPUT} />
      </div>
      <div className="space-y-1.5">
        <label className="text-label-lg">Email</label>
        <input name="email" type="email" placeholder="sarah@vc.com" defaultValue={defaultValues?.email ?? ""}
          className={INPUT} />
      </div>
      <div className="space-y-1.5">
        <label className="text-label-lg">Status</label>
        <select name="status" defaultValue={defaultValues?.status ?? "prospect"} className={INPUT}>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="text-label-lg">Ticket size (SAR)</label>
        <input name="ticket_size_sar" type="text" inputMode="decimal"
          placeholder="e.g. 500000"
          defaultValue={defaultValues?.ticket_size_sar ?? ""}
          className={`${INPUT} tabular-nums`} />
      </div>
      <div className="space-y-1.5">
        <label className="text-label-lg">Last contacted</label>
        <input name="last_contacted_at" type="date"
          defaultValue={defaultValues?.last_contacted_at?.slice(0, 10) ?? ""}
          className={INPUT} />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <label className="text-label-lg">Notes</label>
        <textarea name="notes" rows={2} placeholder="Meeting notes, follow-up items…"
          defaultValue={defaultValues?.notes ?? ""}
          className={`${INPUT} resize-none`} />
      </div>
      <div className="sm:col-span-2">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" name="is_hot" defaultChecked={defaultValues?.is_hot ?? false}
            className="h-4 w-4 accent-(--color-warning)" />
          <span className="text-label-lg">Hot lead — flag this investor as high priority</span>
        </label>
      </div>
      {error && (
        <p className="sm:col-span-2 rounded-md bg-(--color-error)/10 px-3 py-2 text-body-sm text-(--color-error)">{error}</p>
      )}
      <div className="sm:col-span-2 flex gap-3">
        <button type="submit" disabled={isPending}
          className="rounded-lg bg-(--color-primary)/15 px-5 py-2 text-label-lg text-(--color-primary) hover:bg-(--color-primary)/25 transition-colors disabled:opacity-50">
          {isPending ? "Saving…" : submitLabel}
        </button>
        <button type="button" onClick={onCancel}
          className="rounded-lg px-4 py-2 text-label-lg text-(--color-on-surface-variant) hover:bg-(--color-surface-container-high) transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

export function InvestorCrm({ roundId, contacts, targetRaiseSar }: CrmProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Pipeline summary numbers
  const withTicket = contacts.filter((c) => c.ticket_size_sar != null && c.status !== "passed");
  const softCommitted = withTicket
    .filter((c) => c.status === "term_sheet")
    .reduce((sum, c) => sum + (c.ticket_size_sar ?? 0), 0);
  const hardCommitted = withTicket
    .filter((c) => c.status === "invested")
    .reduce((sum, c) => sum + (c.ticket_size_sar ?? 0), 0);
  const totalCommitted = softCommitted + hardCommitted;
  const progressPct =
    targetRaiseSar && targetRaiseSar > 0
      ? Math.min(100, (totalCommitted / targetRaiseSar) * 100)
      : null;

  function statusStyle(s: Status) {
    return STATUSES.find((x) => x.value === s)?.color ?? "";
  }

  function handleAddSubmit(fd: FormData) {
    setAddError(null);
    startTransition(async () => {
      const result = await addPipelineContact(roundId, fd);
      if (!result.ok) setAddError(result.error ?? "Failed.");
      else setShowAddForm(false);
    });
  }

  function handleEditSubmit(contactId: string, fd: FormData) {
    setEditError(null);
    startTransition(async () => {
      const result = await updatePipelineContact(contactId, roundId, fd);
      if (!result.ok) setEditError(result.error ?? "Failed.");
      else setEditingId(null);
    });
  }

  function handleStatusChange(contactId: string, status: Status) {
    startTransition(async () => {
      await updatePipelineStatus(contactId, roundId, status);
    });
  }

  function handleDelete(contactId: string) {
    if (!confirm("Remove this contact from the pipeline?")) return;
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
          onClick={() => { setShowAddForm((v) => !v); setAddError(null); }}
          className="rounded-lg ghost-border px-4 py-2 text-label-sm hover:bg-(--color-surface-container-high)"
        >
          {showAddForm ? "Cancel" : "+ Add contact"}
        </button>
      </div>

      {/* Committed summary + progress bar */}
      {contacts.length > 0 && (
        <div className="rounded-xl bg-(--color-surface-container-low) px-5 py-4 space-y-3">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-body-sm">
            {hardCommitted > 0 && (
              <span>
                <span className="text-(--color-on-surface-variant)">Invested </span>
                <span className="font-medium tabular-nums text-(--color-success)">{fmtSar(hardCommitted)}</span>
              </span>
            )}
            {softCommitted > 0 && (
              <span>
                <span className="text-(--color-on-surface-variant)">Term sheet </span>
                <span className="font-medium tabular-nums text-(--color-warning)">{fmtSar(softCommitted)}</span>
              </span>
            )}
            {totalCommitted === 0 && (
              <span className="text-(--color-on-surface-variant)">No ticket sizes recorded yet</span>
            )}
            {targetRaiseSar && totalCommitted > 0 && (
              <span className="text-(--color-on-surface-variant)">
                vs target {fmtSar(targetRaiseSar)}
              </span>
            )}
          </div>
          {progressPct !== null && (
            <div className="h-1.5 w-full rounded-full bg-(--color-outline-variant)/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-(--color-success) transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <ContactForm
          isPending={isPending}
          submitLabel="Add contact"
          onSubmit={handleAddSubmit}
          onCancel={() => { setShowAddForm(false); setAddError(null); }}
          error={addError}
        />
      )}

      {/* Pipeline table */}
      {contacts.length === 0 && !showAddForm ? (
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
                <th className="px-4 py-3 text-start font-normal hidden md:table-cell">Ticket</th>
                <th className="px-4 py-3 text-start font-normal hidden sm:table-cell">Last contact</th>
                <th className="px-4 py-3 text-end font-normal" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <>
                  <tr key={c.id} className="border-t border-(--color-outline-variant)/15 align-middle group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {c.is_hot && (
                          <span title="Hot lead" aria-label="Hot lead" className="text-base leading-none">🔥</span>
                        )}
                        <span className="font-medium">{c.name}</span>
                      </div>
                      {c.firm && <div className="text-body-sm text-(--color-on-surface-variant)">{c.firm}</div>}
                      {c.email && <div className="text-body-sm text-(--color-on-surface-variant)">{c.email}</div>}
                      {c.notes && (
                        <div className="text-body-sm text-(--color-on-surface-variant) mt-1 line-clamp-2 italic">
                          {c.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={c.status}
                        onChange={(e) => handleStatusChange(c.id, e.target.value as Status)}
                        disabled={isPending}
                        className={`rounded-full px-2.5 py-0.5 text-label-sm font-medium uppercase tracking-wider cursor-pointer appearance-none ${statusStyle(c.status)}`}
                      >
                        {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-(--color-on-surface-variant) hidden md:table-cell whitespace-nowrap">
                      {fmtSar(c.ticket_size_sar) ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-(--color-on-surface-variant) hidden sm:table-cell whitespace-nowrap">
                      {c.last_contacted_at
                        ? new Date(c.last_contacted_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(editingId === c.id ? null : c.id);
                            setEditError(null);
                          }}
                          disabled={isPending}
                          className="text-body-sm text-(--color-on-surface-variant) hover:text-(--color-primary)"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id)}
                          disabled={isPending}
                          className="text-body-sm text-(--color-on-surface-variant) hover:text-(--color-error)"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                  {editingId === c.id && (
                    <tr key={`${c.id}-edit`} className="border-t border-(--color-outline-variant)/15">
                      <td colSpan={5} className="px-4 py-4">
                        <ContactForm
                          defaultValues={c}
                          isPending={isPending}
                          submitLabel="Save changes"
                          onSubmit={(fd) => handleEditSubmit(c.id, fd)}
                          onCancel={() => { setEditingId(null); setEditError(null); }}
                          error={editError}
                        />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
