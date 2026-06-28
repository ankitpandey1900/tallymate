"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from "recharts";

const COLORS = ["#6366f1", "#ec4899", "#10b981", "#f59e0b", "#8b5cf6", "#0ea5e9", "#f43f5e", "#14b8a6"];
const COLORS_DARK = ["#818cf8", "#f472b6", "#34d399", "#fbbf24", "#a78bfa", "#38bdf8", "#fb7185", "#2dd4bf"];

type ChartData = { name: string; value: number; color?: string }[];

const formatYAxis = (val: number) => {
  if (val === 0) return "₹0";
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
  return `₹${val}`;
};

const CustomTooltip = ({ active, payload, label, isDark }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: isDark ? "rgba(24, 24, 27, 0.95)" : "rgba(255, 255, 255, 0.95)",
          borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)",
          borderWidth: 1,
          borderStyle: "solid",
          color: isDark ? "#fff" : "#000",
          borderRadius: "12px",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
          fontSize: "13px",
          backdropFilter: "blur(12px)",
          padding: "12px 16px",
        }}
      >
        <p style={{ margin: 0, fontWeight: 600, color: isDark ? "#a1a1aa" : "#71717a", marginBottom: "4px" }}>
          {label}
        </p>
        <p style={{ margin: 0, fontWeight: 700, fontSize: "16px" }}>
          ₹{Number(payload[0].value).toLocaleString("en-IN")}
        </p>
      </div>
    );
  }
  return null;
};

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
      <div className="h-64 flex items-center justify-center text-sm font-medium text-neutral-400">
        No expense transactions logged.
      </div>
    );
  }

  return (
    <div className="h-72 w-full" style={{ minWidth: 1, minHeight: 1 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} 
          />
          <XAxis 
            dataKey="name" 
            stroke={isDark ? "#71717a" : "#a1a1aa"} 
            fontSize={12} 
            fontWeight={500}
            tickLine={false} 
            axisLine={false} 
            tickMargin={12}
            tickFormatter={(val) => (val.length > 12 ? val.substring(0, 12) + "..." : val)}
          />
          <YAxis 
            stroke={isDark ? "#71717a" : "#a1a1aa"} 
            fontSize={12} 
            fontWeight={500}
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(val) => `₹${val}`}
            tickMargin={12}
            width={60}
          />
          <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
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
      <div className="h-64 flex items-center justify-center text-sm font-medium text-neutral-400">
        No income transactions logged.
      </div>
    );
  }

  // Reverse colors for income so it looks distinct from expenses
  const incomeColors = [...chartColors].reverse();

  return (
    <div className="h-72 w-full" style={{ minWidth: 1, minHeight: 1 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} 
          />
          <XAxis 
            dataKey="name" 
            stroke={isDark ? "#71717a" : "#a1a1aa"} 
            fontSize={12} 
            fontWeight={500}
            tickLine={false} 
            axisLine={false} 
            tickMargin={12}
            tickFormatter={(val) => (val.length > 12 ? val.substring(0, 12) + "..." : val)}
          />
          <YAxis 
            stroke={isDark ? "#71717a" : "#a1a1aa"} 
            fontSize={12} 
            fontWeight={500}
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(val) => `₹${val}`}
            tickMargin={12}
            width={60}
          />
          <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={incomeColors[index % incomeColors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
