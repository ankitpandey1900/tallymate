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
  CartesianGrid,
} from "recharts";

const COLORS = ["#6366f1", "#f43f5e", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6"];
const COLORS_DARK = ["#818cf8", "#fb7185", "#34d399", "#fbbf24", "#a78bfa", "#22d3ee", "#f472b6", "#2dd4bf"];

type ChartMetrics = {
  totalIncome: number;
  totalExpenses: number;
  categoryTrends: { name: string; value: number; color?: string }[];
  trendData?: { name: string; Income: number; Expense: number }[];
};

export function DashboardTrendChart({ metrics }: { metrics: ChartMetrics }) {
  const chartData = metrics.trendData || [];

  return (
    <div className="h-64 w-full min-h-[256px]" style={{ minWidth: 1, minHeight: 1 }}>
      <ResponsiveContainer width="100%" height={256} minWidth={1} minHeight={1}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-black/5 dark:text-white/5" />
          <XAxis dataKey="name" stroke="currentColor" className="text-neutral-400" fontSize={11} tickLine={false} axisLine={false} dy={10} />
          <YAxis stroke="currentColor" className="text-neutral-400" fontSize={11} tickLine={false} axisLine={false} dx={-10} tickFormatter={(val) => `₹${val}`} />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(17, 17, 19, 0.9)",
              borderColor: "rgba(255, 255, 255, 0.1)",
              color: "#fff",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              fontSize: "12px",
              backdropFilter: "blur(4px)",
              padding: "8px 12px",
            }}
            itemStyle={{ color: "#e5e7eb", fontSize: "13px", fontWeight: 500, padding: "2px 0" }}
          />
          <Area type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
          <Area type="monotone" dataKey="Expense" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
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
      <div className="h-48 w-full min-h-[192px] relative" style={{ minWidth: 1, minHeight: 1 }}>
        <ResponsiveContainer width="100%" height={192} minWidth={1} minHeight={1}>
          <PieChart style={{ outline: 'none' }}>
            <Pie
              data={metrics.categoryTrends}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={6}
              cornerRadius={8}
              dataKey="value"
              stroke="none"
            >
              {metrics.categoryTrends.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || categoriesColors[index % categoriesColors.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(20, 20, 22, 0.95)",
                borderColor: "rgba(255, 255, 255, 0.1)",
                color: "#fff",
                borderRadius: "12px",
                boxShadow: "0 8px 16px -4px rgba(0, 0, 0, 0.1)",
                fontSize: "13px",
                padding: "8px 12px",
                backdropFilter: "blur(8px)",
              }}
              itemStyle={{ color: "#e5e7eb", fontSize: "14px", fontWeight: 700 }}
              formatter={(value: any, name: any) => [`₹${Number(value).toLocaleString('en-IN')}`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center mt-3">
        {metrics.categoryTrends.slice(0, 4).map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-400">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.color || categoriesColors[index % categoriesColors.length] }}
            />
            <span className="truncate max-w-[80px]">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
