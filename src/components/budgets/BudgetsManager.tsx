"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, AlertTriangle, AlertCircle, PieChart, Trash2, Loader2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { createBudget, deleteBudget, type getBudgetsPageData } from "@/app/actions";
import { UnifiedBudget, UnifiedCategory, UnifiedGroup } from "@/lib/unified-db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { FieldLabel } from "@/components/ui/field-label";
import { AppDialog } from "@/components/ui/app-dialog";

type BudgetsInitialData = Awaited<ReturnType<typeof getBudgetsPageData>>;
type BudgetProgress = BudgetsInitialData["budgetProgressList"][number];

export default function BudgetsManager({ initialData }: { initialData: BudgetsInitialData }) {
  const router = useRouter();
  const [budgets, setBudgets] = useState<UnifiedBudget[]>(initialData.budgets);
  const [categories, setCategories] = useState<UnifiedCategory[]>(initialData.categories);
  const [groups, setGroups] = useState<UnifiedGroup[]>(initialData.groups);
  const [budgetProgressList, setBudgetProgressList] = useState<BudgetProgress[]>(initialData.budgetProgressList);

  // Form states
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null);
  const [confirmDeleteBudgetId, setConfirmDeleteBudgetId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  useEffect(() => {
    setBudgets(initialData.budgets);
    setCategories(initialData.categories);
    setGroups(initialData.groups);
    setBudgetProgressList(initialData.budgetProgressList);
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || isSubmitting) return;

    setIsSubmitting(true);
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
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (confirmDeleteBudgetId !== budgetId) { setConfirmDeleteBudgetId(budgetId); return; }
    setDeletingBudgetId(budgetId);
    setConfirmDeleteBudgetId(null);
    try {
      await deleteBudget(budgetId);
      router.refresh();
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
        <Button type="button" variant="cta" className="self-start" onClick={() => setShowAddBudget(true)}>
          <Plus size={14} />
          Create Budget
        </Button>
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
              <div key={bp.budget.id} className="relative group overflow-hidden panel-card bg-white dark:bg-[#111113] border border-black/[0.04] dark:border-white/[0.04] p-5 shadow-sm transition-all hover:shadow-md">
                {/* Background glow for critical budgets */}
                {(isExceeded || isWarning90) && (
                  <div className={cn(
                    "absolute -top-10 -right-10 w-32 h-32 blur-3xl rounded-full opacity-20 pointer-events-none transition-opacity",
                    isExceeded ? "bg-red-500" : "bg-amber-500"
                  )} />
                )}

                <div className="flex items-start justify-between mb-6 relative">
                  <div>
                    <h3 className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100">{bp.categoryName}</h3>
                    {bp.groupName ? (
                      <p className="text-[11px] font-medium text-neutral-500 mt-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        Group: {bp.groupName}
                      </p>
                    ) : (
                      <p className="text-[11px] font-medium text-neutral-500 mt-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Personal Budget
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Status Badge */}
                    {isExceeded ? (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider">
                        <AlertCircle size={12} />
                        Exceeded
                      </span>
                    ) : isWarning90 ? (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                        <AlertTriangle size={12} />
                        Warning
                      </span>
                    ) : isWarning80 ? (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-yellow-50 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400 text-[10px] font-bold uppercase tracking-wider">
                        <AlertTriangle size={12} />
                        Near Limit
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                        Healthy
                      </span>
                    )}

                    {/* Actions */}
                    <div className="flex items-center">
                      {confirmDeleteBudgetId === bp.budget.id ? (
                        <div className="flex items-center bg-white dark:bg-neutral-900 rounded-md border border-red-200 dark:border-red-900 p-0.5 absolute right-0 top-0 shadow-sm z-10">
                          <span className="text-[10px] font-bold text-red-500 px-2">Sure?</span>
                          <Button
                            type="button"
                            variant="destructive-sm"
                            onClick={() => handleDeleteBudget(bp.budget.id)}
                            className="w-6 h-6 p-0 rounded-sm"
                          >
                            <Check size={12} />
                          </Button>
                          <Button
                            type="button"
                            variant="unstyled"
                            onClick={() => setConfirmDeleteBudgetId(null)}
                            className="w-6 h-6 p-0 rounded-sm ml-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          >
                            <X size={12} />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="unstyled"
                          onClick={() => handleDeleteBudget(bp.budget.id)}
                          disabled={deletingBudgetId === bp.budget.id}
                          className="p-1.5 rounded-md opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-red-50 dark:hover:bg-red-500/10 text-neutral-400 hover:text-red-500"
                          title="Delete budget"
                        >
                          {deletingBudgetId === bp.budget.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rich Progress Section */}
                <div className="space-y-2 mb-5">
                  <div className="flex items-end justify-between mb-1">
                    <span className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                      ₹{bp.spent.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[13px] font-medium text-neutral-500 mb-1.5">
                      of ₹{bp.budget.amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  
                  {/* Thick Progress Bar */}
                  <div className="w-full bg-neutral-100 dark:bg-[#1a1a1c] rounded-full h-2 overflow-hidden shadow-inner">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500 ease-out",
                        isExceeded
                          ? "bg-rose-500"
                          : isWarning90 || isWarning80
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      )}
                      style={{ width: `${Math.min(bp.percentage, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Footer Stats */}
                <div className="flex items-center justify-between pt-4 border-t border-black/[0.04] dark:border-white/[0.04]">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">Remaining</span>
                    <span className={cn(
                      "text-[13px] font-bold",
                      bp.remaining < 0 ? "text-rose-500" : "text-emerald-600 dark:text-emerald-400"
                    )}>
                      {bp.remaining < 0 ? "-" : ""}₹{Math.abs(bp.remaining).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">Ends On</span>
                    <span className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300">
                      {new Date(bp.budget.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AppDialog open={showAddBudget} onOpenChange={setShowAddBudget} title="Create Spending Budget">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <FieldLabel>Target Amount (INR)</FieldLabel>
            <Input
              type="number"
              required
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
              className="font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Budget Category</FieldLabel>
            <NativeSelect
              value={form.categoryId}
              onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
            >
              <option value="">Overall Monthly Budget (No Category)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Link to Group (Optional)</FieldLabel>
            <NativeSelect
              value={form.groupId}
              onChange={(e) => setForm((prev) => ({ ...prev, groupId: e.target.value }))}
            >
              <option value="">Personal Budget (No Group Link)</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <FieldLabel>Start Date</FieldLabel>
              <Input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                className="font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <FieldLabel>End Date</FieldLabel>
              <Input
                type="date"
                required
                value={form.endDate}
                onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                className="font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4">
            <Button type="button" variant="cancel" onClick={() => setShowAddBudget(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </AppDialog>
    </div>
  );
}
