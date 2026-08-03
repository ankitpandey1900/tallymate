"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Download, BarChart3, Landmark, TrendingUp, TrendingDown, Flame, Wallet, PiggyBank, Target } from "lucide-react";
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
  const [timeframe, setTimeframe] = useState<"weekly" | "monthly" | "quarterly" | "yearly" | "custom">(initialData.timeframe);
  const [customStartDate, setCustomStartDate] = useState<string>(
    initialData.customStartDate || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    initialData.customEndDate || new Date().toISOString().split('T')[0]
  );
  const [scope, setScope] = useState<"ALL" | "PERSONAL" | "GROUP">(initialData.scopeFilter || "ALL");
  const [type, setType] = useState<"ALL" | "INCOME" | "EXPENSE">(initialData.typeFilter || "ALL");
  const [metrics, setMetrics] = useState(initialData.reports);
  const [netWorth] = useState(initialData.netWorth);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setTimeframe(initialData.timeframe);
    setScope(initialData.scopeFilter || "ALL");
    setType(initialData.typeFilter || "ALL");
    setMetrics(initialData.reports);
  }, [initialData]);

  useEffect(() => {
    if (
      timeframe === initialData.timeframe &&
      scope === initialData.scopeFilter &&
      type === initialData.typeFilter &&
      (timeframe !== "custom" || (customStartDate === initialData.customStartDate && customEndDate === initialData.customEndDate))
    ) {
      setMetrics(initialData.reports);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const rep = await getReports(timeframe, scope, type, customStartDate, customEndDate);
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
  }, [timeframe, scope, type, customStartDate, customEndDate, initialData]);

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
      {/* Header and Controls */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Financial Reports</h1>
          <p className="text-neutral-500">Analyze your spending habits and financial growth over time.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Scope Filter */}
          <select
            className="h-9 px-3 py-1 bg-white dark:bg-neutral-900 border border-black/[0.08] dark:border-white/[0.08] rounded-md text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            value={scope}
            onChange={(e) => setScope(e.target.value as any)}
          >
            <option value="ALL">All Scopes</option>
            <option value="PERSONAL">Personal</option>
            <option value="GROUP">Group Split</option>
          </select>
          {/* Type Filter */}
          <select
            className="h-9 px-3 py-1 bg-white dark:bg-neutral-900 border border-black/[0.08] dark:border-white/[0.08] rounded-md text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            value={type}
            onChange={(e) => setType(e.target.value as any)}
          >
            <option value="ALL">All Types</option>
            <option value="INCOME">Income Only</option>
            <option value="EXPENSE">Expense Only</option>
          </select>

          {/* Timeframe Toggles */}
          <div className="flex flex-wrap bg-neutral-100 dark:bg-neutral-800/50 p-1 rounded-lg gap-1">
            {(["weekly", "monthly", "quarterly", "yearly", "custom"] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md capitalize transition-all",
                  timeframe === tf
                    ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                )}
              >
                {tf}
              </button>
            ))}
          </div>
          
          <Button variant="outline" className="gap-2 h-9" onClick={handleExportCSV}>
            <Download size={16} /> <span className="hidden sm:inline">Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Custom Date Pickers (Shown only when timeframe is custom) */}
      {timeframe === "custom" && (
        <div className="flex flex-wrap items-center gap-3 bg-neutral-50 dark:bg-neutral-900 border border-black/[0.08] dark:border-white/[0.08] p-3 rounded-xl w-fit">
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500 font-medium">From</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="h-9 px-3 py-1 bg-white dark:bg-neutral-950 border border-black/[0.08] dark:border-white/[0.08] rounded-md text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-neutral-900 dark:text-neutral-100"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500 font-medium">To</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="h-9 px-3 py-1 bg-white dark:bg-neutral-950 border border-black/[0.08] dark:border-white/[0.08] rounded-md text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-neutral-900 dark:text-neutral-100"
            />
          </div>
        </div>
      )}
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 dark:from-emerald-500/20 dark:to-emerald-500/5 border border-emerald-500/20 rounded-[20px] p-5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500"></div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400">
              <TrendingUp size={18} strokeWidth={2.5} />
            </div>
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-800/70 dark:text-emerald-200/70">Total Income</span>
          </div>
          <p className="text-3xl font-bold font-mono text-emerald-700 dark:text-emerald-300">₹{metrics.totalIncome.toLocaleString('en-IN')}</p>
        </div>

        <div className="bg-gradient-to-br from-rose-500/10 to-rose-500/5 dark:from-rose-500/20 dark:to-rose-500/5 border border-rose-500/20 rounded-[20px] p-5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all duration-500"></div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-rose-500/20 rounded-lg text-rose-600 dark:text-rose-400">
              <TrendingDown size={18} strokeWidth={2.5} />
            </div>
            <span className="text-xs uppercase font-bold tracking-wider text-rose-800/70 dark:text-rose-200/70">Total Expenses</span>
          </div>
          <p className="text-3xl font-bold font-mono text-rose-700 dark:text-rose-300">₹{metrics.totalExpenses.toLocaleString('en-IN')}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 dark:from-orange-500/20 dark:to-orange-500/5 border border-orange-500/20 rounded-[20px] p-5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all duration-500"></div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-500/20 rounded-lg text-orange-600 dark:text-orange-400">
              <Flame size={18} strokeWidth={2.5} />
            </div>
            <span className="text-xs uppercase font-bold tracking-wider text-orange-800/70 dark:text-orange-200/70">Burn Rate / Day</span>
          </div>
          <p className="text-3xl font-bold font-mono text-orange-700 dark:text-orange-300">₹{metrics.burnRate.toLocaleString('en-IN')}</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 dark:from-indigo-500/20 dark:to-indigo-500/5 border border-indigo-500/20 rounded-[20px] p-5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-500"></div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-600 dark:text-indigo-400">
              <PiggyBank size={18} strokeWidth={2.5} />
            </div>
            <span className="text-xs uppercase font-bold tracking-wider text-indigo-800/70 dark:text-indigo-200/70">Savings Rate</span>
          </div>
          <p className="text-3xl font-bold font-mono text-indigo-700 dark:text-indigo-300">{metrics.savingsRate}%</p>
        </div>
      </div>

      {/* Insights Engine */}
      <div className="bg-white dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex gap-4 items-start">
            <div className="p-3 rounded-full bg-sky-50 dark:bg-sky-500/10 text-sky-500 shrink-0 mt-0.5">
              <Wallet size={24} strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100 mb-1">Spending vs Net Worth</h4>
              {netWorth > 0 ? (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Your expenses this {timeframe === "custom" ? "period" : timeframe} represent <strong className="text-neutral-900 dark:text-neutral-200">{((metrics.totalExpenses / netWorth) * 100).toFixed(1)}%</strong> of your total liquid net worth (<strong className="text-neutral-900 dark:text-neutral-200">₹{netWorth.toLocaleString('en-IN')}</strong>).
                </p>
              ) : (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Net worth data is unavailable or zero. Add balances to your accounts to see this insight.</p>
              )}
            </div>
          </div>
          
          <div className="flex gap-4 items-start">
            <div className="p-3 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-500 shrink-0 mt-0.5">
              <Flame size={24} strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100 mb-1">Burn Rate Analysis</h4>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                At your current burn rate of <strong className="text-neutral-900 dark:text-neutral-200">₹{metrics.burnRate.toLocaleString('en-IN')}</strong> per day, 
                your net worth would last approximately <strong className="text-neutral-900 dark:text-neutral-200">{netWorth > 0 && metrics.burnRate > 0 ? Math.floor(netWorth / metrics.burnRate) : 0} days</strong> if all income stopped today.
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
