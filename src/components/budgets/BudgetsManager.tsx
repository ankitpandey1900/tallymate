"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, AlertTriangle, AlertCircle, PieChart, Trash2, Loader2, Check, X, Pencil, Wand2, ArrowUpRight, Filter, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { createBudget, updateBudget, deleteBudget, suggestBudgetLimit, type getBudgetsPageData } from "@/app/actions";
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

  // Sorting & Filtering
  const [filterType, setFilterType] = useState("ALL"); // ALL, PERSONAL, GROUP
  const [filterStatus, setFilterStatus] = useState("ALL"); // ALL, HEALTHY, WARNING, EXCEEDED
  const [sortBy, setSortBy] = useState("LIMIT_DESC"); // LIMIT_DESC, LIMIT_ASC, PCT_DESC, REMAINING_DESC

  // Form states
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null);
  const [confirmDeleteBudgetId, setConfirmDeleteBudgetId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [form, setForm] = useState({
    categoryId: "",
    groupId: "",
    amount: "",
    period: "MONTHLY",
    rollover: false,
    customAlerts: "80, 100",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
      .toISOString()
      .split("T")[0],
  });

  useEffect(() => {
    // We update state when initialData changes. `budgets` state is maintained even if only
    // rendered via budgetProgressList, ensuring the component updates properly.
    setBudgets(initialData.budgets);
    setCategories(initialData.categories);
    setGroups(initialData.groups);
    setBudgetProgressList(initialData.budgetProgressList);
  }, [initialData]);

  const resetForm = () => {
    setEditingBudgetId(null);
    setForm({
      categoryId: "",
      groupId: "",
      amount: "",
      period: "MONTHLY",
      rollover: false,
      customAlerts: "80, 100",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
        .toISOString()
        .split("T")[0],
    });
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddBudget(true);
  };

  const handleEditBudget = (bp: BudgetProgress) => {
    setEditingBudgetId(bp.budget.id);
    setForm({
      categoryId: bp.budget.categoryId || "",
      groupId: bp.budget.groupId || "",
      amount: bp.budget.amount.toString(),
      period: bp.budget.period,
      rollover: bp.budget.rollover || false,
      customAlerts: (bp.budget.customAlerts || [80, 100]).join(", "),
      startDate: new Date(bp.budget.startDate).toISOString().split("T")[0],
      endDate: new Date(bp.budget.endDate).toISOString().split("T")[0],
    });
    setShowAddBudget(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload = {
        categoryId: form.categoryId || null,
        groupId: form.groupId || undefined,
        amount: Number(form.amount),
        period: form.period as any,
        rollover: form.rollover,
        customAlerts: form.customAlerts.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0),
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      };

      if (editingBudgetId) {
        await updateBudget(editingBudgetId, payload);
      } else {
        await createBudget(payload);
      }

      setShowAddBudget(false);
      resetForm();
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

  const handleSuggestLimit = async () => {
    setIsSuggesting(true);
    try {
      const suggestedAmount = await suggestBudgetLimit(form.categoryId || null, form.groupId || undefined);
      setForm((prev) => ({ ...prev, amount: suggestedAmount.toString() }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsSuggesting(false);
    }
  };

  const filteredAndSortedBudgets = [...budgetProgressList]
    .filter((bp) => {
      // Type Filter
      if (filterType === "PERSONAL" && bp.budget.groupId) return false;
      if (filterType === "GROUP" && !bp.budget.groupId) return false;
      
      // Status Filter
      const limit = Number(bp.budget.amount);
      const percentage = limit > 0 ? (bp.spent / limit) * 100 : 0;
      if (filterStatus === "HEALTHY" && percentage >= 80) return false;
      if (filterStatus === "WARNING" && (percentage < 80 || percentage >= 100)) return false;
      if (filterStatus === "EXCEEDED" && percentage < 100) return false;
      
      return true;
    })
    .sort((a, b) => {
      const aLimit = Number(a.budget.amount);
      const bLimit = Number(b.budget.amount);
      const aPct = aLimit > 0 ? a.spent / aLimit : 0;
      const bPct = bLimit > 0 ? b.spent / bLimit : 0;
      const aRem = Math.max(aLimit - a.spent, 0);
      const bRem = Math.max(bLimit - b.spent, 0);

      switch (sortBy) {
        case "LIMIT_ASC": return aLimit - bLimit;
        case "PCT_DESC": return bPct - aPct;
        case "REMAINING_DESC": return bRem - aRem;
        case "LIMIT_DESC":
        default:
          return bLimit - aLimit;
      }
    });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">Budgets</h1>
          <p className="text-sm text-neutral-500 mt-1">Plan and monitor your spending</p>
        </div>
        <Button onClick={() => setShowAddBudget(true)} variant="default" className="shadow-sm">
          <Plus size={16} className="mr-2" />
          Create Budget
        </Button>
      </div>

      {/* Control Bar */}
      {budgetProgressList.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-2.5 rounded-xl">
          <div className="flex items-center gap-1.5 text-neutral-500 mr-2">
            <Filter size={14} />
            <span className="text-xs font-medium uppercase tracking-wider">Filter</span>
          </div>
          
          <NativeSelect value={filterType} onChange={(e) => setFilterType(e.target.value)} className="h-8 text-xs min-w-[120px]">
            <option value="ALL">All Types</option>
            <option value="PERSONAL">Personal Only</option>
            <option value="GROUP">Group Only</option>
          </NativeSelect>

          <NativeSelect value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-8 text-xs min-w-[120px]">
            <option value="ALL">All Statuses</option>
            <option value="HEALTHY">Healthy (&lt;80%)</option>
            <option value="WARNING">Near Limit (80-99%)</option>
            <option value="EXCEEDED">Exceeded (100%+)</option>
          </NativeSelect>

          <div className="flex items-center gap-1.5 text-neutral-500 ml-auto mr-2">
            <ArrowUpDown size={14} />
            <span className="text-xs font-medium uppercase tracking-wider">Sort</span>
          </div>

          <NativeSelect value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="h-8 text-xs min-w-[140px]">
            <option value="LIMIT_DESC">Highest Limit</option>
            <option value="LIMIT_ASC">Lowest Limit</option>
            <option value="PCT_DESC">Closest to Limit</option>
            <option value="REMAINING_DESC">Most Remaining</option>
          </NativeSelect>
        </div>
      )}

      {/* Budgets Grid */}
      {filteredAndSortedBudgets.length === 0 ? (
        <div className="panel-card p-12 text-center text-xs text-neutral-400 flex flex-col items-center justify-center">
          <PieChart size={32} className="text-neutral-300 dark:text-neutral-700 mb-2" />
          No budgets match your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedBudgets.map((bp) => {
            const isExceeded = bp.percentage >= 100;
            const isWarning90 = bp.percentage >= 90 && bp.percentage < 100;
            const isWarning80 = bp.percentage >= 80 && bp.percentage < 90;

            return (
              <div key={bp.budget.id} className="group flex flex-col justify-between bg-white dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] rounded-xl p-5 shadow-sm transition-all hover:shadow-md">
                <div className="flex flex-col mb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                      {bp.categoryName}
                      {bp.budget.rollover && (
                        <span className="flex items-center text-[10px] bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 px-1.5 py-0.5 rounded-sm uppercase font-bold tracking-wider" title="Rollover Active">
                          <ArrowUpRight size={10} className="mr-0.5" />
                          Rollover
                        </span>
                      )}
                    </h3>
                      {bp.groupName ? (
                        <p className="text-[12px] font-medium text-neutral-500 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          Group: {bp.groupName}
                        </p>
                      ) : (
                        <p className="text-[12px] font-medium text-neutral-500 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Personal Budget
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Status Badge */}
                      {isExceeded ? (
                        <span className="px-2 py-1 rounded-md bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider">
                          Exceeded
                        </span>
                      ) : isWarning90 ? (
                        <span className="px-2 py-1 rounded-md bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                          Warning
                        </span>
                      ) : isWarning80 ? (
                        <span className="px-2 py-1 rounded-md bg-yellow-50 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400 text-[10px] font-bold uppercase tracking-wider">
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
                          <div className="flex items-center bg-white dark:bg-neutral-900 rounded-md border border-red-200 dark:border-red-900 p-0.5 shadow-sm">
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
                          <div className="flex items-center space-x-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <Button
                              type="button"
                              variant="unstyled"
                              onClick={() => handleEditBudget(bp)}
                              className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                              title="Edit budget"
                            >
                              <Pencil size={14} />
                            </Button>
                            <Button
                              type="button"
                              variant="unstyled"
                              onClick={() => handleDeleteBudget(bp.budget.id)}
                              disabled={deletingBudgetId === bp.budget.id}
                              className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 text-neutral-400 hover:text-red-500"
                              title="Delete budget"
                            >
                              {deletingBudgetId === bp.budget.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rich Progress Section */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-end gap-2 mb-1">
                    <span className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white leading-none">
                      ₹{bp.spent.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-[13px] font-medium text-neutral-500 mb-0.5">
                      of ₹{bp.budget.amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden shadow-inner">
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
                      bp.remaining < 0 ? "text-rose-500" : "text-emerald-500"
                    )}>
                      {bp.remaining < 0 ? "-" : ""}₹{Math.abs(bp.remaining).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">Ends On</span>
                    <span className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300">
                      {new Date(bp.budget.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AppDialog
        open={showAddBudget}
        onOpenChange={(open) => {
          setShowAddBudget(open);
          if (!open) resetForm();
        }}
        title={editingBudgetId ? "Edit Budget" : "Create Budget"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5 relative">
              <div className="flex items-center justify-between">
                <FieldLabel>Target Amount (INR)</FieldLabel>
                <button 
                  type="button" 
                  onClick={handleSuggestLimit}
                  disabled={isSuggesting}
                  className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
                >
                  {isSuggesting ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                  Suggest
                </button>
              </div>
              <Input
                type="number"
                required
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                className="font-mono pr-8"
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

          <div className="space-y-1.5">
            <FieldLabel>Alert Thresholds (%)</FieldLabel>
            <Input
              type="text"
              required
              placeholder="e.g. 50, 80, 100"
              value={form.customAlerts}
              onChange={(e) => setForm((prev) => ({ ...prev, customAlerts: e.target.value }))}
              className="font-mono"
            />
            <p className="text-[10px] text-neutral-500">Comma-separated percentages. We'll notify you when spending crosses these marks.</p>
          </div>

          <label className="flex items-center gap-2 mt-4 cursor-pointer">
            <input
              type="checkbox"
              checked={form.rollover}
              onChange={(e) => setForm((prev) => ({ ...prev, rollover: e.target.checked }))}
              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Enable Rollover</span>
              <span className="text-xs text-neutral-500">Add unspent funds from previous budgets to this one</span>
            </div>
          </label>

          <div className="flex items-center justify-end gap-2 pt-4">
            <Button type="submit" variant="submit" className="flex-1 h-9" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                editingBudgetId ? "Save Changes" : "Create Budget"
              )}
            </Button>
          </div>
        </form>
      </AppDialog>
    </div>
  );
}
