import type { UnifiedCategory, UnifiedIncomeSource, UnifiedTransaction } from "@/lib/unified-db";

export type ReportTimeframe = "weekly" | "monthly" | "quarterly" | "yearly";

export interface ReportMetrics {
  totalIncome: number;
  totalExpenses: number;
  savings: number;
  savingsRate: number;
  averageDailySpending: number;
  burnRate: number;
  categoryTrends: { name: string; value: number; color?: string }[];
  incomeBreakdown: { name: string; value: number; color?: string }[];
  trendData: { name: string; Income: number; Expense: number }[];
}

export function getReportStartDate(timeframe: ReportTimeframe, now = new Date()): Date {
  const startDate = new Date(now);

  if (timeframe === "weekly") {
    // Keep weekly as rolling 7 days, or we could change to start of week.
    // For now, rolling 7 days is fine.
    startDate.setDate(now.getDate() - 7);
  } else if (timeframe === "monthly") {
    // Current calendar month
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
  } else if (timeframe === "quarterly") {
    // Last 3 months rolling
    startDate.setMonth(now.getMonth() - 3);
  } else if (timeframe === "yearly") {
    // Last 12 months rolling
    startDate.setFullYear(now.getFullYear() - 1);
  }

  return startDate;
}

export function computeReports(
  transactions: UnifiedTransaction[],
  categories: UnifiedCategory[],
  incomeSources: UnifiedIncomeSource[],
  timeframe: ReportTimeframe,
  now = new Date()
): ReportMetrics {
  const startDate = getReportStartDate(timeframe, now);
  const filteredTxs = transactions.filter((t) => new Date(t.date) >= startDate);

  const incomeTxs = filteredTxs.filter((t) => t.type === "INCOME" || t.type === "REFUND");
  const expenseTxs = filteredTxs.filter((t) => t.type === "EXPENSE");

  const totalIncome = incomeTxs.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpenses = expenseTxs.reduce((sum, t) => sum + Number(t.amount), 0);
  const savings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0;

  const diffTime = Math.abs(now.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  const averageDailySpending = Math.round((totalExpenses / diffDays) * 100) / 100;

  const categoryMap = new Map(categories.map((c) => [c.id, { name: c.name, color: c.color }]));
  const categoryTotals: Record<string, { value: number; color?: string }> = {};

  expenseTxs.forEach((t) => {
    const catData = t.categoryId ? categoryMap.get(t.categoryId) : undefined;
    const catName = catData?.name || "Uncategorized";
    const catColor = catData?.color;

    if (!categoryTotals[catName]) {
      categoryTotals[catName] = { value: 0, color: catColor };
    }
    categoryTotals[catName].value += Number(t.amount);
  });

  const categoryTrends = Object.entries(categoryTotals).map(([name, data]) => ({
    name,
    value: Math.round(data.value * 100) / 100,
    color: data.color,
  }));

  const sourceMap = new Map(incomeSources.map((s) => [s.id, s.name]));
  const sourceTotals: Record<string, number> = {};

  incomeTxs.forEach((t) => {
    const srcName = t.incomeSourceId ? sourceMap.get(t.incomeSourceId) || "Other Income" : "Other Income";
    sourceTotals[srcName] = (sourceTotals[srcName] || 0) + Number(t.amount);
  });

  const incomeBreakdown = Object.entries(sourceTotals).map(([name, value]) => ({
    name,
    value: Math.round(value * 100) / 100,
  }));

  // Calculate trend data based on timeframe
  const trendData: { name: string; Income: number; Expense: number }[] = [];
  
  if (timeframe === "weekly") {
    // 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString("en-US", { weekday: "short" });
      const dayTxs = filteredTxs.filter(t => new Date(t.date).toDateString() === d.toDateString());
      const income = dayTxs.filter(t => t.type === "INCOME" || t.type === "REFUND").reduce((s, t) => s + Number(t.amount), 0);
      const expense = dayTxs.filter(t => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);
      trendData.push({ name: dayStr, Income: income, Expense: expense });
    }
  } else if (timeframe === "monthly") {
    // 4 weeks approx
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      if (i === 3) weekEnd.setDate(weekEnd.getDate() + 10); // cover rest of month
      
      const weekTxs = filteredTxs.filter(t => {
        const d = new Date(t.date);
        return d >= weekStart && d <= weekEnd;
      });
      const income = weekTxs.filter(t => t.type === "INCOME" || t.type === "REFUND").reduce((s, t) => s + Number(t.amount), 0);
      const expense = weekTxs.filter(t => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);
      trendData.push({ name: `Week ${i + 1}`, Income: income, Expense: expense });
    }
  } else if (timeframe === "quarterly" || timeframe === "yearly") {
    // Group by month
    const monthsCount = timeframe === "quarterly" ? 3 : 12;
    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = d.toLocaleDateString("en-US", { month: "short" });
      const monthTxs = filteredTxs.filter(t => {
        const td = new Date(t.date);
        return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
      });
      const income = monthTxs.filter(t => t.type === "INCOME" || t.type === "REFUND").reduce((s, t) => s + Number(t.amount), 0);
      const expense = monthTxs.filter(t => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);
      trendData.push({ name: monthStr, Income: income, Expense: expense });
    }
  }

  return {
    totalIncome,
    totalExpenses,
    savings,
    savingsRate,
    averageDailySpending,
    burnRate: averageDailySpending,
    categoryTrends,
    incomeBreakdown,
    trendData,
  };
}
