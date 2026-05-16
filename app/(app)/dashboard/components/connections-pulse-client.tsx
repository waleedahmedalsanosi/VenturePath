"use client";

import Link from "next/link";

import { useT } from "@/lib/i18n/useT";

export function ConnectionsPulseTiles({
  openCount,
  newInquiries,
}: {
  openCount: number;
  newInquiries: number;
}) {
  const t = useT("dashboard");
  return (
    <section>
      <h2 className="text-label-md uppercase text-(--color-on-surface-variant) mb-3">
        {t("connections_pulse.heading")}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <Tile
          label={t("connections_pulse.open_listings")}
          value={String(openCount)}
          href="/connections?filter=mine"
        />
        <Tile
          label={t("connections_pulse.new_inquiries")}
          value={String(newInquiries)}
          href="/connections?filter=mine"
          sub={t("connections_pulse.new_inquiries_sub")}
        />
      </div>
    </section>
  );
}

function Tile({
  label,
  value,
  href,
  sub,
}: {
  label: string;
  value: string;
  href: string;
  sub?: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl bg-(--color-surface-container-low) px-4 py-4 hover:bg-(--color-surface-container-high) transition-colors block"
    >
      <p className="text-label-md uppercase text-(--color-on-surface-variant)">{label}</p>
      <p className="mt-1 text-display-sm font-semibold tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-body-sm text-(--color-on-surface-variant)">{sub}</p>}
    </Link>
  );
}
