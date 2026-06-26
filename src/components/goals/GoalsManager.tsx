"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Target, Calendar, Trash2, Loader2, Check, X } from "lucide-react";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import { createGoal, updateGoalProgress, deleteGoal, type getGoalsPageData } from "@/app/actions";
import { UnifiedGoal } from "@/lib/unified-db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldLabel } from "@/components/ui/field-label";
import { AppDialog } from "@/components/ui/app-dialog";

type GoalsInitialData = Awaited<ReturnType<typeof getGoalsPageData>>;

export default function GoalsManager({ initialData }: { initialData: GoalsInitialData }) {
  const router = useRouter();
  const [goals, setGoals] = useState<UnifiedGoal[]>(initialData.goals);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<UnifiedGoal | null>(null);

  // Forms
  const [form, setForm] = useState({
    name: "",
    targetAmount: "",
    currentAmount: "",
    deadline: "",
  });

  const [updateAmount, setUpdateAmount] = useState("");
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const [confirmDeleteGoalId, setConfirmDeleteGoalId] = useState<string | null>(null);

  useEffect(() => {
    setGoals(initialData.goals);
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.targetAmount) return;

    try {
      await createGoal({
        name: form.name,
        targetAmount: Number(form.targetAmount),
        currentAmount: Number(form.currentAmount || 0),
        deadline: form.deadline || undefined,
      });

      setShowAddGoal(false);
      setForm({ name: "", targetAmount: "", currentAmount: "", deadline: "" });
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !updateAmount) return;

    try {
      const newAmount = Number(updateAmount);
      await updateGoalProgress(selectedGoal.id, newAmount);
      
      if (selectedGoal.currentAmount < selectedGoal.targetAmount && newAmount >= selectedGoal.targetAmount) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399', '#059669', '#fbbf24', '#f59e0b'],
          disableForReducedMotion: true
        });
      }

      setShowUpdateModal(false);
      setUpdateAmount("");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (confirmDeleteGoalId !== goalId) { setConfirmDeleteGoalId(goalId); return; }
    setDeletingGoalId(goalId);
    setConfirmDeleteGoalId(null);
    try {
      await deleteGoal(goalId);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete goal";
      alert(message);
    } finally {
      setDeletingGoalId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Savings Goals</h2>
          <p className="text-sm text-neutral-500">Track targets for laptops, trips, or emergency funds.</p>
        </div>
        <Button type="button" variant="cta" className="self-start" onClick={() => setShowAddGoal(true)}>
          <Plus size={14} />
          Create Goal
        </Button>
      </div>

      {/* Goals cards grid */}
      {goals.length === 0 ? (
        <div className="panel-card p-12 text-center text-xs text-neutral-400 flex flex-col items-center justify-center">
          <Target size={32} className="text-neutral-300 dark:text-neutral-700 mb-2" />
          No financial goals established yet. Create one to begin tracking savings progress.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((g) => {
            const percent = Math.min(Math.round((g.currentAmount / g.targetAmount) * 100), 100);
            const isAchieved = percent >= 100;
            return (
              <div key={g.id} className="relative group overflow-hidden panel-card bg-white dark:bg-[#111113] border border-black/[0.04] dark:border-white/[0.04] p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between h-auto min-h-[12rem]">
                {/* Background glow for achieved goals */}
                {isAchieved && (
                  <div className="absolute -top-10 -right-10 w-32 h-32 blur-3xl rounded-full opacity-20 pointer-events-none transition-opacity bg-emerald-500" />
                )}

                <div className="space-y-4 mb-4 relative z-10 flex-1">
                  <div className="flex items-start justify-between">
                    <h3 className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100">{g.name}</h3>
                    <div className="flex items-center gap-2">
                      {isAchieved && (
                        <span className="px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                          Achieved
                        </span>
                      )}
                      
                      {/* Actions */}
                      <div className="flex items-center">
                        {confirmDeleteGoalId === g.id ? (
                          <div className="flex items-center bg-white dark:bg-neutral-900 rounded-md border border-red-200 dark:border-red-900 p-0.5 absolute right-0 top-0 shadow-sm z-20">
                            <span className="text-[10px] font-bold text-red-500 px-2">Sure?</span>
                            <Button
                              type="button"
                              variant="destructive-sm"
                              onClick={() => handleDeleteGoal(g.id)}
                              className="w-6 h-6 p-0 rounded-sm"
                            >
                              <Check size={12} />
                            </Button>
                            <Button
                              type="button"
                              variant="unstyled"
                              onClick={() => setConfirmDeleteGoalId(null)}
                              className="w-6 h-6 p-0 rounded-sm ml-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            >
                              <X size={12} />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="unstyled"
                            onClick={() => handleDeleteGoal(g.id)}
                            disabled={deletingGoalId === g.id}
                            className="p-1.5 rounded-md opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-red-50 dark:hover:bg-red-500/10 text-neutral-400 hover:text-red-500"
                            title="Delete goal"
                          >
                            {deletingGoalId === g.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rich Progress Section */}
                  <div className="space-y-2 mt-4">
                    <div className="flex items-end justify-between mb-1">
                      <span className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                        ₹{g.currentAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-[13px] font-medium text-neutral-500 mb-1.5">
                        of ₹{g.targetAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    
                    {/* Thick Progress Bar */}
                    <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500 ease-out",
                          isAchieved ? "bg-emerald-500" : "bg-indigo-500"
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-black/[0.04] dark:border-white/[0.04]">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">Deadline</span>
                    <span className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300 flex items-center gap-1.5">
                      <Calendar size={13} className="text-neutral-400" />
                      {g.deadline ? new Date(g.deadline).toLocaleDateString("en-IN", { month: 'short', day: 'numeric', year: 'numeric' }) : "No deadline"}
                    </span>
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline-app"
                    onClick={() => {
                      setSelectedGoal(g);
                      setUpdateAmount(String(g.currentAmount));
                      setShowUpdateModal(true);
                    }}
                    className="h-8 px-3 text-xs font-semibold"
                  >
                    Update
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AppDialog open={showAddGoal} onOpenChange={setShowAddGoal} title="Create Financial Goal">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <FieldLabel>Goal Name</FieldLabel>
            <Input
              type="text"
              required
              placeholder="e.g. MacBook Pro, Emergency Fund"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <FieldLabel>Target Amount</FieldLabel>
              <Input
                type="number"
                required
                placeholder="0.00"
                value={form.targetAmount}
                onChange={(e) => setForm((prev) => ({ ...prev, targetAmount: e.target.value }))}
                className="font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <FieldLabel>Initial Saved</FieldLabel>
              <Input
                type="number"
                placeholder="0.00"
                value={form.currentAmount}
                onChange={(e) => setForm((prev) => ({ ...prev, currentAmount: e.target.value }))}
                className="font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Target Deadline</FieldLabel>
            <Input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm((prev) => ({ ...prev, deadline: e.target.value }))}
              className="font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="cancel" onClick={() => setShowAddGoal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="submit">
              Save
            </Button>
          </div>
        </form>
      </AppDialog>

      <AppDialog
        open={showUpdateModal}
        onOpenChange={setShowUpdateModal}
        title="Adjust Savings Progress"
        maxWidth="max-w-sm"
      >
        {selectedGoal && (
          <>
            <p className="text-xs text-neutral-500">Update the current saved amount for &quot;{selectedGoal.name}&quot;.</p>
            <form onSubmit={handleUpdateProgress} className="space-y-4">
              <div className="space-y-1.5">
                <FieldLabel>Current Saved (INR)</FieldLabel>
                <Input
                  type="number"
                  required
                  placeholder="0.00"
                  value={updateAmount}
                  onChange={(e) => setUpdateAmount(e.target.value)}
                  className="font-mono text-lg py-6"
                />
                
                {/* Quick Add Chips */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {[500, 1000, 2000, 5000].map(amount => (
                    <Button
                      key={amount}
                      type="button"
                      variant="outline-app"
                      className="h-7 text-[11px] px-2.5 rounded-full"
                      onClick={() => setUpdateAmount(String(Number(updateAmount || 0) + amount))}
                    >
                      +₹{amount}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant="outline-app"
                    className="h-7 text-[11px] px-2.5 rounded-full text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                    onClick={() => setUpdateAmount(String(selectedGoal.targetAmount))}
                  >
                    Set to Max
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="cancel" onClick={() => setShowUpdateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="submit">
                  Update
                </Button>
              </div>
            </form>
          </>
        )}
      </AppDialog>
    </div>
  );
}
