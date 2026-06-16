"use client";

import React, { useState, useEffect } from "react";
import { Plus, Target, Calendar, Trash2, Loader2 } from "lucide-react";
import { getGoals, createGoal, updateGoalProgress, deleteGoal } from "@/app/actions";
import { UnifiedGoal } from "@/lib/unified-db";

export default function GoalsManager() {
  const [goals, setGoals] = useState<UnifiedGoal[]>([]);
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

  const loadGoals = async () => {
    try {
      const g = await getGoals();
      setGoals(g);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    void loadGoals();
  }, []);

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
      loadGoals();
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
      loadGoals();
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
      await loadGoals();
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
        <button
          onClick={() => setShowAddGoal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#09090b] dark:bg-[#fafafa] text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-md text-xs font-semibold self-start"
        >
          <Plus size={14} />
          Create Goal
        </button>
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
                          <button onClick={() => handleDeleteGoal(g.id)} className="p-1 rounded bg-red-500 text-white text-[9px] font-bold">Delete?</button>
                          <button onClick={() => setConfirmDeleteGoalId(null)} className="p-1 rounded bg-neutral-100 dark:bg-neutral-800 text-[9px] font-bold">No</button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleDeleteGoal(g.id)}
                          disabled={deletingGoalId === g.id}
                          className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-950/30 text-neutral-400 hover:text-red-500 transition-all"
                        >
                          {deletingGoalId === g.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        </button>
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
                  <button
                    onClick={() => {
                      setSelectedGoal(g);
                      setUpdateAmount(String(g.currentAmount));
                      setShowUpdateModal(true);
                    }}
                    className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 font-semibold"
                  >
                    Adjust Progress
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Goal Dialog */}
      {showAddGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div
            className="fixed inset-0"
            onClick={() => setShowAddGoal(false)}
          />
          <div className="panel-card bg-white dark:bg-[#18181b] w-full max-w-md p-6 relative z-10 space-y-4 shadow-xl">
            <h3 className="text-base font-bold">Create Financial Goal</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Goal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MacBook Pro, Emergency Fund"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-black/[0.04] dark:border-neutral-800 rounded-md text-sm bg-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">Target Amount</label>
                  <input
                    type="number"
                    required
                    placeholder="0.00"
                    value={form.targetAmount}
                    onChange={(e) => setForm((prev) => ({ ...prev, targetAmount: e.target.value }))}
                    className="w-full px-3 py-2 border border-black/[0.04] dark:border-neutral-800 rounded-md text-sm bg-transparent font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">Initial Saved</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={form.currentAmount}
                    onChange={(e) => setForm((prev) => ({ ...prev, currentAmount: e.target.value }))}
                    className="w-full px-3 py-2 border border-black/[0.04] dark:border-neutral-800 rounded-md text-sm bg-transparent font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Target Deadline</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm((prev) => ({ ...prev, deadline: e.target.value }))}
                  className="w-full px-3 py-2 border border-black/[0.04] dark:border-neutral-800 rounded-md text-sm bg-transparent font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddGoal(false)}
                  className="px-4 py-2 border border-[#e4e4e7] dark:border-[#27272a] hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-md text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#09090b] dark:bg-[#fafafa] hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-black rounded-md text-xs font-semibold shadow-xs"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Progress Dialog */}
      {showUpdateModal && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div
            className="fixed inset-0"
            onClick={() => setShowUpdateModal(false)}
          />
          <div className="panel-card bg-white dark:bg-[#18181b] w-full max-w-sm p-6 relative z-10 space-y-4 shadow-xl">
            <h3 className="text-base font-bold">Adjust Savings Progress</h3>
            <p className="text-xs text-neutral-500">Update the current saved amount for &quot;{selectedGoal.name}&quot;.</p>
            <form onSubmit={handleUpdateProgress} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Current Saved (INR)</label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={updateAmount}
                  onChange={(e) => setUpdateAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-black/[0.04] dark:border-neutral-800 rounded-md text-sm bg-transparent font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 py-2 border border-[#e4e4e7] dark:border-[#27272a] hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-md text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#09090b] dark:bg-[#fafafa] hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-black rounded-md text-xs font-semibold shadow-xs"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
