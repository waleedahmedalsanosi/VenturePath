import type { Database } from "@/lib/supabase/types";

type InstrumentType = Database["public"]["Enums"]["instrument_type"];

const STYLES: Record<InstrumentType, { label: string; bg: string; fg: string }> = {
  ordinary: {
    label: "Ordinary",
    bg: "bg-(--color-surface-bright)",
    fg: "text-(--color-on-surface)",
  },
  isafe: {
    // iSAFE permanent visual identity — Saudi green per DESIGN.md §3.6
    label: "iSAFE",
    bg: "bg-(--color-success)/20",
    fg: "text-(--color-success)",
  },
  safe: {
    label: "SAFE",
    bg: "bg-(--color-chart-1)/20",
    fg: "text-(--color-chart-1)",
  },
  convertible_note: {
    label: "Note",
    bg: "bg-(--color-warning)/20",
    fg: "text-(--color-warning)",
  },
};

export function InstrumentChip({ type }: { type: InstrumentType }) {
  const s = STYLES[type];
  return (
    <span
      className={`${s.bg} ${s.fg} inline-flex items-center rounded-full px-2.5 py-0.5 text-label-sm font-medium uppercase tracking-wider`}
    >
      {s.label}
    </span>
  );
}
