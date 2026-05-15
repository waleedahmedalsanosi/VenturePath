"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Datum {
  month: string;
  mrr: number | null;
}

function fmtMonth(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
}

function fmtSAR(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return `SAR ${Number(v).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function TractionChart({ data }: { data: Datum[] }) {
  // Convert nulls so Recharts skips empty months gracefully.
  const display = data.map((d) => ({
    monthLabel: fmtMonth(d.month),
    mrr: d.mrr,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={display} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <CartesianGrid
            strokeDasharray="2 4"
            stroke="var(--color-outline-variant)"
            strokeOpacity={0.2}
            vertical={false}
          />
          <XAxis
            dataKey="monthLabel"
            stroke="var(--color-on-surface-variant)"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            stroke="var(--color-on-surface-variant)"
            fontSize={12}
            tickLine={false}
            tickFormatter={(v) =>
              v >= 1_000_000
                ? `${(v / 1_000_000).toFixed(1)}M`
                : v >= 1_000
                  ? `${(v / 1_000).toFixed(0)}K`
                  : String(v)
            }
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface-bright)",
              border: "none",
              borderRadius: "0.5rem",
              color: "var(--color-on-surface)",
            }}
            formatter={(v) => [fmtSAR(Number(v)), "MRR"]}
          />
          <Bar
            dataKey="mrr"
            fill="var(--color-tertiary)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
