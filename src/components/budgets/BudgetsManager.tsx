"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, AlertTriangle, AlertCircle, PieChart, Trash2, Loader2 } from "lucide-react";
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
      router.refresh();
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
                        <Button
                          type="button"
                          variant="destructive-sm"
                          onClick={() => handleDeleteBudget(bp.budget.id)}
                          className="p-1 text-[9px] font-bold"
                        >
                          Delete?
                        </Button>
                        <Button
                          type="button"
                          variant="unstyled"
                          onClick={() => setConfirmDeleteBudgetId(null)}
                          className="p-1 rounded bg-neutral-100 dark:bg-neutral-800 text-[9px] font-bold"
                        >
                          No
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="unstyled"
                        onClick={() => handleDeleteBudget(bp.budget.id)}
                        disabled={deletingBudgetId === bp.budget.id}
                        className="p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 text-neutral-300 dark:text-neutral-600 hover:text-red-500 transition-colors"
                        title="Delete budget"
                      >
                        {deletingBudgetId === bp.budget.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                      </Button>
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

      <AppDialog open={showAddBudget} onOpenChange={setShowAddBudget} title="Create Spending Budget">
        <form onSubmit={handleSubmit} className="space-y-3">
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

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="cancel" onClick={() => setShowAddBudget(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="submit">
              Create
            </Button>
          </div>
        </form>
      </AppDialog>
    </div>
  );
}
