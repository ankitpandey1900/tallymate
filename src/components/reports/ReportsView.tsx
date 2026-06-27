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
  const [netWorth, setNetWorth] = useState(initialData.netWorth);

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
        if (!cancelled) {
          setMetrics(rep);
        }
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
          <h2 className="text-xl font-bold tracking-tight">Spending Reports</h2>
          <p className="text-sm text-neutral-500">Charts and summaries to understand where your money goes.</p>
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
          <p className="text-2xl font-bold font-mono">₹{metrics.totalIncome.toLocaleString('en-IN')}</p>
        </div>

        <div className="panel-card p-5 space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Total Expenses</span>
          <p className="text-2xl font-bold font-mono">₹{metrics.totalExpenses.toLocaleString('en-IN')}</p>
        </div>

        <div className="panel-card p-5 space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Burn Rate (Per Day)</span>
          <p className="text-2xl font-bold font-mono">₹{metrics.burnRate.toLocaleString('en-IN')}</p>
        </div>

        <div className="panel-card p-5 space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Savings Rate</span>
          <p className="text-2xl font-bold font-mono">{metrics.savingsRate}%</p>
        </div>
      </div>

      {/* Insights Engine */}
      <div className="bg-white dark:bg-[#141416] border border-black/[0.04] dark:border-white/[0.04] rounded-[24px] shadow-sm p-6 overflow-hidden">
        <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-4">
          <Landmark size={16} />
          Financial Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-neutral-50 dark:bg-[#1a1a1c] p-4 rounded-xl border border-neutral-100 dark:border-neutral-800/50">
            <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Spending vs Net Worth</h4>
            <div className="text-sm">
              {netWorth > 0 ? (
                <p>
                  Your expenses this {timeframe} represent <strong>{((metrics.totalExpenses / netWorth) * 100).toFixed(1)}%</strong> of your total liquid net worth (<strong>₹{netWorth.toLocaleString('en-IN')}</strong>).
                </p>
              ) : (
                <p>Net worth data is unavailable or zero. Add balances to your accounts to see this insight.</p>
              )}
            </div>
          </div>
          
          <div className="bg-neutral-50 dark:bg-[#1a1a1c] p-4 rounded-xl border border-neutral-100 dark:border-neutral-800/50">
            <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Burn Rate Analysis</h4>
            <div className="text-sm">
              <p>
                At your current burn rate of <strong>₹{metrics.burnRate.toLocaleString('en-IN')}</strong> per day, 
                your net worth would last approximately <strong>{netWorth > 0 && metrics.burnRate > 0 ? Math.floor(netWorth / metrics.burnRate) : 0} days</strong> if all income stopped.
              </p>
            </div>
          </div>
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
