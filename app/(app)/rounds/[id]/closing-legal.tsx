"use client";

import { useRef, useState, useTransition } from "react";

import {
  addClosingItem,
  setClosingItemStatus,
  updateClosingItemNotes,
  deleteClosingItem,
} from "./closing-actions";

type Category =
  | "kyc_aml"
  | "subscription_agreement"
  | "wire_confirmation"
  | "share_certificate"
  | "board_approval"
  | "other";

type ItemStatus = "pending" | "in_progress" | "complete" | "waived";

interface ClosingItem {
  id: string;
  category: Category;
  title: string;
  status: ItemStatus;
  notes: string | null;
  completed_at: string | null;
  due_date: string | null;
  pipeline_contact_id: string | null;
}

interface PipelineContact {
  id: string;
  name: string;
  firm: string | null;
}

interface ClosingLegalProps {
  roundId: string;
  items: ClosingItem[];
  pipelineContacts: PipelineContact[];
  canEdit: boolean;
}

const CATEGORY_META: Record<Category, { label: string; icon: string }> = {
  kyc_aml:                { label: "KYC / AML",              icon: "🪪" },
  subscription_agreement: { label: "Subscription Agreement",  icon: "📄" },
  wire_confirmation:      { label: "Wire Confirmation",       icon: "💸" },
  share_certificate:      { label: "Share Certificate",       icon: "📜" },
  board_approval:         { label: "Board Approval",          icon: "🏛" },
  other:                  { label: "Other",                   icon: "📌" },
};

const STATUS_META: Record<ItemStatus, { label: string; bg: string; fg: string; dot: string }> = {
  pending:     { label: "Pending",     bg: "bg-(--color-surface-bright)",  fg: "text-(--color-on-surface-variant)", dot: "bg-(--color-on-surface-disabled)" },
  in_progress: { label: "In progress", bg: "bg-(--color-info)/10",          fg: "text-(--color-info)",               dot: "bg-(--color-info)" },
  complete:    { label: "Complete",    bg: "bg-(--color-success)/15",       fg: "text-(--color-success)",            dot: "bg-(--color-success)" },
  waived:      { label: "Waived",      bg: "bg-(--color-surface-bright)",   fg: "text-(--color-on-surface-disabled)", dot: "bg-(--color-outline-variant)" },
};

const STATUS_CYCLE: ItemStatus[] = ["pending", "in_progress", "complete", "waived"];

const DEFAULT_ITEMS: { category: Category; title: string }[] = [
  { category: "kyc_aml",                title: "KYC / AML verification" },
  { category: "subscription_agreement", title: "Subscription agreement signed" },
  { category: "wire_confirmation",       title: "Wire / transfer confirmed" },
  { category: "share_certificate",       title: "Share certificate issued" },
  { category: "board_approval",          title: "Board resolution approved" },
];

function fmtDate(s: string | null): string {
  if (!s) return "";
  return new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function ContactLabel({ contactId, contacts }: { contactId: string | null; contacts: PipelineContact[] }) {
  if (!contactId) return null;
  const c = contacts.find((x) => x.id === contactId);
  if (!c) return null;
  return (
    <span className="text-body-sm text-(--color-on-surface-variant)">
      {c.name}{c.firm ? ` · ${c.firm}` : ""}
    </span>
  );
}

function ItemRow({
  item,
  roundId,
  contacts,
  canEdit,
}: {
  item: ClosingItem;
  roundId: string;
  contacts: PipelineContact[];
  canEdit: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [showNotes, setShowNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(item.notes ?? "");
  const [noteSaved, setNoteSaved] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const meta = STATUS_META[item.status];
  const cat = CATEGORY_META[item.category];

  function cycleStatus() {
    if (!canEdit) return;
    const idx = STATUS_CYCLE.indexOf(item.status);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    startTransition(async () => {
      await setClosingItemStatus(item.id, roundId, next);
    });
  }

  function saveNotes() {
    startTransition(async () => {
      await updateClosingItemNotes(item.id, roundId, notesValue);
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 1500);
    });
  }

  function onDelete() {
    if (!confirm("Delete this closing item?")) return;
    startTransition(async () => {
      await deleteClosingItem(item.id, roundId);
    });
  }

  return (
    <li className={`border-t border-(--color-outline-variant)/15 ${isPending ? "opacity-50" : ""}`}>
      <div className="flex items-start gap-3 px-4 py-3">
        {/* Status toggle circle */}
        <button
          type="button"
          onClick={cycleStatus}
          disabled={!canEdit || isPending}
          title={`Status: ${meta.label} — click to advance`}
          className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
            item.status === "complete"
              ? "bg-(--color-success) border-(--color-success)"
              : item.status === "in_progress"
              ? "border-(--color-info) bg-(--color-info)/10"
              : item.status === "waived"
              ? "border-(--color-outline-variant) bg-(--color-outline-variant)/30"
              : "border-(--color-outline-variant) bg-transparent"
          } ${canEdit ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
        >
          {item.status === "complete" && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {item.status === "waived" && (
            <svg className="w-3 h-3 text-(--color-outline-variant)" fill="none" viewBox="0 0 12 12">
              <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-body-sm font-medium">{item.title}</span>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-label-sm font-medium uppercase tracking-wider ${meta.bg} ${meta.fg}`}>
              {meta.label}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-3 flex-wrap">
            <span className="text-body-sm text-(--color-on-surface-variant)">{cat.icon} {cat.label}</span>
            <ContactLabel contactId={item.pipeline_contact_id} contacts={contacts} />
            {item.due_date && (
              <span className="text-body-sm text-(--color-on-surface-variant)">
                Due {fmtDate(item.due_date)}
              </span>
            )}
            {item.completed_at && item.status === "complete" && (
              <span className="text-body-sm text-(--color-success)">
                Done {fmtDate(item.completed_at)}
              </span>
            )}
          </div>
          {item.notes && !showNotes && (
            <p className="mt-1 text-body-sm text-(--color-on-surface-variant) line-clamp-1">{item.notes}</p>
          )}
          {showNotes && (
            <div className="mt-2 space-y-1">
              <textarea
                ref={notesRef}
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                rows={3}
                placeholder="Add notes…"
                className="w-full rounded-lg border border-(--color-outline-variant) bg-(--color-surface-container-high) px-3 py-2 text-body-sm focus:outline-none focus:ring-2 focus:ring-(--color-primary)/40 resize-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveNotes}
                  disabled={isPending}
                  className="rounded-lg bg-(--color-primary)/15 px-3 py-1 text-label-sm text-(--color-primary) hover:bg-(--color-primary)/25 disabled:opacity-50"
                >
                  {noteSaved ? "Saved!" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNotes(false)}
                  className="text-label-sm text-(--color-on-surface-variant) px-2 py-1 hover:underline"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {canEdit && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => { setShowNotes((v) => !v); setTimeout(() => notesRef.current?.focus(), 50); }}
              className="rounded px-2 py-1 text-body-sm text-(--color-on-surface-variant) hover:bg-(--color-surface-container-high)"
              title="Notes"
            >
              {item.notes ? "✏️" : "📝"}
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={isPending}
              className="rounded px-2 py-1 text-body-sm text-(--color-on-surface-variant) hover:text-(--color-error) disabled:opacity-50"
              title="Delete"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

function AddItemForm({
  roundId,
  contacts,
  onDone,
}: {
  roundId: string;
  contacts: PipelineContact[];
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await addClosingItem(roundId, formData);
      if (!result.ok) { setError(result.error ?? "Failed."); return; }
      formRef.current?.reset();
      onDone();
    });
  }

  return (
    <form ref={formRef} action={submit} className="mt-4 rounded-xl border border-(--color-outline-variant)/40 p-4 space-y-3">
      <p className="text-label-md font-medium">Add closing item</p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="col-span-2">
          <label className="text-label-sm text-(--color-on-surface-variant) mb-1 block">Category</label>
          <select
            name="category"
            className="w-full rounded-lg border border-(--color-outline-variant) bg-(--color-surface-container-high) px-3 py-2 text-body-sm focus:outline-none focus:ring-2 focus:ring-(--color-primary)/40"
          >
            {Object.entries(CATEGORY_META).map(([k, v]) => (
              <option key={k} value={k}>{v.icon} {v.label}</option>
            ))}
          </select>
        </div>
        {contacts.length > 0 && (
          <div className="col-span-2">
            <label className="text-label-sm text-(--color-on-surface-variant) mb-1 block">Investor (optional)</label>
            <select
              name="pipeline_contact_id"
              className="w-full rounded-lg border border-(--color-outline-variant) bg-(--color-surface-container-high) px-3 py-2 text-body-sm focus:outline-none focus:ring-2 focus:ring-(--color-primary)/40"
            >
              <option value="">— All investors —</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.firm ? ` · ${c.firm}` : ""}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label className="text-label-sm text-(--color-on-surface-variant) mb-1 block">Title</label>
          <input
            name="title"
            type="text"
            placeholder="e.g. KYC verified — Acme Capital"
            maxLength={300}
            required
            className="w-full rounded-lg border border-(--color-outline-variant) bg-(--color-surface-container-high) px-3 py-2 text-body-sm focus:outline-none focus:ring-2 focus:ring-(--color-primary)/40"
          />
        </div>
        <div>
          <label className="text-label-sm text-(--color-on-surface-variant) mb-1 block">Due date (optional)</label>
          <input
            name="due_date"
            type="date"
            className="w-full rounded-lg border border-(--color-outline-variant) bg-(--color-surface-container-high) px-3 py-2 text-body-sm focus:outline-none focus:ring-2 focus:ring-(--color-primary)/40"
          />
        </div>
      </div>

      {error && <p className="text-body-sm text-(--color-error)">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-(--color-primary) px-4 py-2 text-label-sm text-white hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "Adding…" : "Add item"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg ghost-border px-4 py-2 text-label-sm hover:bg-(--color-surface-container-high)"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function ClosingLegal({ roundId, items, pipelineContacts, canEdit }: ClosingLegalProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [isPending, startTransition] = useTransition();

  const open = items.filter((i) => i.status !== "complete" && i.status !== "waived");
  const done = items.filter((i) => i.status === "complete" || i.status === "waived");
  const allDone = items.length > 0 && open.length === 0;

  function seedDefaults() {
    startTransition(async () => {
      for (const def of DEFAULT_ITEMS) {
        const fd = new FormData();
        fd.set("category", def.category);
        fd.set("title", def.title);
        await addClosingItem(roundId, fd);
      }
    });
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
            Closing &amp; Legal
          </h2>
          {open.length > 0 && (
            <span className="rounded-full bg-(--color-warning)/20 px-2 py-0.5 text-label-sm font-medium text-(--color-warning)">
              {open.length} open
            </span>
          )}
          {allDone && (
            <span className="rounded-full bg-(--color-success)/15 px-2 py-0.5 text-label-sm font-medium text-(--color-success)">
              All complete
            </span>
          )}
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            {items.length === 0 && (
              <button
                type="button"
                onClick={seedDefaults}
                disabled={isPending}
                className="rounded-lg ghost-border px-3 py-1.5 text-label-sm hover:bg-(--color-surface-container-high) disabled:opacity-50"
              >
                {isPending ? "Seeding…" : "Use defaults"}
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowAdd((v) => !v)}
              className="rounded-lg ghost-border px-4 py-2 text-label-sm hover:bg-(--color-surface-container-high)"
            >
              + Add item
            </button>
          </div>
        )}
      </div>

      {showAdd && (
        <AddItemForm roundId={roundId} contacts={pipelineContacts} onDone={() => setShowAdd(false)} />
      )}

      {items.length === 0 && !showAdd ? (
        <div className="rounded-xl bg-(--color-surface-container-low) px-6 py-8 text-center">
          <p className="text-body-md text-(--color-on-surface-variant)">
            No closing items yet.
            {canEdit && (
              <> Click <strong>Use defaults</strong> to seed standard KYC, subscription, wire, cert, and board items, or <strong>Add item</strong> to create custom ones.</>
            )}
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-(--color-surface-container-low) overflow-hidden">
          {open.length > 0 && (
            <ul>
              {open.map((item) => (
                <ItemRow key={item.id} item={item} roundId={roundId} contacts={pipelineContacts} canEdit={canEdit} />
              ))}
            </ul>
          )}
          {done.length > 0 && (
            <>
              {open.length > 0 && (
                <div className="px-4 py-2 border-t border-(--color-outline-variant)/15">
                  <p className="text-label-sm uppercase text-(--color-on-surface-variant)">Completed / Waived</p>
                </div>
              )}
              <ul className="opacity-70">
                {done.map((item) => (
                  <ItemRow key={item.id} item={item} roundId={roundId} contacts={pipelineContacts} canEdit={canEdit} />
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </section>
  );
}
