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
  FileText,
  Pencil,
  Trash2,
  ArrowDownToLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast, toastError } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { FieldLabel } from "@/components/ui/field-label";
import { AppDialog } from "@/components/ui/app-dialog";
import { formatPaymentMode, ACCOUNT_TYPE_OPTIONS } from "@/lib/account-labels";
import { getCategoryIcon } from "@/lib/category-icons";
import {
  createTransaction,
  createAccount,
  updateAccount,
  deleteAccount,
  type getDashboardData,
} from "@/app/actions";
import { CSVImportModal } from "./CSVImportModal";

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

export default function DashboardDashboard({ 
  initialData, 
  timeframe = "monthly" 
}: { 
  initialData: DashboardInitialData;
  timeframe?: "weekly" | "monthly" | "quarterly" | "yearly";
}) {
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
  const [showCSVModal, setShowCSVModal] = useState(false);

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
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

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
      if (editingAccountId) {
        await updateAccount(editingAccountId, {
          name: accForm.name,
          type: accForm.type,
          balance: Number(accForm.balance),
        });
        toast.success("Account updated successfully");
      } else {
        await createAccount({
          name: accForm.name,
          type: accForm.type,
          balance: Number(accForm.balance),
        });
        toast.success("Account created successfully");
      }

      setShowAccModal(false);
      setEditingAccountId(null);
      setAccForm({
        name: "",
        type: "BANK_ACCOUNT",
        balance: "",
      });
      router.refresh();
    } catch (err) {
      toastError(err, editingAccountId ? "Failed to update account" : "Failed to create account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!editingAccountId) return;
    setIsSubmitting(true);
    try {
      await deleteAccount(editingAccountId);
      setShowAccModal(false);
      setEditingAccountId(null);
      setIsConfirmingDelete(false);
      toast.success("Account deleted successfully");
      router.refresh();
    } catch (err) {
      toastError(err, "Failed to delete account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditAccount = (acc: any) => {
    setEditingAccountId(acc.id);
    setAccForm({
      name: acc.name,
      type: acc.type,
      balance: acc.balance.toString(),
    });
    setIsConfirmingDelete(false);
    setShowAccModal(true);
  };

  const openNewAccount = () => {
    setEditingAccountId(null);
    setAccForm({
      name: "",
      type: "BANK_ACCOUNT",
      balance: "",
    });
    setIsConfirmingDelete(false);
    setShowAccModal(true);
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
          <Button type="button" variant="outline-app" onClick={() => setShowCSVModal(true)}>
            Import CSV
          </Button>
          <Button type="button" variant="outline-app" onClick={openNewAccount}>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hero Net Worth Card */}
        <div className="col-span-1 sm:col-span-2 lg:col-span-4 bg-white dark:bg-[#111113] rounded-2xl p-6 sm:p-8 flex flex-col justify-center border border-black/[0.06] dark:border-white/[0.06] shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-2/3 h-full bg-gradient-to-l from-emerald-500/5 dark:from-emerald-500/10 to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-sm font-semibold text-neutral-500">Total Net Worth</span>
              <p className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900 dark:text-white">
                ₹{netWorth.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </p>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 dark:bg-[#1a1a1c] border border-black/[0.04] dark:border-white/[0.04] rounded-full self-start sm:self-end shrink-0">
              <Wallet size={14} className="text-neutral-400" />
              <span className="text-xs font-medium text-neutral-500">
                {accounts.length} Connected Account{accounts.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="panel-card p-5 space-y-3 shadow-sm shadow-black/[0.03] dark:shadow-none">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500">
            <ArrowUpRight size={16} strokeWidth={2.5} />
            <span className="text-[12px] font-bold uppercase tracking-wider">Income</span>
          </div>
          <p className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">₹{metrics.totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
        </div>

        <div className="panel-card p-5 space-y-3 shadow-sm shadow-black/[0.03] dark:shadow-none">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-500">
            <ArrowDownRight size={16} strokeWidth={2.5} />
            <span className="text-[12px] font-bold uppercase tracking-wider">Expenses</span>
          </div>
          <p className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">₹{metrics.totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
        </div>

        <div className="panel-card p-5 space-y-3 shadow-sm shadow-black/[0.03] dark:shadow-none">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-500">
            <TrendingUp size={16} strokeWidth={2.5} />
            <span className="text-[12px] font-bold uppercase tracking-wider">Saved</span>
          </div>
          <p className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">₹{metrics.savings.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
        </div>

        <div className="panel-card p-5 space-y-3 shadow-sm shadow-black/[0.03] dark:shadow-none">
          <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
            <Percent size={16} strokeWidth={2.5} />
            <span className="text-[12px] font-bold uppercase tracking-wider">Savings rate</span>
          </div>
          <p className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">{metrics.savingsRate}%</p>
        </div>
      </div>

      {/* Accounts */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Your accounts</h3>
          <span className="text-xs text-neutral-400">Payment method = account type</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => (
            <div key={acc.id} className="relative overflow-hidden rounded-2xl border border-black/[0.04] dark:border-white/[0.04] p-5 transition-transform hover:-translate-y-1 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-[#1a1a1c] dark:to-[#111113] shadow-sm">
              <div className="absolute -right-4 -bottom-4 p-4 opacity-[0.03] dark:opacity-[0.02] pointer-events-none">
                 <Wallet size={120} strokeWidth={1} />
              </div>
              <div className="relative z-10 space-y-8">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[15px] font-bold text-neutral-800 dark:text-neutral-200 truncate pr-6">{acc.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-white/60 dark:bg-black/40 text-neutral-500 backdrop-blur-sm shrink-0 border border-black/5 dark:border-white/5 shadow-sm">
                      {formatPaymentMode(acc.type)}
                    </span>
                    <button
                      type="button"
                      onClick={() => openEditAccount(acc)}
                      className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-md transition-colors"
                    >
                      <Pencil size={12} />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Balance</p>
                  <p className="text-2xl font-bold tracking-tight">₹{acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
                </div>
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
            <div className="w-32">
              <NativeSelect
                value={timeframe}
                onChange={(e) => router.push(`?timeframe=${e.target.value}`)}
                className="!text-xs !py-1 !h-8"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </NativeSelect>
            </div>
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
              <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                {transactions.map((tx) => {
                  const acc = accounts.find((a) => a.id === tx.accountId);
                  const cat = categories.find((c) => c.id === tx.categoryId);
                  const isIncome = tx.type === "INCOME" || tx.type === "REFUND";
                  const formattedAmount = `₹${tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

                  return (
                    <div key={tx.id} className="flex items-center p-3 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors relative group/item rounded-lg">
                      {/* Icon */}
                      <div className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center border border-black/[0.04] dark:border-white/[0.04]" style={{ backgroundColor: isIncome ? 'rgba(16, 185, 129, 0.1)' : cat ? `${cat.color}15` : 'rgba(163, 163, 163, 0.1)', color: isIncome ? '#10b981' : cat ? cat.color : '#a3a3a3' }}>
                        {isIncome ? <ArrowDownToLine size={16} /> : getCategoryIcon(cat?.name, 16)}
                      </div>
                      
                      {/* Title & Details */}
                      <div className="ml-3 flex-1 min-w-0 flex flex-col justify-center">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{tx.description}</p>
                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mt-0.5">
                          <span className="font-medium text-neutral-600 dark:text-neutral-400 truncate max-w-[120px]">
                            {new Date(tx.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </span>
                          <span>·</span>
                          <span className={cn(
                            "font-medium px-2 py-0.5 rounded-full text-[10px]",
                            isIncome ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : tx.type === "EXPENSE" ? "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                            : "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                          )}>
                            {tx.type}
                          </span>
                          <span className="font-medium text-neutral-600 dark:text-neutral-400 truncate hidden sm:inline-block max-w-[120px]">
                            {acc?.name || "—"}
                          </span>
                          {cat && <span className="hidden sm:inline-block">· {cat.name}</span>}
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="shrink-0 flex flex-col items-end justify-center min-w-[80px] pl-3">
                        <span className={cn(
                          "text-sm font-bold font-mono tracking-tight whitespace-nowrap",
                          isIncome ? "text-emerald-500 dark:text-emerald-400" : "text-neutral-900 dark:text-white"
                        )}>
                          {isIncome ? "+" : "−"}{formattedAmount}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
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
          <div className="space-y-5 pt-2">
            {goals.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400">
                No goals yet. <Link href="/goals" className="underline hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors">Create one</Link> with a target amount.
              </div>
            ) : (
              goals.map((g) => {
                const percent = g.targetAmount > 0
                  ? Math.min(Math.round((g.currentAmount / g.targetAmount) * 100), 100)
                  : 0;
                
                return (
                  <div key={g.id} className="group relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-500/20">
                          <Target size={14} />
                        </div>
                        <span className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">{g.name}</span>
                      </div>
                      <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded-md">{percent}%</span>
                    </div>
                    
                    <div className="w-full bg-neutral-100 dark:bg-[#1a1a1c] rounded-full h-1.5 overflow-hidden mb-1.5">
                      <div
                        className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between text-[11px]">
                      <div>
                        <span className="font-bold text-neutral-700 dark:text-neutral-300">₹{g.currentAmount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                        <span className="text-neutral-400 font-medium ml-1">saved</span>
                      </div>
                      <div className="text-neutral-400 font-medium">
                        Target <span className="font-semibold text-neutral-600 dark:text-neutral-400">₹{g.targetAmount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                      </div>
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
            <Link href="/budgets" className="text-xs text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors">
              View all
            </Link>
          </div>
          <p className="text-[11px] text-neutral-500 -mt-2">Target = monthly spending limit you set. Bar shows how much you&apos;ve used.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            {budgetProgress.slice(0, 4).map((b) => {
              const isOver = b.percentage >= 100;
              const isWarning = b.percentage >= 80 && !isOver;
              
              return (
                <div key={b.budget.id} className="group relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 truncate pr-4">{b.categoryName}</span>
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                      isOver ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                      : isWarning ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                      : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                    )}>
                      {b.percentage}%
                    </span>
                  </div>
                  
                  <div className="w-full bg-neutral-100 dark:bg-[#1a1a1c] rounded-full h-1.5 overflow-hidden mb-1.5">
                    <div
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-500 ease-out",
                        isOver ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"
                      )}
                      style={{ width: `${Math.min(b.percentage, 100)}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-[11px]">
                    <div>
                      <span className="font-bold text-neutral-700 dark:text-neutral-300">₹{b.spent.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                      <span className="text-neutral-400 font-medium ml-1">spent</span>
                    </div>
                    <div className="text-neutral-400 font-medium">
                      Target <span className="font-semibold text-neutral-600 dark:text-neutral-400">₹{Number(b.budget.amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      <CSVImportModal
        open={showCSVModal}
        onOpenChange={setShowCSVModal}
        accounts={accounts}
        categories={categories}
        incomeSources={incomeSources}
        importRules={initialData.importRules}
      />

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

      <AppDialog open={showAccModal} onOpenChange={setShowAccModal} title={editingAccountId ? "Edit Account" : "Add Account"}>
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
            <FieldLabel>{editingAccountId ? "Update Balance (INR)" : "Starting Balance (INR)"}</FieldLabel>
            <Input
              type="number"
              required
              placeholder="0.00"
              value={accForm.balance}
              onChange={(e) => setAccForm((prev) => ({ ...prev, balance: e.target.value }))}
              className="font-mono"
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <div>
              {editingAccountId && (
                isConfirmingDelete ? (
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="destructive-sm" onClick={handleDeleteAccount} disabled={isSubmitting}>
                      {isSubmitting && <Loader2 size={12} className="animate-spin" />}
                      Delete?
                    </Button>
                    <Button type="button" variant="unstyled" onClick={() => setIsConfirmingDelete(false)} className="text-xs px-2">
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button type="button" variant="unstyled" onClick={() => setIsConfirmingDelete(true)} className="text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 text-sm font-medium flex items-center gap-1 p-2 -ml-2">
                    <Trash2 size={14} />
                    Delete Account
                  </Button>
                )
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="cancel" onClick={() => setShowAccModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 size={12} className="animate-spin" />}
                {editingAccountId ? "Save Changes" : "Create"}
              </Button>
            </div>
          </div>
        </form>
      </AppDialog>
    </div>
  );
}
