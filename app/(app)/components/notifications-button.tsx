"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { useT } from "@/lib/i18n/useT";
import type { AccountNotification } from "@/lib/supabase/types";

// ── Types ──────────────────────────────────────────────────────────────────

interface NotificationsResponse {
  unread_count: number;
  notifications: AccountNotification[];
}

// ── Helpers ──────────────────────────────────────────────────���─────────────

function useRelativeTime(t: (key: string, opts?: Record<string, unknown>) => string) {
  return useCallback(
    (isoDate: string): string => {
      const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
      if (diff < 60) return t("time.just_now");
      const mins = Math.floor(diff / 60);
      if (mins < 60)
        return mins === 1
          ? t("time.minutes_ago", { count: mins })
          : t("time.minutes_ago_plural", { count: mins });
      const hours = Math.floor(mins / 60);
      if (hours < 24)
        return hours === 1
          ? t("time.hours_ago", { count: hours })
          : t("time.hours_ago_plural", { count: hours });
      const days = Math.floor(hours / 24);
      return days === 1
        ? t("time.days_ago", { count: days })
        : t("time.days_ago_plural", { count: days });
    },
    [t],
  );
}

/** Map notification type to a small SVG path so we avoid icon-in-circle. */
function NotificationIcon({ type }: { type: AccountNotification["type"] }) {
  // All icons 16×16, stroke only, matching the design system.
  if (type === "inquiry_received" || type === "inquiry_accepted" || type === "inquiry_declined") {
    // Chat bubble
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d="M2 3h12v8H9l-3 2V11H2V3z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (type === "rofr_notified") {
    // Exclamation shield
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d="M8 2L2 5v4c0 3 2.5 4.7 6 5 3.5-.3 6-2 6-5V5L8 2z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path d="M8 7v2M8 10.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === "investor_update_opened") {
    // Eye
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d="M1 8C2.5 4.5 5 3 8 3s5.5 1.5 7 5c-1.5 3.5-4 5-7 5S2.5 11.5 1 8z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    );
  }
  // Generic bell for compliance_overdue / round_visibility_changed
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3 12V7a5 5 0 0 1 10 0v5l1 1H2l1-1z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M6 13a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// ── Component ──────────────────────────���───────────────────────────────────

const POLL_INTERVAL_MS = 60_000;

export function NotificationsButton() {
  const tNav = useT("nav");
  const tCommon = useT();
  const relativeTime = useRelativeTime(tCommon);

  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<AccountNotification[]>([]);
  const ref = useRef<HTMLDivElement | null>(null);

  // ── i18n title override: prefer i18n key over DB-stored English title ────
  const notificationTitle = useCallback(
    (n: AccountNotification): string => {
      const key = `notifications.title.${n.type}` as const;
      const translated = tNav(key);
      // react-i18next returns the key unchanged if no translation is found.
      return translated === key ? n.title : translated;
    },
    [tNav],
  );

  // ── Data fetching ───────────��─────────────────────────────��───────────────
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data: NotificationsResponse = await res.json();
      setUnreadCount(data.unread_count);
      setNotifications(data.notifications.slice(0, 10));
    } catch {
      // Silently ignore fetch errors (network offline, auth expired, etc.)
    }
  }, []);

  useEffect(() => {
    // fetchNotifications is async — setState calls are never synchronous.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchNotifications();
    const timer = setInterval(() => void fetchNotifications(), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  // ── Keyboard + outside-click close ─────────────��──────────────────���───────
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // ── Mark all read ──────────────��──────────────────────────────────────────
  async function handleMarkAllRead() {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read_all" }),
      });
      await fetchNotifications();
    } catch {
      // Silently ignore
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={tNav("notifications.aria_label")}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="
          relative flex items-center justify-center w-9 h-9 rounded-lg
          bg-(--color-surface-container-low) ghost-border
          text-(--color-on-surface-variant) hover:text-(--color-on-surface)
          hover:bg-(--color-surface-container-high) transition-colors
        "
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M3 12V7a5 5 0 0 1 10 0v5l1 1H2l1-1z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path
            d="M6 13a2 2 0 0 0 4 0"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            aria-label={`${unreadCount} unread`}
            className="
              absolute top-1.5 end-1.5 flex items-center justify-center
              min-w-[14px] h-[14px] rounded-full px-0.5
              bg-(--color-primary) text-(--color-surface) text-[9px] font-semibold leading-none
            "
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={tNav("notifications.title")}
          className="
            absolute top-full mt-2 end-0 z-50 w-80 rounded-xl
            bg-(--color-surface-container-high) ghost-border
            shadow-[0_20px_60px_-30px_rgba(13,19,34,0.5)]
          "
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <p className="text-label-md font-medium text-(--color-on-surface)">
              {tNav("notifications.title")}
            </p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-body-xs text-(--color-primary) hover:opacity-75 transition-opacity"
              >
                {tNav("notifications.mark_all_read")}
              </button>
            )}
          </div>

          {/* List */}
          <ul className="divide-y divide-transparent max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="px-4 py-3">
                <p className="text-body-sm text-(--color-on-surface-variant)">
                  {tNav("notifications.empty")}
                </p>
              </li>
            ) : (
              notifications.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.url}
                    onClick={() => setOpen(false)}
                    className="
                      flex items-start gap-3 px-4 py-3
                      hover:bg-(--color-surface-container-low) transition-colors
                    "
                  >
                    {/* Icon */}
                    <span
                      className={`
                        mt-0.5 flex-shrink-0
                        ${n.is_read ? "text-(--color-on-surface-disabled)" : "text-(--color-primary)"}
                      `}
                    >
                      <NotificationIcon type={n.type} />
                    </span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`
                          text-body-sm leading-snug
                          ${n.is_read ? "text-(--color-on-surface-variant)" : "text-(--color-on-surface) font-medium"}
                        `}
                      >
                        {notificationTitle(n)}
                      </p>
                      <p className="text-body-xs text-(--color-on-surface-disabled) mt-0.5">
                        {relativeTime(n.created_at)}
                      </p>
                    </div>

                    {/* Unread dot */}
                    {!n.is_read && (
                      <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-(--color-primary)" />
                    )}
                  </Link>
                </li>
              ))
            )}
          </ul>

          {/* Bottom padding */}
          <div className="h-1" />
        </div>
      )}
    </div>
  );
}
