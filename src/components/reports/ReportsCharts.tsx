"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

const COLORS = ["#6366f1", "#f43f5e", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6"];
const COLORS_DARK = ["#818cf8", "#fb7185", "#34d399", "#fbbf24", "#a78bfa", "#22d3ee", "#f472b6", "#2dd4bf"];

type ChartData = { name: string; value: number; color?: string }[];

export function ExpenseCategoryChart({
  data,
  isDark,
}: {
  data: ChartData;
  isDark: boolean;
}) {
  const chartColors = isDark ? COLORS_DARK : COLORS;

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-neutral-400">
        No expense transactions logged in this range.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
              borderRadius: "6px",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || chartColors[index % chartColors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function IncomeSourcesChart({
  data,
  isDark,
}: {
  data: ChartData;
  isDark: boolean;
}) {
  const chartColors = isDark ? COLORS_DARK : COLORS;

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-neutral-400">
        No income transactions logged in this range.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
              borderRadius: "6px",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
