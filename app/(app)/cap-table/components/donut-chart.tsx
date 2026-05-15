"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface DonutDatum {
  name: string;
  value: number;
  instrument: "ordinary" | "isafe" | "safe" | "convertible_note";
  colorIndex: number;
}

// Chart palette per DESIGN.md §3.5. iSAFE is always color #2 (Saudi green).
const PALETTE = [
  "var(--color-chart-1)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
  "var(--color-chart-7)",
  "var(--color-chart-8)",
];

function pickColor(d: DonutDatum): string {
  if (d.instrument === "isafe") return "var(--color-isafe)";
  return PALETTE[d.colorIndex % PALETTE.length]!;
}

export function OwnershipDonut({ data }: { data: DonutDatum[] }) {
  if (data.length === 0) {
    return (
      <div className="aspect-square flex items-center justify-center text-body-sm text-(--color-on-surface-variant)">
        No ownership data yet
      </div>
    );
  }

  return (
    <div className="aspect-square">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="60%"
            outerRadius="90%"
            paddingAngle={1}
            stroke="var(--color-surface-container-low)"
            strokeWidth={2}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={pickColor(d)} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--color-surface-bright)",
              border: "none",
              borderRadius: "0.5rem",
              color: "var(--color-on-surface)",
            }}
            formatter={(v) => `${Number(v).toFixed(2)}%`}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
