"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Target, Calendar, Trash2, Loader2 } from "lucide-react";
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
      await updateGoalProgress(selectedGoal.id, Number(updateAmount));
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
            return (
              <div key={g.id} className="panel-card p-5 flex flex-col justify-between h-48 group">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-semibold">{g.name}</h3>
                    <div className="flex items-center gap-1">
                      {percent >= 100 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-[8px] font-bold uppercase tracking-wider">
                          Achieved
                        </span>
                      )}
                      {confirmDeleteGoalId === g.id ? (
                        <>
                          <Button
                            type="button"
                            variant="destructive-sm"
                            onClick={() => handleDeleteGoal(g.id)}
                            className="p-1 text-[9px] font-bold"
                          >
                            Delete?
                          </Button>
                          <Button
                            type="button"
                            variant="unstyled"
                            onClick={() => setConfirmDeleteGoalId(null)}
                            className="p-1 rounded bg-neutral-100 dark:bg-neutral-800 text-[9px] font-bold"
                          >
                            No
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          variant="unstyled"
                          onClick={() => handleDeleteGoal(g.id)}
                          disabled={deletingGoalId === g.id}
                          className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-950/30 text-neutral-400 hover:text-red-500 transition-all"
                        >
                          {deletingGoalId === g.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
                    <span>₹{g.currentAmount.toLocaleString()} saved</span>
                    <span>Target: ₹{g.targetAmount.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-neutral-900 dark:bg-white h-1.5 rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800 text-[10px] text-neutral-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {g.deadline ? new Date(g.deadline).toLocaleDateString() : "No deadline"}
                  </span>
                  <Button
                    type="button"
                    variant="unstyled"
                    onClick={() => {
                      setSelectedGoal(g);
                      setUpdateAmount(String(g.currentAmount));
                      setShowUpdateModal(true);
                    }}
                    className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 font-semibold"
                  >
                    Adjust Progress
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AppDialog open={showAddGoal} onOpenChange={setShowAddGoal} title="Create Financial Goal">
        <form onSubmit={handleSubmit} className="space-y-3">
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
            <form onSubmit={handleUpdateProgress} className="space-y-3">
              <div className="space-y-1.5">
                <FieldLabel>Current Saved (INR)</FieldLabel>
                <Input
                  type="number"
                  required
                  placeholder="0.00"
                  value={updateAmount}
                  onChange={(e) => setUpdateAmount(e.target.value)}
                  className="font-mono"
                />
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
