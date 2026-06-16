"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#000000", "#4b5563", "#9ca3af", "#d1d5db", "#e5e7eb"];
const COLORS_DARK = ["#ffffff", "#a1a1aa", "#71717a", "#52525b", "#3f3f46"];

type ChartMetrics = {
  totalIncome: number;
  totalExpenses: number;
  categoryTrends: { name: string; value: number }[];
};

export function DashboardTrendChart({ metrics }: { metrics: ChartMetrics }) {
  const chartData = [
    { name: "Week 1", Income: metrics.totalIncome * 0.2, Expense: metrics.totalExpenses * 0.15 },
    { name: "Week 2", Income: metrics.totalIncome * 0.35, Expense: metrics.totalExpenses * 0.3 },
    { name: "Week 3", Income: metrics.totalIncome * 0.15, Expense: metrics.totalExpenses * 0.25 },
    { name: "Week 4", Income: metrics.totalIncome * 0.3, Expense: metrics.totalExpenses * 0.3 },
  ];

  return (
    <div className="h-64 w-full min-h-[256px]" style={{ minWidth: 0 }}>
      <ResponsiveContainer width="100%" height={256} minWidth={0}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
          <Area type="monotone" dataKey="Income" stroke="#10b981" fillOpacity={0.06} fill="#10b981" />
          <Area type="monotone" dataKey="Expense" stroke="#ef4444" fillOpacity={0.06} fill="#ef4444" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DashboardCategoryChart({
  metrics,
  isDark,
}: {
  metrics: ChartMetrics;
  isDark: boolean;
}) {
  const categoriesColors = isDark ? COLORS_DARK : COLORS;

  if (metrics.categoryTrends.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-neutral-400">
        No expense data recorded this month.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-64">
      <div className="h-44 w-full min-h-[176px] relative" style={{ minWidth: 0 }}>
        <ResponsiveContainer width="100%" height={176} minWidth={0}>
          <PieChart>
            <Pie
              data={metrics.categoryTrends}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={4}
              dataKey="value"
            >
              {metrics.categoryTrends.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={categoriesColors[index % categoriesColors.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
                borderRadius: "6px",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-2">
        {metrics.categoryTrends.slice(0, 4).map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-1.5 text-xs text-neutral-500">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: categoriesColors[index % categoriesColors.length] }}
            />
            <span className="truncate max-w-[80px]">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
