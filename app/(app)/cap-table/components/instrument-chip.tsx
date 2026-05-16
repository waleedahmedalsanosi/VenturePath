"use client";

import { useT } from "@/lib/i18n/useT";

import type { Database } from "@/lib/supabase/types";

type InstrumentType = Database["public"]["Enums"]["instrument_type"];

const STYLES: Record<InstrumentType, { bg: string; fg: string }> = {
  ordinary: {
    bg: "bg-(--color-surface-bright)",
    fg: "text-(--color-on-surface)",
  },
  isafe: {
    bg: "bg-(--color-success)/20",
    fg: "text-(--color-success)",
  },
  safe: {
    bg: "bg-(--color-chart-1)/20",
    fg: "text-(--color-chart-1)",
  },
  convertible_note: {
    bg: "bg-(--color-warning)/20",
    fg: "text-(--color-warning)",
  },
};

export function InstrumentChip({ type }: { type: InstrumentType }) {
  const t = useT("cap_table");
  const s = STYLES[type];
  return (
    <span
      className={`${s.bg} ${s.fg} inline-flex items-center rounded-full px-2.5 py-0.5 text-label-sm font-medium uppercase tracking-wider`}
    >
      {t(`instrument.${type}`)}
    </span>
  );
}
