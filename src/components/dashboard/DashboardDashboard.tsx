"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { cn } from "@/lib/utils";
import { toast, toastError } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { FieldLabel } from "@/components/ui/field-label";
import { AppDialog } from "@/components/ui/app-dialog";
import { formatPaymentMode, ACCOUNT_TYPE_OPTIONS } from "@/lib/account-labels";
import {
  createTransaction,
  createAccount,
  type getDashboardData,
} from "@/app/actions";

const DashboardTrendChart = dynamic(
  () => import("./DashboardCharts").then((m) => m.DashboardTrendChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 flex items-center justify-center text-xs text-neutral-400">Loading chart…</div>
    ),
  }
);

const DashboardCategoryChart = dynamic(
  () => import("./DashboardCharts").then((m) => m.DashboardCategoryChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 flex items-center justify-center text-xs text-neutral-400">Loading chart…</div>
    ),
  }
);

type DashboardInitialData = Awaited<ReturnType<typeof getDashboardData>>;

export default function DashboardDashboard({ initialData }: { initialData: DashboardInitialData }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const {
    accounts,
    transactions,
    budgets,
    budgetProgress,
    goals,
    groups,
    categories,
    incomeSources,
    reports: metrics,
    netWorth,
  } = initialData;

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

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
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
      router.refresh();
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
      router.refresh();
    } catch (err) {
      toastError(err, "Failed to create account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDark =
    mounted && typeof window !== "undefined" && document.documentElement.classList.contains("dark");

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in pb-20 md:pb-0">
      {/* Overview stats header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Overview</h2>
          <p className="text-sm text-neutral-500">Your monthly activity snapshot.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline-app" onClick={() => setShowAccModal(true)}>
            <Wallet size={14} />
            New Account
          </Button>
          <Button type="button" variant="cta" onClick={openTxModal}>
            <Plus size={14} />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="panel-card p-6 space-y-1 sm:col-span-2 lg:col-span-1 shadow-sm bg-white dark:bg-[#111113]">
          <span className="text-[13px] font-bold text-neutral-400 uppercase tracking-wider mb-1 block">Net worth</span>
          <p className="text-3xl font-bold font-mono tracking-tight">₹{netWorth.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-neutral-400 mt-2 font-medium">Across {accounts.length} account{accounts.length !== 1 ? "s" : ""}</p>
        </div>

        <div className="panel-card p-6 flex items-center justify-between shadow-sm bg-white dark:bg-[#111113]">
          <div className="space-y-1">
            <span className="text-[12px] font-bold text-neutral-400 uppercase tracking-wider mb-1 block">Income</span>
            <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-500 tracking-tight">₹{metrics.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-500 flex items-center justify-center shrink-0">
            <ArrowUpRight size={20} strokeWidth={2.5} />
          </div>
        </div>

        <div className="panel-card p-6 flex items-center justify-between shadow-sm bg-white dark:bg-[#111113]">
          <div className="space-y-1">
            <span className="text-[12px] font-bold text-neutral-400 uppercase tracking-wider mb-1 block">Expenses</span>
            <p className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-500 tracking-tight">₹{metrics.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-500 flex items-center justify-center shrink-0">
            <ArrowDownRight size={20} strokeWidth={2.5} />
          </div>
        </div>

        <div className="panel-card p-6 flex items-center justify-between shadow-sm bg-white dark:bg-[#111113]">
          <div className="space-y-1">
            <span className="text-[12px] font-bold text-neutral-400 uppercase tracking-wider mb-1 block">Saved</span>
            <p className="text-2xl font-bold font-mono tracking-tight">₹{metrics.savings.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 flex items-center justify-center shrink-0">
            <TrendingUp size={20} strokeWidth={2.5} />
          </div>
        </div>

        <div className="panel-card p-6 flex items-center justify-between shadow-sm bg-white dark:bg-[#111113]">
          <div className="space-y-1">
            <span className="text-[12px] font-bold text-neutral-400 uppercase tracking-wider mb-1 block">Savings rate</span>
            <p className="text-2xl font-bold font-mono tracking-tight">{metrics.savingsRate}%</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 flex items-center justify-center shrink-0">
            <Percent size={20} strokeWidth={2.5} />
          </div>
        </div>
      </div>

      {/* Accounts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Your accounts</h3>
          <span className="text-xs text-neutral-400">Payment method = account type</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {accounts.map((acc) => (
            <div key={acc.id} className="panel-card p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold truncate">{acc.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 shrink-0">
                  {formatPaymentMode(acc.type)}
                </span>
              </div>
              <p className="text-xl font-bold font-mono">₹{acc.balance.toLocaleString()}</p>
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
          {mounted ? <DashboardTrendChart metrics={metrics} /> : (
            <div className="h-64 flex items-center justify-center text-xs text-neutral-400">Loading chart…</div>
          )}
        </div>

        {/* Category breakdown (Donut) */}
        <div className="panel-card p-5 space-y-4">
          <h4 className="text-sm font-semibold">Spending by Category</h4>
          {mounted ? (
            <DashboardCategoryChart metrics={metrics} isDark={isDark} />
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-neutral-400">Loading chart…</div>
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
              transactions.map((tx) => {
                const acc = accounts.find((a) => a.id === tx.accountId);
                return (
                <div key={tx.id} className="flex items-center justify-between gap-3 py-2.5 border-b border-neutral-100 dark:border-neutral-800 last:border-none">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{tx.description}</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      {new Date(tx.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      {" · "}
                      {formatPaymentMode(acc?.type)}
                      {acc?.name ? ` · ${acc.name}` : ""}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-bold font-mono shrink-0",
                      tx.type === "INCOME" || tx.type === "REFUND"
                        ? "text-emerald-500"
                        : "text-neutral-900 dark:text-neutral-100"
                    )}
                  >
                    {tx.type === "INCOME" || tx.type === "REFUND" ? "+" : "−"}
                    ₹{tx.amount.toLocaleString()}
                  </span>
                </div>
              );
              })
            )}
          </div>
        </div>

        {/* Savings Goals */}
        <div className="panel-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Savings goals</h4>
            <Link href="/goals" className="text-xs text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200">
              Manage
            </Link>
          </div>
          <p className="text-[11px] text-neutral-500 -mt-2">Target = how much you want to save. Progress shows saved vs target.</p>
          <div className="space-y-4">
            {goals.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400">
                No goals yet. <Link href="/goals" className="underline">Create one</Link> with a target amount.
              </div>
            ) : (
              goals.map((g) => {
                const percent = g.targetAmount > 0
                  ? Math.min(Math.round((g.currentAmount / g.targetAmount) * 100), 100)
                  : 0;
                const remaining = Math.max(g.targetAmount - g.currentAmount, 0);
                return (
                  <div key={g.id} className="space-y-2 p-3 rounded-lg bg-neutral-50/50 dark:bg-neutral-900/30">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold truncate">{g.name}</span>
                      <span className="text-xs font-mono text-neutral-500">{percent}%</span>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 dark:bg-emerald-400 h-2 rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono">
                        <span className="text-emerald-600 font-semibold">₹{g.currentAmount.toLocaleString()}</span>
                        <span className="text-neutral-400"> saved</span>
                      </span>
                      <span className="font-mono text-neutral-500">
                        Target ₹{g.targetAmount.toLocaleString()}
                        {remaining > 0 && (
                          <span className="text-neutral-400"> · ₹{remaining.toLocaleString()} left</span>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Budget targets */}
      {budgetProgress && budgetProgress.length > 0 && (
        <div className="panel-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Budget targets</h4>
            <Link href="/budgets" className="text-xs text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200">
              View all
            </Link>
          </div>
          <p className="text-[11px] text-neutral-500 -mt-2">Target = monthly spending limit you set. Bar shows how much you&apos;ve used.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {budgetProgress.slice(0, 4).map((b) => (
              <div key={b.budget.id} className="p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{b.categoryName}</span>
                  <span className={cn(
                    "text-xs font-mono",
                    b.percentage >= 100 ? "text-rose-500" : b.percentage >= 80 ? "text-amber-500" : "text-neutral-500"
                  )}>
                    {b.percentage}%
                  </span>
                </div>
                <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5">
                  <div
                    className={cn(
                      "h-1.5 rounded-full",
                      b.percentage >= 100 ? "bg-rose-500" : b.percentage >= 80 ? "bg-amber-500" : "bg-emerald-500"
                    )}
                    style={{ width: `${Math.min(b.percentage, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-neutral-500 font-mono">
                  ₹{b.spent.toLocaleString()} of ₹{Number(b.budget.amount).toLocaleString()} target
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <AppDialog open={showTxModal} onOpenChange={setShowTxModal} title="Add Transaction">
        <form onSubmit={handleTxSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {["EXPENSE", "INCOME", "TRANSFER"].map((type) => (
              <Button
                key={type}
                type="button"
                variant={txForm.type === type ? "toggle-active" : "toggle-inactive"}
                className="w-full"
                onClick={() => setTxForm((prev) => ({ ...prev, type }))}
              >
                {type}
              </Button>
            ))}
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Amount (INR)</FieldLabel>
            <Input
              type="number"
              required
              placeholder="0.00"
              value={txForm.amount}
              onChange={(e) => setTxForm((prev) => ({ ...prev, amount: e.target.value }))}
              className="font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Pay from account</FieldLabel>
            <NativeSelect
              required
              value={txForm.accountId}
              onChange={(e) => setTxForm((prev) => ({ ...prev, accountId: e.target.value }))}
            >
              <option value="" disabled>Select account</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} · {formatPaymentMode(a.type)} (₹{a.balance})
                </option>
              ))}
            </NativeSelect>
            {txForm.accountId && (
              <p className="text-[10px] text-neutral-500">
                Payment method: {formatPaymentMode(accounts.find((a) => a.id === txForm.accountId)?.type)}
              </p>
            )}
          </div>

          {txForm.type === "TRANSFER" && (
            <div className="space-y-1.5">
              <FieldLabel>Transfer to</FieldLabel>
              {accounts.filter((a) => a.id !== txForm.accountId).length === 0 ? (
                <p className="text-xs text-amber-600 dark:text-amber-400">Create a second account to transfer between accounts.</p>
              ) : (
                <NativeSelect
                  required
                  value={txForm.transferToAccountId}
                  onChange={(e) => setTxForm((prev) => ({ ...prev, transferToAccountId: e.target.value }))}
                >
                  <option value="">Choose destination</option>
                  {accounts
                    .filter((a) => a.id !== txForm.accountId)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} · {formatPaymentMode(a.type)}
                      </option>
                    ))}
                </NativeSelect>
              )}
            </div>
          )}

          {txForm.type === "EXPENSE" && (
            <div className="space-y-1.5">
              <FieldLabel>Category</FieldLabel>
              <NativeSelect
                value={txForm.categoryId}
                onChange={(e) => setTxForm((prev) => ({ ...prev, categoryId: e.target.value }))}
              >
                <option value="">No Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
          )}

          {txForm.type === "INCOME" && (
            <div className="space-y-1.5">
              <FieldLabel>Income Source</FieldLabel>
              <NativeSelect
                value={txForm.incomeSourceId}
                onChange={(e) => setTxForm((prev) => ({ ...prev, incomeSourceId: e.target.value }))}
              >
                <option value="">No Source</option>
                {incomeSources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
          )}

          <div className="space-y-1.5">
            <FieldLabel>Description</FieldLabel>
            <Input
              type="text"
              placeholder="e.g. Starbucks Coffee"
              value={txForm.description}
              onChange={(e) => setTxForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Date</FieldLabel>
            <Input
              type="date"
              value={txForm.date}
              onChange={(e) => setTxForm((prev) => ({ ...prev, date: e.target.value }))}
              className="font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4">
            <Button type="button" variant="cancel" onClick={() => setShowTxModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 size={12} className="animate-spin" />}
              Add
            </Button>
          </div>
        </form>
      </AppDialog>

      <AppDialog open={showAccModal} onOpenChange={setShowAccModal} title="Add Account">
        <form onSubmit={handleAccSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <FieldLabel>Account Name</FieldLabel>
            <Input
              type="text"
              required
              placeholder="e.g. Salary Bank Account"
              value={accForm.name}
              onChange={(e) => setAccForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Payment method / account type</FieldLabel>
            <NativeSelect
              value={accForm.type}
              onChange={(e) => setAccForm((prev) => ({ ...prev, type: e.target.value }))}
            >
              {ACCOUNT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Starting Balance (INR)</FieldLabel>
            <Input
              type="number"
              required
              placeholder="0.00"
              value={accForm.balance}
              onChange={(e) => setAccForm((prev) => ({ ...prev, balance: e.target.value }))}
              className="font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4">
            <Button type="button" variant="cancel" onClick={() => setShowAccModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 size={12} className="animate-spin" />}
              Create
            </Button>
          </div>
        </form>
      </AppDialog>
    </div>
  );
}
