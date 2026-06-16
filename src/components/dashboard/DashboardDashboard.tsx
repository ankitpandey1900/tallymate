"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Percent,
  Wallet,
  Users,
  Target,
  ArrowRight,
  TrendingUp,
  Loader2,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import { toast, toastError } from "@/lib/toast";
import {
  getDashboardData,
  createTransaction,
  createAccount,
} from "@/app/actions";
import {
  UnifiedAccount,
  UnifiedTransaction,
  UnifiedBudget,
  UnifiedGoal,
  UnifiedGroup,
  UnifiedCategory,
  UnifiedIncomeSource,
} from "@/lib/unified-db";

const COLORS = ["#000000", "#4b5563", "#9ca3af", "#d1d5db", "#e5e7eb"];
const COLORS_DARK = ["#ffffff", "#a1a1aa", "#71717a", "#52525b", "#3f3f46"];

type DashboardInitialData = Awaited<ReturnType<typeof getDashboardData>>;

export default function DashboardDashboard({ initialData }: { initialData?: DashboardInitialData }) {
  const [mounted, setMounted] = useState(false);
  const [accounts, setAccounts] = useState<UnifiedAccount[]>(initialData?.accounts ?? []);
  const [transactions, setTransactions] = useState<UnifiedTransaction[]>(initialData?.transactions ?? []);
  const [budgets, setBudgets] = useState<UnifiedBudget[]>(initialData?.budgets ?? []);
  const [goals, setGoals] = useState<UnifiedGoal[]>(initialData?.goals ?? []);
  const [groups, setGroups] = useState<UnifiedGroup[]>(initialData?.groups ?? []);
  const [categories, setCategories] = useState<UnifiedCategory[]>(initialData?.categories ?? []);
  const [incomeSources, setIncomeSources] = useState<UnifiedIncomeSource[]>(initialData?.incomeSources ?? []);
  
  const defaultMetrics = {
    totalIncome: 0,
    totalExpenses: 0,
    savings: 0,
    savingsRate: 0,
    averageDailySpending: 0,
    categoryTrends: [] as { name: string; value: number }[],
    incomeBreakdown: [] as { name: string; value: number }[],
  };

  // Reports metrics
  const [metrics, setMetrics] = useState(() => (initialData?.reports ? initialData.reports : defaultMetrics));

  // Modal triggers
  const [showTxModal, setShowTxModal] = useState(false);
  const [showAccModal, setShowAccModal] = useState(false);

  // Forms
  const [txForm, setTxForm] = useState({
    amount: "",
    type: "EXPENSE",
    accountId: "",
    categoryId: "",
    incomeSourceId: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    transferToAccountId: "",
  });

  const [accForm, setAccForm] = useState({
    name: "",
    type: "BANK_ACCOUNT",
    balance: "",
  });

  const [isLoading, setIsLoading] = useState(!initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) {
        setIsLoading(true);
      }
      const data = await getDashboardData("monthly");
      setAccounts(data.accounts);
      setTransactions(data.transactions);
      setMetrics(data.reports);
      setBudgets(data.budgets);
      setGoals(data.goals);
      setGroups(data.groups);
      setCategories(data.categories);
      setIncomeSources(data.incomeSources);
    } catch (err) {
      toastError(err, "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (!initialData) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openTxModal = () => {
    if (accounts.length === 0) {
      toast.error("Create an account first before adding transactions.");
      setShowAccModal(true);
      return;
    }
    setTxForm({
      amount: "",
      type: "EXPENSE",
      accountId: accounts[0]?.id || "",
      categoryId: "",
      incomeSourceId: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      transferToAccountId: "",
    });
    setShowTxModal(true);
  };

  const handleTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.amount || !txForm.accountId) {
      toast.error("Amount and account are required.");
      return;
    }
    if (txForm.type === "TRANSFER" && !txForm.transferToAccountId) {
      toast.error("Select a target account for the transfer.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createTransaction({
        accountId: txForm.accountId,
        type: txForm.type,
        scope: "PERSONAL",
        amount: Number(txForm.amount),
        date: new Date(txForm.date).toISOString(),
        description: txForm.description || txForm.type,
        tags: [],
        categoryId: txForm.type === "EXPENSE" ? txForm.categoryId || undefined : undefined,
        incomeSourceId: txForm.type === "INCOME" ? txForm.incomeSourceId || undefined : undefined,
        transferToAccountId: txForm.type === "TRANSFER" ? txForm.transferToAccountId || undefined : undefined,
      });

      setShowTxModal(false);
      toast.success("Transaction recorded successfully");
      await loadData({ silent: true });
    } catch (err) {
      toastError(err, "Failed to record transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accForm.name || !accForm.balance) {
      toast.error("Account name and balance are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createAccount({
        name: accForm.name,
        type: accForm.type,
        balance: Number(accForm.balance),
      });

      setShowAccModal(false);
      setAccForm({
        name: "",
        type: "BANK_ACCOUNT",
        balance: "",
      });
      toast.success("Account created successfully");
      await loadData({ silent: true });
    } catch (err) {
      toastError(err, "Failed to create account");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Safe chart data mapping
  const chartData = [
    { name: "Week 1", Income: metrics.totalIncome * 0.2, Expense: metrics.totalExpenses * 0.15 },
    { name: "Week 2", Income: metrics.totalIncome * 0.35, Expense: metrics.totalExpenses * 0.3 },
    { name: "Week 3", Income: metrics.totalIncome * 0.15, Expense: metrics.totalExpenses * 0.25 },
    { name: "Week 4", Income: metrics.totalIncome * 0.3, Expense: metrics.totalExpenses * 0.3 },
  ];

  const categoriesColors = (mounted && typeof window !== "undefined" && document.documentElement.classList.contains("dark")) ? COLORS_DARK : COLORS;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        <p className="text-sm text-neutral-500 font-medium">Syncing workspace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in pb-20 md:pb-0">
      {/* Overview stats header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Overview</h2>
          <p className="text-sm text-neutral-500">Your monthly activity snapshot.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAccModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 border border-[#e4e4e7] dark:border-[#27272a] hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-md text-xs font-semibold"
          >
            <Wallet size={14} />
            New Account
          </button>
          <button
            onClick={openTxModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#09090b] dark:bg-[#fafafa] hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-black rounded-md text-xs font-semibold shadow-xs"
          >
            <Plus size={14} />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Income Card */}
        <div className="panel-card p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Total Income</span>
            <p className="text-2xl font-bold font-mono">₹{metrics.totalIncome.toLocaleString()}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center">
            <ArrowUpRight size={20} />
          </div>
        </div>

        {/* Expense Card */}
        <div className="panel-card p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Total Expenses</span>
            <p className="text-2xl font-bold font-mono">₹{metrics.totalExpenses.toLocaleString()}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-600 flex items-center justify-center">
            <ArrowDownRight size={20} />
          </div>
        </div>

        {/* Savings Card */}
        <div className="panel-card p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Net Savings</span>
            <p className="text-2xl font-bold font-mono">₹{metrics.savings.toLocaleString()}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-600 flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
        </div>

        {/* Savings Rate Card */}
        <div className="panel-card p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Savings Rate</span>
            <p className="text-2xl font-bold font-mono">{metrics.savingsRate}%</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center">
            <Percent size={18} />
          </div>
        </div>
      </div>

      {/* Accounts display bar */}
      <div className="space-y-3">
        <h3 className="text-xs uppercase font-bold tracking-wider text-neutral-400">Your Accounts</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {accounts.map((acc) => (
            <div key={acc.id} className="panel-card p-4 flex flex-col justify-between h-24">
              <span className="text-xs font-semibold text-neutral-500">{acc.name}</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono">
                  ₹{acc.balance.toLocaleString()}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-black/[0.04] dark:border-neutral-800 text-neutral-500 font-mono">
                  {acc.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid for Analytics and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="panel-card p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Income vs Expense Trend</h4>
            <span className="text-xs text-neutral-400">Weekly breakdown</span>
          </div>
          <div className="h-64 w-full min-h-[256px]" style={{ minWidth: 0 }}>
            {mounted && (
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
                  <Area
                    type="monotone"
                    dataKey="Income"
                    stroke="#10b981"
                    fillOpacity={0.06}
                    fill="#10b981"
                  />
                  <Area
                    type="monotone"
                    dataKey="Expense"
                    stroke="#ef4444"
                    fillOpacity={0.06}
                    fill="#ef4444"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category breakdown (Donut) */}
        <div className="panel-card p-5 space-y-4">
          <h4 className="text-sm font-semibold">Spending by Category</h4>
          {metrics.categoryTrends.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-neutral-400">
              No expense data recorded this month.
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="h-44 w-full min-h-[176px] relative" style={{ minWidth: 0 }}>
                {mounted && (
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
                          <Cell
                            key={`cell-${index}`}
                            fill={categoriesColors[index % categoriesColors.length]}
                          />
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
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-2">
                {metrics.categoryTrends.slice(0, 4).map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs text-neutral-500">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: categoriesColors[index % categoriesColors.length],
                      }}
                    />
                    <span className="truncate max-w-[80px]">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="panel-card p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Recent Transactions</h4>
            <Link
              href="/transactions"
              className="text-xs text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 flex items-center gap-1"
            >
              See all
              <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-400">
                No recent transactions.
              </div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-none">
                  <div>
                    <p className="text-xs font-semibold">{tx.description}</p>
                    <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                      {new Date(tx.date).toLocaleDateString()} • {tx.scope}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-xs font-bold font-mono",
                      tx.type === "INCOME" || tx.type === "REFUND"
                        ? "text-emerald-500"
                        : "text-neutral-900 dark:text-neutral-100"
                    )}
                  >
                    {tx.type === "INCOME" || tx.type === "REFUND" ? "+" : "-"}
                    ₹{tx.amount.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Savings Goals Widgets */}
        <div className="panel-card p-5 space-y-4">
          <h4 className="text-sm font-semibold">Financial Goals</h4>
          <div className="space-y-4">
            {goals.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-400">
                No active savings goals.
              </div>
            ) : (
              goals.map((g) => {
                const percent = Math.min(Math.round((g.currentAmount / g.targetAmount) * 100), 100);
                return (
                  <div key={g.id} className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold">{g.name}</span>
                      <span className="text-neutral-400 font-mono">{percent}%</span>
                    </div>
                    <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-neutral-900 dark:bg-white h-1.5 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                      <span>Saved: ₹{g.currentAmount.toLocaleString()}</span>
                      <span>Target: ₹{g.targetAmount.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Add Transaction Dialog Modal */}
      {showTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div
            className="fixed inset-0"
            onClick={() => setShowTxModal(false)}
          />
          <div className="panel-card bg-white dark:bg-[#18181b] w-full max-w-md p-6 relative z-10 space-y-4 shadow-xl">
            <h3 className="text-base font-bold">Add Transaction</h3>
            <form onSubmit={handleTxSubmit} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {["EXPENSE", "INCOME", "TRANSFER"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setTxForm((prev) => ({ ...prev, type }))}
                    className={cn(
                      "py-2 rounded-md text-xs font-semibold border transition-colors",
                      txForm.type === type
                        ? "bg-[#09090b] text-white border-black dark:bg-[#fafafa] dark:text-black dark:border-white"
                        : "border-black/[0.04] dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Amount (INR)</label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={txForm.amount}
                  onChange={(e) => setTxForm((prev) => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-black/[0.04] dark:border-neutral-800 rounded-md text-sm bg-transparent font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Pay From Account</label>
                <select
                  required
                  value={txForm.accountId}
                  onChange={(e) => setTxForm((prev) => ({ ...prev, accountId: e.target.value }))}
                  className="w-full px-3 py-2 border border-black/[0.04] dark:border-neutral-800 rounded-md text-sm bg-transparent"
                >
                  <option value="" disabled className="text-neutral-500">Select Account</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (₹{a.balance})
                    </option>
                  ))}
                </select>
              </div>

              {txForm.type === "TRANSFER" && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">Transfer To Account</label>
                  <select
                    required
                    value={txForm.transferToAccountId}
                    onChange={(e) => setTxForm((prev) => ({ ...prev, transferToAccountId: e.target.value }))}
                    className="w-full px-3 py-2 border border-black/[0.04] dark:border-neutral-800 rounded-md text-sm bg-transparent"
                  >
                    <option value="" disabled className="text-neutral-500">Select Target Account</option>
                    {accounts
                      .filter((a) => a.id !== txForm.accountId)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {txForm.type === "EXPENSE" && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">Category</label>
                  <select
                    value={txForm.categoryId}
                    onChange={(e) => setTxForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                    className="w-full px-3 py-2 border border-black/[0.04] dark:border-neutral-800 rounded-md text-sm bg-transparent"
                  >
                    <option value="">No Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {txForm.type === "INCOME" && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">Income Source</label>
                  <select
                    value={txForm.incomeSourceId}
                    onChange={(e) => setTxForm((prev) => ({ ...prev, incomeSourceId: e.target.value }))}
                    className="w-full px-3 py-2 border border-black/[0.04] dark:border-neutral-800 rounded-md text-sm bg-transparent"
                  >
                    <option value="">No Source</option>
                    {incomeSources.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Starbucks Coffee"
                  value={txForm.description}
                  onChange={(e) => setTxForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-black/[0.04] dark:border-neutral-800 rounded-md text-sm bg-transparent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Date</label>
                <input
                  type="date"
                  value={txForm.date}
                  onChange={(e) => setTxForm((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-black/[0.04] dark:border-neutral-800 rounded-md text-sm bg-transparent font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTxModal(false)}
                  className="px-4 py-2 border border-[#e4e4e7] dark:border-[#27272a] hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-md text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#09090b] dark:bg-[#fafafa] hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-black rounded-md text-xs font-semibold shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 size={12} className="animate-spin" />}
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      {showAccModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div
            className="fixed inset-0"
            onClick={() => setShowAccModal(false)}
          />
          <div className="panel-card bg-white dark:bg-[#18181b] w-full max-w-md p-6 relative z-10 space-y-4 shadow-xl">
            <h3 className="text-base font-bold">Add Account</h3>
            <form onSubmit={handleAccSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Account Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Salary Bank Account"
                  value={accForm.name}
                  onChange={(e) => setAccForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-black/[0.04] dark:border-neutral-800 rounded-md text-sm bg-transparent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Account Type</label>
                <select
                  value={accForm.type}
                  onChange={(e) => setAccForm((prev) => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-black/[0.04] dark:border-neutral-800 rounded-md text-sm bg-transparent"
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_ACCOUNT">Bank Account</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="DEBIT_CARD">Debit Card</option>
                  <option value="UPI_WALLET">UPI Wallet</option>
                  <option value="PAYTM">Paytm</option>
                  <option value="PHONEPE">PhonePe</option>
                  <option value="GOOGLE_PAY">Google Pay</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Starting Balance (INR)</label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={accForm.balance}
                  onChange={(e) => setAccForm((prev) => ({ ...prev, balance: e.target.value }))}
                  className="w-full px-3 py-2 border border-black/[0.04] dark:border-neutral-800 rounded-md text-sm bg-transparent font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAccModal(false)}
                  className="px-4 py-2 border border-[#e4e4e7] dark:border-[#27272a] hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-md text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#09090b] dark:bg-[#fafafa] hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-black rounded-md text-xs font-semibold shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 size={12} className="animate-spin" />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
