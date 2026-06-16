import type { UnifiedCategory, UnifiedIncomeSource, UnifiedTransaction } from "@/lib/unified-db";

export type ReportTimeframe = "weekly" | "monthly" | "quarterly" | "yearly";

export interface ReportMetrics {
  totalIncome: number;
  totalExpenses: number;
  savings: number;
  savingsRate: number;
  averageDailySpending: number;
  burnRate: number;
  categoryTrends: { name: string; value: number }[];
  incomeBreakdown: { name: string; value: number }[];
}

export function getReportStartDate(timeframe: ReportTimeframe, now = new Date()): Date {
  const startDate = new Date(now);

  if (timeframe === "weekly") {
    startDate.setDate(now.getDate() - 7);
  } else if (timeframe === "monthly") {
    startDate.setMonth(now.getMonth() - 1);
  } else if (timeframe === "quarterly") {
    startDate.setMonth(now.getMonth() - 3);
  } else if (timeframe === "yearly") {
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

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const categoryTotals: Record<string, number> = {};

  expenseTxs.forEach((t) => {
    const catName = t.categoryId ? categoryMap.get(t.categoryId) || "Uncategorized" : "Uncategorized";
    categoryTotals[catName] = (categoryTotals[catName] || 0) + Number(t.amount);
  });

  const categoryTrends = Object.entries(categoryTotals).map(([name, value]) => ({
    name,
    value: Math.round(value * 100) / 100,
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

  return {
    totalIncome,
    totalExpenses,
    savings,
    savingsRate,
    averageDailySpending,
    burnRate: averageDailySpending,
    categoryTrends,
    incomeBreakdown,
  };
}
