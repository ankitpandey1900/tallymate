"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Download, BarChart3, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getReports, getTransactions, type getReportsPageData } from "@/app/actions";

const ExpenseCategoryChart = dynamic(
  () => import("./ReportsCharts").then((m) => m.ExpenseCategoryChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 flex items-center justify-center text-xs text-neutral-400">Loading chart…</div>
    ),
  }
);

const IncomeSourcesChart = dynamic(
  () => import("./ReportsCharts").then((m) => m.IncomeSourcesChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 flex items-center justify-center text-xs text-neutral-400">Loading chart…</div>
    ),
  }
);

type ReportsInitialData = Awaited<ReturnType<typeof getReportsPageData>>;

export default function ReportsView({ initialData }: { initialData: ReportsInitialData }) {
  const [mounted, setMounted] = useState(false);
  const [timeframe, setTimeframe] = useState<"weekly" | "monthly" | "quarterly" | "yearly">(initialData.timeframe);
  const [metrics, setMetrics] = useState(initialData.reports);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setTimeframe(initialData.timeframe);
    setMetrics(initialData.reports);
  }, [initialData]);

  useEffect(() => {
    if (timeframe === initialData.timeframe) {
      setMetrics(initialData.reports);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const rep = await getReports(timeframe);
        if (!cancelled) setMetrics(rep);
      } catch (err) {
        console.error(err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [timeframe, initialData]);

  const handleExportCSV = async () => {
    try {
      const txs = await getTransactions();

      const now = new Date();
      const limitDate = new Date();
      if (timeframe === "weekly") limitDate.setDate(now.getDate() - 7);
      else if (timeframe === "monthly") limitDate.setMonth(now.getMonth() - 1);
      else if (timeframe === "quarterly") limitDate.setMonth(now.getMonth() - 3);
      else if (timeframe === "yearly") limitDate.setFullYear(now.getFullYear() - 1);

      const targetTxs = txs.filter((t) => new Date(t.date) >= limitDate);

      const headers = ["Date", "Description", "Type", "Scope", "Amount", "Notes", "Tags"];
      const rows = targetTxs.map((t) => [
        new Date(t.date).toLocaleDateString(),
        `"${t.description.replace(/"/g, '""')}"`,
        t.type,
        t.scope,
        t.amount,
        `"${(t.notes || "").replace(/"/g, '""')}"`,
        `"${t.tags.join(", ")}"`,
      ]);

      const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Tallymate_Report_${timeframe}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
    }
  };

  const isDark =
    mounted && typeof window !== "undefined" && document.documentElement.classList.contains("dark");

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Financial Audits</h2>
          <p className="text-sm text-neutral-500">Generate, review and export spending summaries.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Timeframe selector */}
          <div className="flex items-center gap-1 bg-neutral-50 dark:bg-neutral-900 border border-black/[0.04] dark:border-neutral-800 p-1 rounded-lg">
            {(["weekly", "monthly", "quarterly", "yearly"] as const).map((t) => (
              <Button
                key={t}
                type="button"
                variant="unstyled"
                onClick={() => setTimeframe(t)}
                className={cn(
                  "px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider rounded-md transition-colors",
                  timeframe === t
                    ? "bg-[#09090b] text-white dark:bg-[#fafafa] dark:text-black"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
                )}
              >
                {t}
              </Button>
            ))}
          </div>

          <Button type="button" variant="outline-app" onClick={handleExportCSV}>
            <Download size={14} />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="panel-card p-5 space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Total Income</span>
          <p className="text-2xl font-bold font-mono">₹{metrics.totalIncome.toLocaleString()}</p>
        </div>

        <div className="panel-card p-5 space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Total Expenses</span>
          <p className="text-2xl font-bold font-mono">₹{metrics.totalExpenses.toLocaleString()}</p>
        </div>

        <div className="panel-card p-5 space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Burn Rate (Per Day)</span>
          <p className="text-2xl font-bold font-mono">₹{metrics.burnRate.toLocaleString()}</p>
        </div>

        <div className="panel-card p-5 space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Savings Rate</span>
          <p className="text-2xl font-bold font-mono">{metrics.savingsRate}%</p>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses by Category chart */}
        <div className="panel-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <BarChart3 size={16} />
              Expense Category Breakdown
            </h3>
          </div>
          {mounted && (
            <ExpenseCategoryChart data={metrics.categoryTrends} isDark={isDark} />
          )}
        </div>

        {/* Income Sources breakdown chart */}
        <div className="panel-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <Landmark size={16} />
              Income Sources Breakdown
            </h3>
          </div>
          {mounted && (
            <IncomeSourcesChart data={metrics.incomeBreakdown} isDark={isDark} />
          )}
        </div>
      </div>
    </div>
  );
}
