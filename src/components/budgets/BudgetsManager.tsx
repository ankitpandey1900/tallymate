"use client";

import React, { useState, useEffect } from "react";
import { Plus, AlertTriangle, AlertCircle, PieChart, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBudgets, getCategories, createBudget, deleteBudget, getTransactions, getGroups } from "@/app/actions";
import { UnifiedBudget, UnifiedCategory, UnifiedTransaction, UnifiedGroup } from "@/lib/unified-db";

interface BudgetProgress {
  budget: UnifiedBudget;
  categoryName: string;
  groupName: string | null;
  spent: number;
  remaining: number;
  percentage: number;
}

export default function BudgetsManager() {
  const [budgets, setBudgets] = useState<UnifiedBudget[]>([]);
  const [categories, setCategories] = useState<UnifiedCategory[]>([]);
  const [groups, setGroups] = useState<UnifiedGroup[]>([]);
  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([]);
  const [budgetProgressList, setBudgetProgressList] = useState<BudgetProgress[]>([]);

  // Form states
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null);
  const [confirmDeleteBudgetId, setConfirmDeleteBudgetId] = useState<string | null>(null);
  const [form, setForm] = useState({
    categoryId: "",
    groupId: "",
    amount: "",
    period: "MONTHLY",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
      .toISOString()
      .split("T")[0],
  });

  const loadData = async () => {
    try {
      const b = await getBudgets();
      setBudgets(b);
      const c = await getCategories();
      setCategories(c);
      const grps = await getGroups();
      setGroups(grps);
      const txs = await getTransactions();
      setTransactions(txs);

      // Map budget progress
      const progress = b.map((budget) => {
        const cat = c.find((catItem) => catItem.id === budget.categoryId);
        const grp = grps.find((g) => g.id === budget.groupId);

        // Calculate total spent in budget date range
        const spent = txs
          .filter((t) => {
            const isMatchCategory = !budget.categoryId || t.categoryId === budget.categoryId;
            const isMatchGroup = !budget.groupId || t.groupId === budget.groupId;
            const isExpense = t.type === "EXPENSE";
            const isDateInRange =
              new Date(t.date) >= new Date(budget.startDate) &&
              new Date(t.date) <= new Date(budget.endDate);

            return isMatchCategory && isMatchGroup && isExpense && isDateInRange;
          })
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const limit = Number(budget.amount);
        const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
        const remaining = Math.max(limit - spent, 0);

        return {
          budget,
          categoryName: cat?.name || "Overall Monthly",
          groupName: grp?.name || null,
          spent,
          remaining,
          percentage,
        };
      });

      setBudgetProgressList(progress);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount) return;

    try {
      await createBudget({
        categoryId: form.categoryId || null,
        groupId: form.groupId || undefined,
        amount: Number(form.amount),
        period: form.period,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      });

      setShowAddBudget(false);
      setForm({
        categoryId: "",
        groupId: "",
        amount: "",
        period: "MONTHLY",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
          .toISOString()
          .split("T")[0],
      });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (confirmDeleteBudgetId !== budgetId) { setConfirmDeleteBudgetId(budgetId); return; }
    setDeletingBudgetId(budgetId);
    setConfirmDeleteBudgetId(null);
    try {
      await deleteBudget(budgetId);
      await loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete budget";
      alert(message);
    } finally {
      setDeletingBudgetId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Budgets</h2>
          <p className="text-sm text-neutral-500">Plan limits to avoid overspending.</p>
        </div>
        <button
          onClick={() => setShowAddBudget(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#09090b] dark:bg-[#fafafa] text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-md text-xs font-semibold self-start"
        >
          <Plus size={14} />
          Create Budget
        </button>
      </div>

      {/* Budgets Grid */}
      {budgetProgressList.length === 0 ? (
        <div className="panel-card p-12 text-center text-xs text-neutral-400 flex flex-col items-center justify-center">
          <PieChart size={32} className="text-neutral-300 dark:text-neutral-700 mb-2" />
          No budgets set. Create one above to manage category or overall spending limits.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgetProgressList.map((bp) => {
            const isExceeded = bp.percentage >= 100;
            const isWarning90 = bp.percentage >= 90 && bp.percentage < 100;
            const isWarning80 = bp.percentage >= 80 && bp.percentage < 90;

            return (
              <div key={bp.budget.id} className="panel-card p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">{bp.categoryName}</h3>
                    {bp.groupName && (
                      <p className="text-[10px] uppercase font-bold text-neutral-400 font-mono mt-0.5">
                        Group: {bp.groupName}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isExceeded ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-[9px] font-bold uppercase tracking-wider">
                        <AlertCircle size={10} />
                        Exceeded
                      </span>
                    ) : isWarning90 ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 text-[9px] font-bold uppercase tracking-wider">
                        <AlertTriangle size={10} />
                        Warning 90%
                      </span>
                    ) : isWarning80 ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 dark:text-yellow-400 text-[9px] font-bold uppercase tracking-wider">
                        <AlertTriangle size={10} />
                        Warning 80%
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold uppercase tracking-wider">
                        Healthy
                      </span>
                    )}
                    {/* Delete button */}
                    {confirmDeleteBudgetId === bp.budget.id ? (
                      <>
                        <button onClick={() => handleDeleteBudget(bp.budget.id)} className="p-1 rounded bg-red-500 text-white text-[9px] font-bold">Delete?</button>
                        <button onClick={() => setConfirmDeleteBudgetId(null)} className="p-1 rounded bg-neutral-100 dark:bg-neutral-800 text-[9px] font-bold">No</button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleDeleteBudget(bp.budget.id)}
                        disabled={deletingBudgetId === bp.budget.id}
                        className="p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 text-neutral-300 dark:text-neutral-600 hover:text-red-500 transition-colors"
                        title="Delete budget"
                      >
                        {deletingBudgetId === bp.budget.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={cn(
                        "h-2 rounded-full",
                        isExceeded
                          ? "bg-red-500"
                          : isWarning90 || isWarning80
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      )}
                      style={{ width: `${Math.min(bp.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                    <span>Spent: ₹{bp.spent.toLocaleString()}</span>
                    <span>Limit: ₹{bp.budget.amount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[10px] text-neutral-400 font-mono">
                  <span>Remains: ₹{bp.remaining.toLocaleString()}</span>
                  <span>Ends: {new Date(bp.budget.endDate).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Budget Dialog */}
      {showAddBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div
            className="fixed inset-0"
            onClick={() => setShowAddBudget(false)}
          />
          <div className="panel-card bg-white dark:bg-[#18181b] w-full max-w-md p-6 relative z-10 space-y-4 shadow-xl">
            <h3 className="text-base font-bold">Create Spending Budget</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Target Amount (INR)</label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-black/[0.04] dark:border-neutral-800 rounded-md text-sm bg-transparent font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Budget Category</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full px-3 py-2 border border-black/[0.04] dark:border-neutral-800 rounded-md text-sm bg-transparent"
                >
                  <option value="">Overall Monthly Budget (No Category)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Link to Group (Optional)</label>
                <select
                  value={form.groupId}
                  onChange={(e) => setForm((prev) => ({ ...prev, groupId: e.target.value }))}
                  className="w-full px-3 py-2 border border-black/[0.04] dark:border-neutral-800 rounded-md text-sm bg-transparent"
                >
                  <option value="">Personal Budget (No Group Link)</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">Start Date</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-black/[0.04] dark:border-neutral-800 rounded-md text-sm bg-transparent font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">End Date</label>
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-black/[0.04] dark:border-neutral-800 rounded-md text-sm bg-transparent font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBudget(false)}
                  className="px-4 py-2 border border-[#e4e4e7] dark:border-[#27272a] hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-md text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#09090b] dark:bg-[#fafafa] hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-black rounded-md text-xs font-semibold shadow-xs"
                >
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
