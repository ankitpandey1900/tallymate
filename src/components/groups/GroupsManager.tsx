"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  ArrowRight,
  Settings as SettingsIcon,
  DollarSign,
  UserPlus,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  AlertCircle,
  Trash2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getGroups,
  createGroup,
  joinGroup,
  getGroupDetails,
  createGroupExpense,
  createSettlement,
  updateGroupSettings,
  deleteGroup,
  getAccounts,
  getCurrentUser,
} from "@/app/actions";
import {
  UnifiedGroup,
  UnifiedGroupExpense,
  UnifiedSettlement,
  UnifiedAccount,
} from "@/lib/unified-db";

export default function GroupsManager() {
  const [groups, setGroups] = useState<UnifiedGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupDetails, setGroupDetails] = useState<{
    group: UnifiedGroup;
    members: { userId: string; role: string; name: string; email: string }[];
    expenses: UnifiedGroupExpense[];
    settlements: UnifiedSettlement[];
    balances: { userId: string; userName: string; userEmail: string; netBalance: number }[];
    optimizedSettlements: {
      fromUserId: string;
      fromUserName: string;
      toUserId: string;
      toUserName: string;
      amount: number;
    }[];
  } | null>(null);

  const [personalAccounts, setPersonalAccounts] = useState<UnifiedAccount[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("demo-user-id");
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [confirmDeleteGroupId, setConfirmDeleteGroupId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Create Group Form
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupForm, setNewGroupForm] = useState({
    name: "",
    type: "TRIP",
    memberEmails: ["", ""],
  });

  // Join Group Form
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [inviteCode, setInviteCode] = useState("");

  // Create Expense Form
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [splitType, setSplitType] = useState<"EQUAL" | "PERCENTAGE" | "UNEQUAL">("EQUAL");
  const [expenseForm, setExpenseForm] = useState({
    amount: "",
    description: "",
    paidByUserId: "",
    accountId: "",
    customShares: {} as Record<string, string>, // customized value (amount or percentage)
  });

  // Record Settlement Form
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settlementForm, setSettlementForm] = useState({
    payerId: "",
    receiverId: "",
    amount: "",
    notes: "",
    accountId: "",
    receiveAccountId: "",
  });

  useEffect(() => {
    async function init() {
      await Promise.all([loadUser(), loadGroups(), loadPersonalAccounts()]);
      setIsLoading(false);
    }
    init();
  }, []);

  const loadUser = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedGroupId) {
      loadGroupDetails(selectedGroupId);
    } else {
      setGroupDetails(null);
    }
  }, [selectedGroupId]);

  const loadGroups = async () => {
    try {
      const grps = await getGroups();
      setGroups(grps);
    } catch (err) {
      console.error(err);
    }
  };

  const loadPersonalAccounts = async () => {
    try {
      const accs = await getAccounts();
      setPersonalAccounts(accs);
    } catch (err) {
      console.error(err);
    }
  };

  const loadGroupDetails = async (id: string) => {
    try {
      const details = await getGroupDetails(id);
      setGroupDetails(details);
      // Pre-fill forms with active data
      setExpenseForm((prev) => ({
        ...prev,
        paidByUserId: details.members[0]?.userId || "",
        accountId: personalAccounts[0]?.id || "",
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupForm.name) return;

    try {
      await createGroup({
        name: newGroupForm.name,
        type: newGroupForm.type,
        memberEmails: newGroupForm.memberEmails.filter((email) => email.trim()),
      });
      setShowCreateGroup(false);
      setNewGroupForm({ name: "", type: "TRIP", memberEmails: ["", ""] });
      loadGroups();
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode) return;

    try {
      await joinGroup(inviteCode);
      setShowJoinGroup(false);
      setInviteCode("");
      loadGroups();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to join group";
      alert(message);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (confirmDeleteGroupId !== groupId) {
      setConfirmDeleteGroupId(groupId);
      return;
    }
    setDeletingGroupId(groupId);
    setConfirmDeleteGroupId(null);
    try {
      await deleteGroup(groupId);
      if (selectedGroupId === groupId) setSelectedGroupId(null);
      await loadGroups();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete group";
      alert(message);
    } finally {
      setDeletingGroupId(null);
    }
  };

  const handleToggleSetting = async (key: keyof UnifiedGroup) => {
    if (!groupDetails) return;
    const currentVal = groupDetails.group[key];
    const updatedVal = !currentVal;

    try {
      await updateGroupSettings(groupDetails.group.id, { [key]: updatedVal });
      loadGroupDetails(groupDetails.group.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupDetails || !expenseForm.amount || !expenseForm.description) return;

    const totalAmount = Number(expenseForm.amount);
    const membersCount = groupDetails.members.length;

    let splits: { userId: string; amount: number; type: string }[] = [];

    if (splitType === "EQUAL") {
      const equalShare = Math.round((totalAmount / membersCount) * 100) / 100;
      splits = groupDetails.members.map((m) => ({
        userId: m.userId,
        amount: equalShare,
        type: "EQUAL",
      }));
    } else if (splitType === "PERCENTAGE") {
      splits = groupDetails.members.map((m) => {
        const pct = Number(expenseForm.customShares[m.userId] || 0);
        return {
          userId: m.userId,
          amount: Math.round(((totalAmount * pct) / 100) * 100) / 100,
          type: "PERCENTAGE",
        };
      });
    } else {
      // Unequal
      splits = groupDetails.members.map((m) => ({
        userId: m.userId,
        amount: Number(expenseForm.customShares[m.userId] || 0),
        type: "UNEQUAL",
      }));
    }

    // Verify split total matches expense total amount
    const sumSplits = splits.reduce((sum, s) => sum + s.amount, 0);
    if (Math.abs(sumSplits - totalAmount) > 2) {
      alert(`Split values total (₹${sumSplits}) does not match expense amount (₹${totalAmount})`);
      return;
    }

    try {
      await createGroupExpense(groupDetails.group.id, {
        amount: totalAmount,
        description: expenseForm.description,
        paidByUserId: expenseForm.paidByUserId,
        splits,
        accountId: expenseForm.accountId || undefined,
      });

      setShowAddExpense(false);
      setExpenseForm((prev) => ({
        ...prev,
        amount: "",
        description: "",
        customShares: {},
      }));
      loadGroupDetails(groupDetails.group.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSettleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupDetails || !settlementForm.payerId || !settlementForm.receiverId || !settlementForm.amount) return;

    try {
      await createSettlement(groupDetails.group.id, {
        payerId: settlementForm.payerId,
        receiverId: settlementForm.receiverId,
        amount: Number(settlementForm.amount),
        notes: settlementForm.notes,
        accountId: settlementForm.accountId || undefined,
        receiveAccountId: settlementForm.receiveAccountId || undefined,
      });

      setShowSettleModal(false);
      setSettlementForm({
        payerId: "",
        receiverId: "",
        amount: "",
        notes: "",
        accountId: "",
        receiveAccountId: "",
      });
      loadGroupDetails(groupDetails.group.id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Left panel: Group list */}
      <div className="md:col-span-1 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold tracking-tight">Your Groups</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowJoinGroup(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 border border-black/[0.04] dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-md text-xs font-semibold"
            >
              <UserPlus size={14} />
              Join
            </button>
            <button
              onClick={() => setShowCreateGroup(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#09090b] dark:bg-[#fafafa] text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-md text-xs font-semibold"
            >
              <Plus size={14} />
              Create
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="panel-card p-6 flex justify-center items-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
          </div>
        ) : groups.length === 0 ? (
          <div className="panel-card p-6 text-center text-xs text-neutral-400">
            No groups yet. Create one above.
          </div>
        ) : (
          <div className="space-y-2">
            {groups.map((g) => {
              const isOwner = g.members.find((m) => m.userId === currentUserId)?.role === "OWNER";
              const isConfirming = confirmDeleteGroupId === g.id;
              const isDeleting = deletingGroupId === g.id;
              return (
                <div key={g.id} className="relative group/card">
                  <button
                    onClick={() => setSelectedGroupId(g.id)}
                    className={cn(
                      "w-full text-left p-4 rounded-lg border transition-all duration-150 flex items-center justify-between pr-12",
                      selectedGroupId === g.id
                        ? "border-neutral-900 bg-neutral-50 dark:border-black/[0.04] dark:bg-neutral-900"
                        : "border-black/[0.04] bg-white dark:border-neutral-800 dark:bg-[#18181b] hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
                    )}
                  >
                    <div>
                      <h4 className="text-sm font-semibold">{g.name}</h4>
                      <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-mono mt-1">
                        {g.type} • {g.members.length} members {isOwner && "• Owner"}
                      </p>
                    </div>
                    <ArrowRight size={14} className="text-neutral-400" />
                  </button>

                  {/* Delete button — visible on hover, owner only */}
                  {isOwner && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                      {isConfirming ? (
                        <>
                          <button
                            onClick={() => handleDeleteGroup(g.id)}
                            className="p-1.5 rounded-md bg-red-500 text-white hover:bg-red-600 text-[10px] font-bold flex items-center gap-1"
                            title="Confirm delete group"
                          >
                            {isDeleting ? <Loader2 size={11} className="animate-spin" /> : "Delete?"}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteGroupId(null)}
                            className="p-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-[10px] font-bold"
                          >
                            No
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteGroup(g.id); }}
                          disabled={isDeleting}
                          className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 text-neutral-400 hover:text-red-500 transition-colors disabled:opacity-50"
                          title="Delete group"
                        >
                          {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Middle/Right panel: Details & Settlements */}
      <div className="md:col-span-2 space-y-6">
        {!groupDetails ? (
          <div className="panel-card p-12 text-center text-xs text-neutral-400 flex flex-col items-center justify-center h-80">
            <Users size={32} className="text-neutral-300 dark:text-neutral-700 mb-2" />
            Select a group from the sidebar to view details, balances, and settle split bills.
          </div>
        ) : (
          <>
            {/* Header info card */}
            <div className="panel-card p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    {groupDetails.group.name}
                    {groupDetails.group.inviteCode && (
                      <span
                        className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[10px] font-mono cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors select-all"
                        title="Copy Invite Code"
                      >
                        Code: {groupDetails.group.inviteCode}
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-neutral-400 font-mono uppercase tracking-wider mt-0.5">
                    {groupDetails.group.type} Workspace
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setExpenseForm((prev) => ({
                        ...prev,
                        customShares: groupDetails.members.reduce(
                          (acc, m) => ({ ...acc, [m.userId]: "" }),
                          {}
                        ),
                      }));
                      setShowAddExpense(true);
                    }}
                    className="flex items-center gap-1 px-3 py-2 bg-[#09090b] dark:bg-[#fafafa] text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-md text-xs font-semibold"
                  >
                    <Plus size={14} />
                    Add Expense
                  </button>
                </div>
              </div>

              {/* Toggles settings toolbar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                {[
                  { label: "Shared Finance", key: "enableSharedFinance" as const },
                  { label: "Shared Budgets", key: "enableSharedBudgets" as const },
                  { label: "Recurring Bills", key: "enableRecurringExpenses" as const },
                  { label: "Settlement Log", key: "enableSettlementTracking" as const },
                ].map((s) => (
                  <button
                    key={s.key}
                    onClick={() => handleToggleSetting(s.key)}
                    className={cn(
                      "flex items-center justify-between px-3 py-1.5 rounded-md border text-[10px] font-bold uppercase tracking-wider transition-colors",
                      groupDetails.group[s.key]
                        ? "border-neutral-900 bg-neutral-50 dark:border-black/[0.04] dark:bg-neutral-900/60"
                        : "border-black/[0.04] text-neutral-400 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900"
                    )}
                  >
                    <span>{s.label}</span>
                    {groupDetails.group[s.key] && <Check size={12} className="ml-1" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Balances Dashboard Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Balances list */}
              <div className="panel-card p-5 space-y-4">
                <h3 className="text-xs uppercase font-bold tracking-wider text-neutral-400">Net Balances</h3>
                <div className="space-y-2">
                  {groupDetails.balances.map((b) => {
                    const isOwed = b.netBalance > 0.01;
                    const isDebtor = b.netBalance < -0.01;
                    return (
                      <div key={b.userId} className="flex items-center justify-between py-1.5 border-b border-neutral-50 dark:border-neutral-800/40 last:border-none">
                        <div>
                          <p className="text-xs font-semibold">{b.userName}</p>
                          <p className="text-[9px] text-neutral-400 font-mono mt-0.5">{b.userEmail}</p>
                        </div>
                        <span
                          className={cn(
                            "text-xs font-bold font-mono",
                            isOwed ? "text-emerald-500" : isDebtor ? "text-red-500" : "text-neutral-400"
                          )}
                        >
                          {isOwed ? "Gets back: " : isDebtor ? "Owes: " : "Settled"}
                          {b.netBalance !== 0 && `₹${Math.abs(b.netBalance).toLocaleString()}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Simplified Debt Settlements */}
              <div className="panel-card p-5 space-y-4">
                <h3 className="text-xs uppercase font-bold tracking-wider text-neutral-400">Simplified Settlements</h3>
                <div className="space-y-3">
                  {groupDetails.optimizedSettlements.length === 0 ? (
                    <div className="py-8 text-center text-xs text-neutral-400 flex flex-col items-center justify-center">
                      <Check size={20} className="text-emerald-500 mb-1" />
                      All balances are fully settled!
                    </div>
                  ) : (
                    groupDetails.optimizedSettlements.map((s, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1">
                        <div className="text-xs">
                          <span className="font-semibold">{s.fromUserName}</span>
                          <span className="text-neutral-400 mx-1">pays</span>
                          <span className="font-semibold">{s.toUserName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-mono text-xs text-red-500">
                            ₹{s.amount.toLocaleString()}
                          </span>
                          {/* Record settlement trigger */}
                          <button
                            onClick={() => {
                              setSettlementForm({
                                payerId: s.fromUserId,
                                receiverId: s.toUserId,
                                amount: String(s.amount),
                                notes: `Settling debt in ${groupDetails.group.name}`,
                                accountId: personalAccounts[0]?.id || "",
                                receiveAccountId: "",
                              });
                              setShowSettleModal(true);
                            }}
                            className="px-2 py-1 border border-neutral-300 dark:border-neutral-700 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-900 text-[10px] font-semibold"
                          >
                            Record Pay
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Expenses List */}
            <div className="panel-card p-5 space-y-4">
              <h3 className="text-xs uppercase font-bold tracking-wider text-neutral-400">Expenses Log</h3>
              <div className="space-y-3">
                {groupDetails.expenses.length === 0 ? (
                  <div className="py-12 text-center text-xs text-neutral-400">
                    No group expenses have been recorded yet.
                  </div>
                ) : (
                  groupDetails.expenses.map((e) => {
                    const payer = groupDetails.members.find((m) => m.userId === e.paidByUserId);
                    return (
                      <div key={e.id} className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-none">
                        <div>
                          <p className="text-xs font-semibold">{e.description}</p>
                          <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                            Paid by {payer?.name || "Unknown"} on {new Date(e.date).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-xs font-bold font-mono">
                          ₹{e.amount.toLocaleString()}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div
            className="fixed inset-0"
            onClick={() => setShowCreateGroup(false)}
          />
          <div className="panel-card bg-white dark:bg-[#18181b] w-full max-w-md p-6 relative z-10 space-y-4 shadow-xl">
            <h3 className="text-base font-bold">Create Group Workspace</h3>
            <form onSubmit={handleCreateGroup} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Group Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Goa Trip 2026, Flatmates 4B"
                  value={newGroupForm.name}
                  onChange={(e) => setNewGroupForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-black/[0.04] dark:border-neutral-800 rounded-md text-sm bg-transparent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Group Type</label>
                <select
                  value={newGroupForm.type}
                  onChange={(e) => setNewGroupForm((prev) => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-black/[0.04] dark:border-neutral-800 rounded-md text-sm bg-transparent"
                >
                  <option value="TRIP">Trip / Vacation</option>
                  <option value="FAMILY">Family</option>
                  <option value="FLATMATES">Roommates / Flatmates</option>
                  <option value="COUPLE">Couple / Partners</option>
                  <option value="FRIENDS">Friends</option>
                  <option value="CUSTOM">Custom / Others</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">Invite Members (by Email)</label>
                  <button
                    type="button"
                    onClick={() =>
                      setNewGroupForm((prev) => ({
                        ...prev,
                        memberEmails: [...prev.memberEmails, ""],
                      }))
                    }
                    className="text-[10px] text-neutral-500 hover:text-neutral-900 font-semibold"
                  >
                    + Add Field
                  </button>
                </div>
                {newGroupForm.memberEmails.map((email, index) => (
                  <input
                    key={index}
                    type="email"
                    placeholder={`friend-${index + 1}@email.com`}
                    value={email}
                    onChange={(e) => {
                      const updated = [...newGroupForm.memberEmails];
                      updated[index] = e.target.value;
                      setNewGroupForm((prev) => ({ ...prev, memberEmails: updated }));
                    }}
                    className="w-full px-3 py-1.5 border border-black/[0.04] dark:border-neutral-800 rounded-md text-xs bg-transparent mt-1"
                  />
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGroup(false)}
                  className="px-4 py-2 border border-[#e4e4e7] dark:border-[#27272a] hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-md text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#09090b] dark:bg-[#fafafa] hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-black rounded-md text-xs font-semibold shadow-xs"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div
            className="fixed inset-0"
            onClick={() => setShowJoinGroup(false)}
          />
          <div className="panel-card bg-white dark:bg-[#18181b] w-full max-w-md p-6 relative z-10 space-y-4 shadow-xl">
            <h3 className="text-base font-bold">Join Group</h3>
            <form onSubmit={handleJoinGroup} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Invite Code</label>
                <input
                  type="text"
                  required
                  placeholder="Enter the code provided by the owner"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full px-3 py-2 border border-black/[0.04] dark:border-neutral-800 rounded-md text-sm bg-transparent font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinGroup(false)}
                  className="px-4 py-2 border border-[#e4e4e7] dark:border-[#27272a] hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-md text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#09090b] dark:bg-[#fafafa] hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-black rounded-md text-xs font-semibold shadow-xs"
                >
                  Join Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpense && groupDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div
            className="fixed inset-0"
            onClick={() => setShowAddExpense(false)}
          />
          <div className="panel-card bg-white dark:bg-[#18181b] w-full max-w-lg p-6 relative z-10 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold">Add Group Expense</h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dinner, Cab Fare, Hotel Booking"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-black/[0.04] dark:border-neutral-800 rounded-md text-sm bg-transparent"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">Total Amount (INR)</label>
                  <input
                    type="number"
                    required
                    placeholder="0.00"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-3 py-2 border border-black/[0.04] dark:border-neutral-800 rounded-md text-sm bg-transparent font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">Paid By</label>
                  <select
                    value={expenseForm.paidByUserId}
                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, paidByUserId: e.target.value }))}
                    className="w-full px-3 py-2 border border-black/[0.04] dark:border-neutral-800 rounded-md text-sm bg-transparent"
                  >
                    {groupDetails.members.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">Link Personal Account (Payer Only)</label>
                  <select
                    value={expenseForm.accountId}
                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, accountId: e.target.value }))}
                    className="w-full px-3 py-2 border border-black/[0.04] dark:border-neutral-800 rounded-md text-sm bg-transparent"
                  >
                    <option value="">Do Not Sync to Personal Ledgers</option>
                    {personalAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} (₹{a.balance})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Split options tabs */}
              <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">Split Method</label>
                  <div className="flex items-center gap-1.5">
                    {(["EQUAL", "PERCENTAGE", "UNEQUAL"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setSplitType(m)}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[9px] font-bold uppercase transition-colors border",
                          splitType === m
                            ? "bg-neutral-900 dark:bg-white text-white dark:text-black border-black dark:border-white"
                            : "border-black/[0.04] dark:border-neutral-800 text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-900"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Splits grid values inputs */}
                <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                  {groupDetails.members.map((m) => (
                    <div key={m.userId} className="flex items-center justify-between py-1 text-xs">
                      <span>{m.name}</span>
                      <div className="flex items-center gap-2">
                        {splitType === "EQUAL" ? (
                          <span className="text-neutral-400 font-mono">
                            ₹
                            {expenseForm.amount
                              ? (Number(expenseForm.amount) / groupDetails.members.length).toFixed(2)
                              : "0.00"}
                          </span>
                        ) : (
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              placeholder={splitType === "PERCENTAGE" ? "%" : "₹"}
                              value={expenseForm.customShares[m.userId] || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setExpenseForm((prev) => ({
                                  ...prev,
                                  customShares: {
                                    ...prev.customShares,
                                    [m.userId]: val,
                                  },
                                }));
                              }}
                              className="w-24 px-2 py-1 border border-black/[0.04] dark:border-neutral-800 rounded-md text-xs font-mono text-right"
                            />
                            <span className="absolute right-2.5 text-[10px] text-neutral-400 select-none">
                              {splitType === "PERCENTAGE" ? "%" : "₹"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddExpense(false)}
                  className="px-4 py-2 border border-[#e4e4e7] dark:border-[#27272a] hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-md text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#09090b] dark:bg-[#fafafa] hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-black rounded-md text-xs font-semibold shadow-xs"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Settlement Modal */}
      {showSettleModal && groupDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div
            className="fixed inset-0"
            onClick={() => setShowSettleModal(false)}
          />
          <div className="panel-card bg-white dark:bg-[#18181b] w-full max-w-md p-6 relative z-10 space-y-4 shadow-xl">
            <h3 className="text-base font-bold">Record Settlement</h3>
            <form onSubmit={handleSettleSubmit} className="space-y-3">
              <div className="text-xs border-b border-neutral-100 dark:border-neutral-800 pb-3 flex items-center justify-between text-neutral-400">
                <span>Payer: {groupDetails.members.find((m) => m.userId === settlementForm.payerId)?.name}</span>
                <span>Receiver: {groupDetails.members.find((m) => m.userId === settlementForm.receiverId)?.name}</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Settled Amount (INR)</label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={settlementForm.amount}
                  onChange={(e) => setSettlementForm((prev) => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-black/[0.04] dark:border-neutral-800 rounded-md text-sm bg-transparent font-mono"
                />
              </div>

              {/* Sync settings to payer's accounts */}
              {settlementForm.payerId === currentUserId && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">Deduct From Personal Account</label>
                  <select
                    value={settlementForm.accountId}
                    onChange={(e) => setSettlementForm((prev) => ({ ...prev, accountId: e.target.value }))}
                    className="w-full px-3 py-2 border border-black/[0.04] dark:border-neutral-800 rounded-md text-sm bg-transparent"
                  >
                    <option value="">Select Account (No personal ledger link)</option>
                    {personalAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} (₹{a.balance})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sync settings to receiver's accounts */}
              {settlementForm.receiverId === currentUserId && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">Deposit Into Personal Account</label>
                  <select
                    value={settlementForm.receiveAccountId}
                    onChange={(e) => setSettlementForm((prev) => ({ ...prev, receiveAccountId: e.target.value }))}
                    className="w-full px-3 py-2 border border-black/[0.04] dark:border-neutral-800 rounded-md text-sm bg-transparent"
                  >
                    <option value="">Select Account (No personal ledger link)</option>
                    {personalAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} (₹{a.balance})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Notes</label>
                <input
                  type="text"
                  placeholder="e.g. UPI, cash, gpay"
                  value={settlementForm.notes}
                  onChange={(e) => setSettlementForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-black/[0.04] dark:border-neutral-800 rounded-md text-sm bg-transparent"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettleModal(false)}
                  className="px-4 py-2 border border-[#e4e4e7] dark:border-[#27272a] hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-md text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#09090b] dark:bg-[#fafafa] hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-black rounded-md text-xs font-semibold shadow-xs"
                >
                  Confirm Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
