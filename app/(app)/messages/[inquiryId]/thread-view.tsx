"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { useT } from "@/lib/i18n/useT";

import { sendInquiryMessage } from "./actions";

export type ThreadInquiry = {
  id: string;
  status: "sent" | "accepted" | "declined" | "closed";
  listingId: string;
  listingType: "exit" | "partnership";
  listingSummary: string;
  counterparty: string | null;
  sentAt: string;
};

export type ThreadMessage = {
  id: string;
  body: string;
  senderUserId: string;
  createdAt: string;
};

const STATUS_TONE: Record<ThreadInquiry["status"], string> = {
  sent: "text-(--color-on-surface-variant) bg-(--color-surface-container-high)",
  accepted: "text-(--color-success) bg-(--color-success)/15",
  declined: "text-(--color-error) bg-(--color-error)/15",
  closed:
    "text-(--color-on-surface-variant) bg-(--color-surface-container-low)",
};

function StatusChip({ status }: { status: ThreadInquiry["status"] }) {
  const t = useT("messages");
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-label-sm font-medium uppercase tracking-wider ${STATUS_TONE[status]}`}
    >
      {t(`status.${status}`)}
    </span>
  );
}

export function ThreadView({
  inquiry,
  messages,
  currentUserId,
}: {
  inquiry: ThreadInquiry;
  messages: ThreadMessage[];
  currentUserId: string;
}) {
  const t = useT("messages");
  const router = useRouter();

  const readonly =
    inquiry.status === "closed" || inquiry.status === "declined";

  const [optimistic, setOptimistic] = useState<ThreadMessage[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const allMessages = [...messages, ...optimistic];

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setSendError(null);

    // Optimistic append
    const tempId = `opt-${Date.now()}`;
    const tempMsg: ThreadMessage = {
      id: tempId,
      body: trimmed,
      senderUserId: currentUserId,
      createdAt: new Date().toISOString(),
    };
    setOptimistic((prev) => [...prev, tempMsg]);
    setBody("");

    const result = await sendInquiryMessage(inquiry.id, trimmed);
    setSending(false);

    if (!result.ok) {
      setSendError(result.error ?? t("thread.compose.error"));
      // Remove optimistic message on failure
      setOptimistic((prev) => prev.filter((m) => m.id !== tempId));
      setBody(trimmed);
    } else {
      // Replace optimistic with real data via router refresh
      setOptimistic([]);
      router.refresh();
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }

  const charCount = body.length;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 space-y-6">
      {/* Back link */}
      <Link
        href="/messages"
        className="text-body-sm text-(--color-on-surface-variant) hover:underline"
      >
        {t("thread.back")}
      </Link>

      {/* Thread header */}
      <header className="rounded-xl ghost-border p-5 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-label-md uppercase text-(--color-on-surface-variant)">
            {t("thread.title")}
          </p>
          <StatusChip status={inquiry.status} />
          <span className="text-label-sm uppercase tracking-wider text-(--color-on-surface-variant)">
            ·{" "}
            {inquiry.listingType === "exit"
              ? t("type.exit")
              : t("type.partnership")}
          </span>
        </div>
        <p className="text-body-lg font-semibold">
          {inquiry.counterparty ?? t("unknown_counterparty")}
        </p>
        <p className="text-body-sm text-(--color-on-surface-variant) line-clamp-2">
          {inquiry.listingSummary}
        </p>
        <div className="flex items-center gap-3 flex-wrap text-body-sm text-(--color-on-surface-variant)">
          <span className="tabular-nums">
            {new Date(inquiry.sentAt).toLocaleDateString()}
          </span>
          <span>·</span>
          <Link
            href={`/connections/${inquiry.listingId}`}
            className="text-(--color-primary) hover:underline"
          >
            {t("thread.view_listing")}
          </Link>
        </div>
      </header>

      {/* Message bubbles */}
      <section className="space-y-3 min-h-[200px]">
        {allMessages.length === 0 ? (
          <p className="text-body-sm text-(--color-on-surface-variant) text-center py-10">
            {t("thread.empty")}
          </p>
        ) : (
          allMessages.map((msg) => {
            const isOutgoing = msg.senderUserId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex ${isOutgoing ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`
                    max-w-[75%] rounded-2xl px-4 py-3 text-body-md
                    ${
                      isOutgoing
                        ? "bg-(--color-primary) text-(--color-on-primary)"
                        : "ghost-border bg-(--color-surface-container-high) text-(--color-on-surface)"
                    }
                    ${msg.id.startsWith("opt-") ? "opacity-70" : ""}
                  `}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                  <p
                    className={`mt-1 text-label-sm tabular-nums ${
                      isOutgoing
                        ? "text-(--color-on-primary)/70"
                        : "text-(--color-on-surface-variant)"
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </section>

      {/* Reply form or readonly notice */}
      {readonly ? (
        <div className="rounded-xl ghost-border p-4 text-center text-body-sm text-(--color-on-surface-variant)">
          {inquiry.status === "closed"
            ? t("thread.status.closed_readonly")
            : t("thread.status.declined_readonly")}
        </div>
      ) : (
        <form onSubmit={handleSend} className="rounded-xl ghost-border p-4 space-y-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t("thread.compose.placeholder")}
            maxLength={2000}
            rows={3}
            disabled={sending}
            className="
              w-full resize-none rounded-lg bg-(--color-surface-container-high)
              px-3 py-2 text-body-md outline-none
              focus:ring-2 focus:ring-(--color-primary)/40
              disabled:opacity-50
            "
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-label-sm text-(--color-on-surface-variant) tabular-nums">
              {t("thread.compose.counter", { count: charCount })}
            </span>
            <div className="flex items-center gap-3">
              {sendError && (
                <span className="text-label-sm text-(--color-error)">
                  {sendError}
                </span>
              )}
              <button
                type="submit"
                disabled={sending || !body.trim()}
                className="
                  rounded-lg bg-(--color-primary) text-(--color-on-primary)
                  px-4 py-2 text-label-sm hover:opacity-90 disabled:opacity-50
                  transition-opacity
                "
              >
                {sending
                  ? t("thread.compose.sending")
                  : t("thread.compose.send")}
              </button>
            </div>
          </div>
        </form>
      )}
    </main>
  );
}
