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
    goals,
    groups,
    categories,
    incomeSources,
    reports: metrics,
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

      <AppDialog open={showTxModal} onOpenChange={setShowTxModal} title="Add Transaction">
        <form onSubmit={handleTxSubmit} className="space-y-3">
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
            <FieldLabel>Pay From Account</FieldLabel>
            <NativeSelect
              required
              value={txForm.accountId}
              onChange={(e) => setTxForm((prev) => ({ ...prev, accountId: e.target.value }))}
            >
              <option value="" disabled className="text-neutral-500">Select Account</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} (₹{a.balance})
                </option>
              ))}
            </NativeSelect>
          </div>

          {txForm.type === "TRANSFER" && (
            <div className="space-y-1.5">
              <FieldLabel>Transfer To Account</FieldLabel>
              <NativeSelect
                required
                value={txForm.transferToAccountId}
                onChange={(e) => setTxForm((prev) => ({ ...prev, transferToAccountId: e.target.value }))}
              >
                <option value="" disabled className="text-neutral-500">Select Target Account</option>
                {accounts
                  .filter((a) => a.id !== txForm.accountId)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
              </NativeSelect>
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

          <div className="flex items-center justify-end gap-2 pt-2">
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
        <form onSubmit={handleAccSubmit} className="space-y-3">
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
            <FieldLabel>Account Type</FieldLabel>
            <NativeSelect
              value={accForm.type}
              onChange={(e) => setAccForm((prev) => ({ ...prev, type: e.target.value }))}
            >
              <option value="CASH">Cash</option>
              <option value="BANK_ACCOUNT">Bank Account</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="DEBIT_CARD">Debit Card</option>
              <option value="UPI_WALLET">UPI Wallet</option>
              <option value="PAYTM">Paytm</option>
              <option value="PHONEPE">PhonePe</option>
              <option value="GOOGLE_PAY">Google Pay</option>
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

          <div className="flex items-center justify-end gap-2 pt-2">
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
