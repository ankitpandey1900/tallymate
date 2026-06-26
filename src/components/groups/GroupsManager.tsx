"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  ArrowRight,
  Settings as SettingsIcon,
  DollarSign,
  HandCoins,
  UserPlus,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  AlertCircle,
  Trash2,
  LogOut,
  Loader2,
  Edit3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast, toastError } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { FieldLabel } from "@/components/ui/field-label";
import { formatGroupType } from "@/lib/group-labels";
import { SectionHeading } from "@/components/ui/section-heading";
import { AppDialog } from "@/components/ui/app-dialog";
import {
  createGroup,
  joinGroup,
  getGroupDetails,
  createGroupExpense,
  createSettlement,
  updateGroupSettings,
  deleteGroup,
  leaveGroup,
  updateGroupExpense,
  deleteGroupExpense,
  deleteSettlement,
  type getGroupsPageData,
} from "@/app/actions";
import {
  UnifiedGroup,
  UnifiedGroupExpense,
  UnifiedSettlement,
  UnifiedAccount,
} from "@/lib/unified-db";

type GroupsInitialData = Awaited<ReturnType<typeof getGroupsPageData>>;

export default function GroupsManager({ initialData }: { initialData: GroupsInitialData }) {
  const router = useRouter();
  const [groups, setGroups] = useState<UnifiedGroup[]>(initialData.groups);
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

  const [personalAccounts, setPersonalAccounts] = useState<UnifiedAccount[]>(initialData.accounts);
  const [currentUserId, setCurrentUserId] = useState<string>(initialData.userId);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [confirmDeleteGroupId, setConfirmDeleteGroupId] = useState<string | null>(null);
  const [leavingGroupId, setLeavingGroupId] = useState<string | null>(null);
  const [confirmLeaveGroupId, setConfirmLeaveGroupId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Edit Expense Form
  const [showEditExpense, setShowEditExpense] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

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
    setGroups(initialData.groups);
    setPersonalAccounts(initialData.accounts);
    setCurrentUserId(initialData.userId);
    setIsLoading(false);
  }, [initialData]);

  useEffect(() => {
    if (selectedGroupId) {
      loadGroupDetails(selectedGroupId);
    } else {
      setGroupDetails(null);
    }
  }, [selectedGroupId]);


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
    if (!newGroupForm.name || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createGroup({
        name: newGroupForm.name,
        type: newGroupForm.type,
        memberEmails: newGroupForm.memberEmails.filter((email) => email.trim()),
      });
      setShowCreateGroup(false);
      setNewGroupForm({ name: "", type: "TRIP", memberEmails: ["", ""] });
      toast.success("Group created successfully");
      router.refresh();
    } catch (err) {
      toastError(err, "Failed to create group");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await joinGroup(inviteCode);
      setShowJoinGroup(false);
      setInviteCode("");
      toast.success("Joined group successfully");
      router.refresh();
    } catch (err: unknown) {
      toastError(err, "Failed to join group");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (confirmLeaveGroupId !== groupId) {
      setConfirmLeaveGroupId(groupId);
      return;
    }
    setLeavingGroupId(groupId);
    setConfirmLeaveGroupId(null);
    try {
      await leaveGroup(groupId);
      if (selectedGroupId === groupId) setSelectedGroupId(null);
      toast.success("You left the group");
      router.refresh();
    } catch (err: unknown) {
      toastError(err, "Failed to leave group");
    } finally {
      setLeavingGroupId(null);
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
      toast.success("Group deleted");
      router.refresh();
    } catch (err: unknown) {
      toastError(err, "Failed to delete group");
    } finally {
      setDeletingGroupId(null);
    }
  };

  const handleDeleteSettlement = async (settlementId: string) => {
    if (!selectedGroupId) return;
    try {
      await deleteSettlement(selectedGroupId, settlementId);
      toast.success("Payment deleted");
      loadGroupDetails(selectedGroupId);
    } catch (err) {
      toastError(err, "Failed to delete payment");
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
    if (!groupDetails || !expenseForm.amount || !expenseForm.description || isSubmitting) return;
    if (!expenseForm.paidByUserId) {
      toast.error("Please select who paid for this expense.");
      return;
    }

    setIsSubmitting(true);
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
      toast.error(`Split total (₹${sumSplits}) must match expense amount (₹${totalAmount})`);
      setIsSubmitting(false);
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
      toast.success("Group expense added");
      loadGroupDetails(groupDetails.group.id);
    } catch (err) {
      toastError(err, "Failed to add group expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupDetails || !expenseForm.amount || !expenseForm.description || !editingExpenseId || isSubmitting) return;

    setIsSubmitting(true);
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
      splits = groupDetails.members.map((m) => ({
        userId: m.userId,
        amount: Number(expenseForm.customShares[m.userId] || 0),
        type: "UNEQUAL",
      }));
    }

    const sumSplits = splits.reduce((sum, s) => sum + s.amount, 0);
    if (Math.abs(sumSplits - totalAmount) > 2) {
      toast.error(`Split total (₹${sumSplits}) must match expense amount (₹${totalAmount})`);
      setIsSubmitting(false);
      return;
    }

    try {
      await updateGroupExpense(groupDetails.group.id, editingExpenseId, {
        amount: totalAmount,
        description: expenseForm.description,
        paidByUserId: expenseForm.paidByUserId,
        splits,
      });

      setShowEditExpense(false);
      setEditingExpenseId(null);
      setExpenseForm((prev) => ({
        ...prev,
        amount: "",
        description: "",
        customShares: {},
      }));
      toast.success("Group expense updated");
      loadGroupDetails(groupDetails.group.id);
    } catch (err) {
      toastError(err, "Failed to update group expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!groupDetails) return;
    if (!confirm("Are you sure you want to delete this expense? This will recalculate all balances.")) return;
    try {
      await deleteGroupExpense(groupDetails.group.id, expenseId);
      toast.success("Expense deleted");
      loadGroupDetails(groupDetails.group.id);
    } catch (err) {
      toastError(err, "Failed to delete expense");
    }
  };

  const handleSettleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupDetails || !settlementForm.payerId || !settlementForm.receiverId || !settlementForm.amount || isSubmitting) return;

    setIsSubmitting(true);
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
      toast.success("Payment recorded");
    } catch (err) {
      toastError(err, "Failed to record payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Groups</h2>
          <p className="text-sm text-neutral-500">Split bills with friends, roommates, or family.</p>
        </div>
        <Link
          href="/debts"
          className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#e4e4e7] dark:border-[#27272a] hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-md text-xs font-semibold self-start"
        >
          <HandCoins size={14} />
          Debt Tracker
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start h-[calc(100vh-100px)]">
        {/* Left panel: Modern Group list */}
        <div className="flex flex-col h-full bg-white dark:bg-[#111113] border border-black/[0.04] dark:border-white/[0.04] rounded-2xl shadow-sm overflow-hidden panel-card">
          <div className="p-4 border-b border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Your Groups</h2>
              <p className="text-[11px] text-neutral-500 font-medium mt-0.5">Manage splits & settlements</p>
            </div>
            <div className="flex items-center gap-1">
              <Button type="button" variant="outline-app" className="h-8 w-8 p-0 shrink-0" onClick={() => setShowJoinGroup(true)} title="Join Group">
                <UserPlus size={14} />
              </Button>
              <Button type="button" variant="cta" className="h-8 w-8 p-0 shrink-0" onClick={() => setShowCreateGroup(true)} title="Create Group">
                <Plus size={14} />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center p-6 mt-8">
                <div className="w-12 h-12 bg-neutral-50 dark:bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users size={20} className="text-neutral-400" />
                </div>
                <p className="text-sm font-semibold mb-1">No groups yet</p>
                <p className="text-xs text-neutral-500 max-w-[200px] mx-auto">Create a group to start splitting bills with friends.</p>
              </div>
            ) : (
              groups.map((g) => {
                const isOwner = g.members.find((m) => m.userId === currentUserId)?.role === "OWNER";
                const isSelected = selectedGroupId === g.id;
                const isDeleting = deletingGroupId === g.id;
                const isLeaving = leavingGroupId === g.id;

                return (
                  <div key={g.id} className="relative group/card block">
                    <button
                      onClick={() => {
                        setConfirmDeleteGroupId(null);
                        setConfirmLeaveGroupId(null);
                        setSelectedGroupId(g.id);
                      }}
                      className={cn(
                        "w-full text-left p-3 rounded-xl transition-all duration-200 flex items-start gap-3 relative overflow-hidden",
                        isSelected
                          ? "bg-emerald-50 dark:bg-emerald-500/10"
                          : "hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                      )}
                    >
                      {/* Selection Indicator */}
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                      )}

                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border",
                        isSelected 
                          ? "bg-white dark:bg-neutral-900 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                          : "bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-500"
                      )}>
                        <Users size={18} />
                      </div>

                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex items-center justify-between pr-6">
                          <h4 className={cn("text-sm font-semibold truncate", isSelected ? "text-emerald-700 dark:text-emerald-400" : "text-neutral-900 dark:text-neutral-100")}>
                            {g.name}
                          </h4>
                        </div>
                        <p className={cn("text-[11px] font-medium mt-1 truncate flex items-center gap-1.5", isSelected ? "text-emerald-600/70 dark:text-emerald-500/70" : "text-neutral-500")}>
                          <span className="capitalize">{formatGroupType(g.type).toLowerCase()}</span>
                          <span>•</span>
                          <span>{g.members.length} members</span>
                        </p>
                      </div>
                    </button>

                    {/* Quick Actions (Hover) */}
                    <div className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 transition-opacity",
                      isSelected ? "opacity-100" : "opacity-0 group-hover/card:opacity-100"
                    )}>
                      {isOwner ? (
                        <Button
                          type="button"
                          variant="unstyled"
                          onClick={(e) => { e.stopPropagation(); handleDeleteGroup(g.id); }}
                          disabled={isDeleting}
                          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-500/10 text-neutral-400 hover:text-red-500 transition-colors disabled:opacity-50"
                          title="Delete group"
                        >
                          {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="unstyled"
                          onClick={(e) => { e.stopPropagation(); handleLeaveGroup(g.id); }}
                          disabled={isLeaving}
                          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors disabled:opacity-50"
                          title="Leave group"
                        >
                          {isLeaving ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      {/* Middle/Right panel: Details & Settlements */}
      <div className="md:col-span-2 space-y-6">
        {!groupDetails ? (
          <div className="panel-card p-12 text-center text-xs text-neutral-400 flex flex-col items-center justify-center h-80">
            <Users size={32} className="text-neutral-300 dark:text-neutral-700 mb-2" />
            Select a group on the left to see balances, who should pay whom, and shared expenses.
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
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {formatGroupType(groupDetails.group.type)} group · {groupDetails.members.length} members
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {groupDetails.members.find((m) => m.userId === currentUserId)?.role !== "OWNER" && (
                    <Button
                      type="button"
                      variant="outline-app"
                      onClick={() => handleLeaveGroup(groupDetails.group.id)}
                      disabled={leavingGroupId === groupDetails.group.id}
                      className="gap-1 px-3 py-2 text-xs"
                    >
                      {leavingGroupId === groupDetails.group.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <LogOut size={14} />
                      )}
                      {confirmLeaveGroupId === groupDetails.group.id ? "Confirm leave" : "Leave group"}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="cta"
                    onClick={() => {
                      setExpenseForm((prev) => ({
                        ...prev,
                        paidByUserId: currentUserId,
                        customShares: groupDetails.members.reduce(
                          (acc, m) => ({ ...acc, [m.userId]: "" }),
                          {}
                        ),
                      }));
                      setShowAddExpense(true);
                    }}
                    className="gap-1 px-3 py-2 shadow-none"
                  >
                    <Plus size={14} />
                    Add Expense
                  </Button>
                </div>
              </div>

              {/* Toggles settings toolbar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                {[
                  {
                    label: "Link Accounts",
                    hint: "Connect group spending to your personal accounts",
                    key: "enableSharedFinance" as const,
                  },
                  {
                    label: "Group Budgets",
                    hint: "Set spending limits for this group",
                    key: "enableSharedBudgets" as const,
                  },
                  {
                    label: "Repeat Bills",
                    hint: "Track rent, subscriptions, and other recurring costs",
                    key: "enableRecurringExpenses" as const,
                  },
                  {
                    label: "Payment History",
                    hint: "Keep a record of who paid whom",
                    key: "enableSettlementTracking" as const,
                  },
                ].map((s) => (
                  <Button
                    key={s.key}
                    type="button"
                    variant="unstyled"
                    title={s.hint}
                    onClick={() => handleToggleSetting(s.key)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-md border text-[11px] font-semibold transition-colors",
                      groupDetails.group[s.key]
                        ? "border-neutral-900 bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900/60 text-neutral-900 dark:text-neutral-100"
                        : "border-black/[0.04] text-neutral-500 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900"
                    )}
                  >
                    <span>{s.label}</span>
                    {groupDetails.group[s.key] && <Check size={12} className="ml-1 shrink-0" />}
                  </Button>
                ))}
              </div>
            </div>

            {/* Splitwise Layout: Left Column (Timeline) + Right Column (Balances) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mt-6 animate-fade-in-up">
              
              {/* Left Column: Timeline */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.04] pb-4">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight">Timeline</h3>
                    <p className="text-sm text-neutral-500">Expenses & Settlements</p>
                  </div>
                  <Button type="button" variant="cta" onClick={() => setShowAddExpense(true)} className="h-9 px-4 gap-2">
                    <Plus size={14} />
                    Add Expense
                  </Button>
                </div>

                <div className="bg-white dark:bg-[#111113] rounded-xl border border-black/[0.04] dark:border-white/[0.04] divide-y divide-black/[0.04] dark:divide-white/[0.04] overflow-hidden">
                  {(() => {
                    const timeline = [
                      ...groupDetails.expenses.map(e => ({ type: 'expense' as const, date: new Date(e.date), data: e, id: e.id })),
                      ...groupDetails.settlements.map(s => ({ type: 'settlement' as const, date: new Date(s.date), data: s, id: s.id }))
                    ].sort((a, b) => b.date.getTime() - a.date.getTime());

                    if (timeline.length === 0) {
                      return (
                        <div className="py-20 text-center flex flex-col items-center">
                          <div className="w-16 h-16 rounded-full bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center text-neutral-400 mb-4">
                            <HandCoins size={28} />
                          </div>
                          <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100">No activity yet</p>
                          <p className="text-sm text-neutral-500 max-w-[200px] mt-1">Split an expense to see it here.</p>
                        </div>
                      );
                    }

                    return timeline.map(({ type, date, data, id }) => {
                      const month = date.toLocaleDateString("en-US", { month: "short" });
                      const day = date.toLocaleDateString("en-US", { day: "numeric" });

                      if (type === 'expense') {
                        const e = data as UnifiedGroupExpense;
                        const payer = groupDetails.members.find(m => m.userId === e.paidByUserId);
                        const isPayer = currentUserId === e.paidByUserId;
                        const mySplit = e.splits.find(s => s.userId === currentUserId);
                        const myShare = mySplit ? mySplit.amount : 0;
                        const netAmount = (isPayer ? e.amount : 0) - myShare;

                        let shareText = "not involved";
                        let shareColor = "text-neutral-400";
                        let netStr = "";

                        if (netAmount > 0) {
                          shareText = "you lent";
                          shareColor = "text-emerald-600 dark:text-emerald-500";
                          netStr = `₹${Math.abs(netAmount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
                        } else if (netAmount < 0) {
                          shareText = "you borrowed";
                          shareColor = "text-rose-600 dark:text-rose-500";
                          netStr = `₹${Math.abs(netAmount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
                        } else if (isPayer && myShare === e.amount) {
                          shareText = "not involved"; // paid for yourself
                        } else if (mySplit) {
                          shareText = "you borrowed";
                          shareColor = "text-rose-600 dark:text-rose-500";
                          netStr = "₹0";
                        }

                        return (
                          <div key={`exp-${id}`} className="group/item flex items-center p-4 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors relative">
                            {/* Date Block */}
                            <div className="w-12 shrink-0 flex flex-col items-center justify-center text-center opacity-70">
                              <span className="text-[10px] uppercase font-bold text-neutral-500">{month}</span>
                              <span className="text-xl leading-none font-medium text-neutral-900 dark:text-neutral-100">{day}</span>
                            </div>
                            
                            {/* Icon & Title */}
                            <div className="w-10 h-10 shrink-0 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center text-neutral-500 ml-2">
                              <DollarSign size={20} />
                            </div>
                            <div className="ml-4 flex-1 min-w-0">
                              <p className="text-[15px] font-semibold text-neutral-900 dark:text-white truncate">{e.description}</p>
                              <div className="flex items-center gap-1.5 text-xs text-neutral-500 mt-0.5">
                                <span className={cn("font-medium", isPayer && "text-neutral-900 dark:text-neutral-300")}>
                                  {isPayer ? "You" : payer?.name?.split(" ")[0]}
                                </span>
                                <span>paid</span>
                                <span className="font-semibold font-mono text-neutral-700 dark:text-neutral-300">
                                  ₹{e.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>

                            {/* Share & Actions */}
                            <div className="shrink-0 flex flex-col items-end min-w-[100px]">
                              <p className="text-xs text-neutral-500 mb-0.5">{shareText}</p>
                              {netStr && <p className={cn("text-[15px] font-bold font-mono tracking-tight", shareColor)}>{netStr}</p>}
                              
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity bg-white dark:bg-[#111113] pl-2">
                                <Button
                                  type="button"
                                  variant="unstyled"
                                  onClick={() => {
                                    setEditingExpenseId(e.id);
                                    setExpenseForm({
                                      amount: String(e.amount),
                                      description: e.description,
                                      paidByUserId: e.paidByUserId,
                                      accountId: "",
                                      customShares: e.splits.reduce((acc, s) => ({ ...acc, [s.userId]: String(s.amount) }), {}),
                                    });
                                    setSplitType(e.splits[0]?.type === "EQUAL" ? "EQUAL" : e.splits[0]?.type === "PERCENTAGE" ? "PERCENTAGE" : "UNEQUAL");
                                    setShowEditExpense(true);
                                  }}
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shadow-sm border border-neutral-200 dark:border-neutral-800"
                                >
                                  <Edit3 size={14} />
                                </Button>
                                <Button
                                  type="button"
                                  variant="unstyled"
                                  onClick={() => handleDeleteExpense(e.id)}
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors shadow-sm border border-neutral-200 dark:border-neutral-800"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      } else {
                        const s = data as UnifiedSettlement;
                        const isPayer = s.payerId === currentUserId;
                        const isReceiver = s.receiverId === currentUserId;
                        const payer = groupDetails.members.find(m => m.userId === s.payerId);
                        const receiver = groupDetails.members.find(m => m.userId === s.receiverId);

                        return (
                          <div key={`set-${id}`} className="group/item flex items-center p-4 bg-emerald-50/30 dark:bg-emerald-950/10 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors relative">
                            <div className="w-12 shrink-0 flex flex-col items-center justify-center text-center opacity-70">
                              <span className="text-[10px] uppercase font-bold text-neutral-500">{month}</span>
                              <span className="text-xl leading-none font-medium text-neutral-900 dark:text-neutral-100">{day}</span>
                            </div>
                            <div className="w-10 h-10 shrink-0 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center text-emerald-600 ml-2">
                              <HandCoins size={20} />
                            </div>
                            <div className="ml-4 flex-1 min-w-0">
                              <p className="text-[14px] font-medium text-neutral-800 dark:text-neutral-200">
                                <span className={cn("font-bold", isPayer && "text-neutral-900 dark:text-white")}>{isPayer ? "You" : payer?.name?.split(" ")[0]}</span>
                                {" "}paid{" "}
                                <span className={cn("font-bold", isReceiver && "text-neutral-900 dark:text-white")}>{isReceiver ? "You" : receiver?.name?.split(" ")[0]}</span>
                              </p>
                              <p className="text-xs text-neutral-500 mt-0.5 font-mono font-semibold">
                                ₹{s.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                              </p>
                            </div>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                              <Button
                                type="button"
                                variant="unstyled"
                                onClick={() => handleDeleteSettlement(s.id)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-rose-600 hover:bg-white dark:hover:bg-neutral-800 transition-colors shadow-sm border border-neutral-200 dark:border-neutral-700 bg-white/50 dark:bg-neutral-900/50"
                                title="Delete payment"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>
                        );
                      }
                    });
                  })()}
                </div>
              </div>

              {/* Right Column: Balances & Sidebar */}
              <div className="space-y-6">
                
                {/* Overall Net Balance */}
                {(() => {
                  const myBalanceInfo = groupDetails.balances.find(b => b.userId === currentUserId);
                  const myNet = myBalanceInfo?.netBalance || 0;
                  const isOwed = myNet > 0.01;
                  const isDebtor = myNet < -0.01;
                  
                  return (
                    <div className="panel-card p-5 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none bg-white dark:bg-[#111113]">
                      <h4 className="text-[13px] font-bold uppercase tracking-wider text-neutral-400 mb-2">Your Balance</h4>
                      <div className="flex items-end gap-3">
                        <span className={cn(
                          "text-3xl font-bold font-mono tracking-tight",
                          isOwed ? "text-emerald-500" : isDebtor ? "text-rose-500" : "text-neutral-900 dark:text-white"
                        )}>
                          {isOwed ? "+" : isDebtor ? "-" : ""}₹{Math.abs(myNet).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-neutral-500 mt-1">
                        {isOwed ? "You are owed in total" : isDebtor ? "You owe in total" : "You are all settled up"}
                      </p>
                    </div>
                  );
                })()}

                {/* Who owes who */}
                <div className="panel-card p-0 border border-black/[0.04] dark:border-white/[0.04] overflow-hidden bg-white dark:bg-[#111113]">
                  <div className="p-4 border-b border-black/[0.04] dark:border-white/[0.04] bg-neutral-50/50 dark:bg-neutral-900/30">
                    <h4 className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100">Suggested Repayments</h4>
                  </div>
                  
                  <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                    {groupDetails.optimizedSettlements.length === 0 ? (
                      <div className="p-6 text-center">
                        <Check size={24} className="mx-auto text-emerald-500 mb-2" />
                        <p className="text-sm font-medium text-neutral-500">No pending debts</p>
                      </div>
                    ) : (
                      groupDetails.optimizedSettlements.map((s, idx) => {
                        const youPay = currentUserId === s.fromUserId;
                        const youReceive = currentUserId === s.toUserId;
                        const isInvolved = youPay || youReceive;

                        return (
                          <div key={`opt-${idx}`} className="p-4 flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-[14px]">
                              <span className={cn("font-semibold", youPay ? "text-neutral-900 dark:text-white" : "text-neutral-600 dark:text-neutral-400")}>
                                {youPay ? "You" : s.fromUserName.split(" ")[0]}
                              </span>
                              <span className="text-neutral-400 text-xs mt-0.5">owes</span>
                              <span className={cn("font-semibold", youReceive ? "text-neutral-900 dark:text-white" : "text-neutral-600 dark:text-neutral-400")}>
                                {youReceive ? "you" : s.toUserName.split(" ")[0]}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between mt-1">
                              <span className={cn(
                                "text-lg font-bold font-mono tracking-tight",
                                youPay ? "text-rose-500" : youReceive ? "text-emerald-500" : "text-neutral-900 dark:text-white"
                              )}>
                                ₹{s.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                              </span>
                              
                              {isInvolved && (
                                <Button
                                  type="button"
                                  variant="cta"
                                  onClick={() => {
                                    setSettlementForm({
                                      payerId: s.fromUserId,
                                      receiverId: s.toUserId,
                                      amount: String(s.amount),
                                      notes: `Settled up in ${groupDetails.group.name}`,
                                      accountId: personalAccounts[0]?.id || "",
                                      receiveAccountId: "",
                                    });
                                    setShowSettleModal(true);
                                  }}
                                  className="h-8 px-4 text-xs font-semibold rounded-full shadow-sm"
                                >
                                  Settle Up
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Group Modal */}
      <AppDialog open={showCreateGroup} onOpenChange={setShowCreateGroup} title="Create a group">
        <form onSubmit={handleCreateGroup} className="space-y-3">
          <div className="space-y-1.5">
            <FieldLabel>Group Name</FieldLabel>
            <Input
              type="text"
              required
              placeholder="e.g. Goa Trip 2026, Flatmates 4B"
              value={newGroupForm.name}
              onChange={(e) => setNewGroupForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Group Type</FieldLabel>
            <NativeSelect
              value={newGroupForm.type}
              onChange={(e) => setNewGroupForm((prev) => ({ ...prev, type: e.target.value }))}
            >
              <option value="TRIP">Trip / Vacation</option>
              <option value="FAMILY">Family</option>
              <option value="FLATMATES">Roommates / Flatmates</option>
              <option value="COUPLE">Couple / Partners</option>
              <option value="FRIENDS">Friends</option>
              <option value="CUSTOM">Custom / Others</option>
            </NativeSelect>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <FieldLabel>Invite Members (by Email)</FieldLabel>
              <Button
                type="button"
                variant="unstyled"
                onClick={() =>
                  setNewGroupForm((prev) => ({
                    ...prev,
                    memberEmails: [...prev.memberEmails, ""],
                  }))
                }
                className="text-[10px] text-neutral-500 hover:text-neutral-900 font-semibold"
              >
                + Add Field
              </Button>
            </div>
            {newGroupForm.memberEmails.map((email, index) => (
              <Input
                key={index}
                type="email"
                placeholder={`friend-${index + 1}@email.com`}
                value={email}
                onChange={(e) => {
                  const updated = [...newGroupForm.memberEmails];
                  updated[index] = e.target.value;
                  setNewGroupForm((prev) => ({ ...prev, memberEmails: updated }));
                }}
                className="py-1.5 text-xs mt-1"
              />
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="cancel" onClick={() => setShowCreateGroup(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="submit" disabled={isSubmitting}>
              Create Group
            </Button>
          </div>
        </form>
      </AppDialog>

      {/* Join Group Modal */}
      <AppDialog open={showJoinGroup} onOpenChange={setShowJoinGroup} title="Join a group">
        <form onSubmit={handleJoinGroup} className="space-y-3">
          <div className="space-y-1.5">
            <FieldLabel>Invite Code</FieldLabel>
            <Input
              type="text"
              required
              placeholder="Enter the code provided by the owner"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="cancel" onClick={() => setShowJoinGroup(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="submit" disabled={isSubmitting}>
              Join Group
            </Button>
          </div>
        </form>
      </AppDialog>

      {/* Add Expense Modal */}
      <AppDialog
        open={showAddExpense && !!groupDetails}
        onOpenChange={setShowAddExpense}
        title="Add shared expense"
        maxWidth="max-w-lg"
        className="max-h-[90vh] overflow-y-auto"
      >
        {groupDetails && (
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <FieldLabel>Description</FieldLabel>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Dinner, Cab Fare, Hotel Booking"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <FieldLabel>Total Amount (INR)</FieldLabel>
                <Input
                  type="number"
                  required
                  placeholder="0.00"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))}
                  className="font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <FieldLabel>Paid By</FieldLabel>
                <NativeSelect
                  value={expenseForm.paidByUserId}
                  onChange={(e) => setExpenseForm((prev) => ({ ...prev, paidByUserId: e.target.value }))}
                >
                  {groupDetails.members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.name}
                    </option>
                  ))}
                </NativeSelect>
              </div>

              <div className="space-y-1.5">
                <FieldLabel>Link Personal Account (Payer Only)</FieldLabel>
                <NativeSelect
                  value={expenseForm.accountId}
                  onChange={(e) => setExpenseForm((prev) => ({ ...prev, accountId: e.target.value }))}
                >
                  <option value="">Skip — don&apos;t update my personal account</option>
                  {personalAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (₹{a.balance})
                    </option>
                  ))}
                </NativeSelect>
              </div>
            </div>

            {/* Split options tabs */}
            <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <FieldLabel>Split Method</FieldLabel>
                <div className="flex items-center gap-1.5">
                  {(["EQUAL", "PERCENTAGE", "UNEQUAL"] as const).map((m) => (
                    <Button
                      key={m}
                      type="button"
                      variant="unstyled"
                      onClick={() => setSplitType(m)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-[9px] font-bold uppercase transition-colors border",
                        splitType === m
                          ? "bg-neutral-900 dark:bg-white text-white dark:text-black border-black dark:border-white"
                          : "border-black/[0.04] dark:border-neutral-800 text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-900"
                      )}
                    >
                      {m}
                    </Button>
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
                          <Input
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
                            className="w-24 px-2 py-1 text-xs font-mono text-right"
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
              <Button type="button" variant="cancel" onClick={() => setShowAddExpense(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="submit" disabled={isSubmitting}>
                Save Expense
              </Button>
            </div>
          </form>
        )}
      </AppDialog>

      {/* Edit Expense Modal */}
      <AppDialog
        open={showEditExpense && !!groupDetails}
        onOpenChange={setShowEditExpense}
        title="Edit shared expense"
        maxWidth="max-w-lg"
        className="max-h-[90vh] overflow-y-auto"
      >
        {groupDetails && (
          <form onSubmit={handleEditExpenseSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <FieldLabel>Description</FieldLabel>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Dinner, Cab Fare, Hotel Booking"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <FieldLabel>Total Amount (INR)</FieldLabel>
                <Input
                  type="number"
                  required
                  placeholder="0.00"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))}
                  className="font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <FieldLabel>Paid By</FieldLabel>
                <NativeSelect
                  value={expenseForm.paidByUserId}
                  onChange={(e) => setExpenseForm((prev) => ({ ...prev, paidByUserId: e.target.value }))}
                >
                  {groupDetails.members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.name}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            </div>

            {/* Split options tabs */}
            <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <FieldLabel>Split Method</FieldLabel>
                <div className="flex items-center gap-1.5">
                  {(["EQUAL", "PERCENTAGE", "UNEQUAL"] as const).map((m) => (
                    <Button
                      key={m}
                      type="button"
                      variant="unstyled"
                      onClick={() => setSplitType(m)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-[9px] font-bold uppercase transition-colors border",
                        splitType === m
                          ? "bg-neutral-900 dark:bg-white text-white dark:text-black border-black dark:border-white"
                          : "border-black/[0.04] dark:border-neutral-800 text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-900"
                      )}
                    >
                      {m}
                    </Button>
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
                          <Input
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
                            className="w-24 px-2 py-1 text-xs font-mono text-right"
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
              <Button type="button" variant="cancel" onClick={() => setShowEditExpense(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="submit" disabled={isSubmitting}>
                Update Expense
              </Button>
            </div>
          </form>
        )}
      </AppDialog>

      {/* Record Settlement Modal */}
      <AppDialog
        open={showSettleModal && !!groupDetails}
        onOpenChange={setShowSettleModal}
        title="Mark payment as done"
      >
        {groupDetails && (
          <form onSubmit={handleSettleSubmit} className="space-y-3">
            <div className="text-sm border-b border-neutral-100 dark:border-neutral-800 pb-3 text-neutral-600 dark:text-neutral-400">
              {settlementForm.payerId === currentUserId ? (
                <p>
                  You are paying{" "}
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {groupDetails.members.find((m) => m.userId === settlementForm.receiverId)?.name}
                  </span>
                </p>
              ) : (
                <p>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {groupDetails.members.find((m) => m.userId === settlementForm.payerId)?.name}
                  </span>{" "}
                  is paying you
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <FieldLabel>Amount (₹)</FieldLabel>
              <Input
                type="number"
                required
                placeholder="0.00"
                value={settlementForm.amount}
                onChange={(e) => setSettlementForm((prev) => ({ ...prev, amount: e.target.value }))}
                className="font-mono"
              />
            </div>

            {/* Sync settings to payer's accounts */}
            {settlementForm.payerId === currentUserId && (
              <div className="space-y-1.5">
                <FieldLabel>Deduct From Personal Account</FieldLabel>
                <NativeSelect
                  value={settlementForm.accountId}
                  onChange={(e) => setSettlementForm((prev) => ({ ...prev, accountId: e.target.value }))}
                >
                  <option value="">Skip — don&apos;t update my account</option>
                  {personalAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (₹{a.balance})
                    </option>
                  ))}
                </NativeSelect>
              </div>
            )}

            {/* Sync settings to receiver's accounts */}
            {settlementForm.receiverId === currentUserId && (
              <div className="space-y-1.5">
                <FieldLabel>Deposit Into Personal Account</FieldLabel>
                <NativeSelect
                  value={settlementForm.receiveAccountId}
                  onChange={(e) => setSettlementForm((prev) => ({ ...prev, receiveAccountId: e.target.value }))}
                >
                  <option value="">Skip — don&apos;t update my account</option>
                  {personalAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (₹{a.balance})
                    </option>
                  ))}
                </NativeSelect>
              </div>
            )}

            <div className="space-y-1.5">
              <FieldLabel>Notes</FieldLabel>
              <Input
                type="text"
                placeholder="e.g. UPI, cash, gpay"
                value={settlementForm.notes}
                onChange={(e) => setSettlementForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="cancel" onClick={() => setShowSettleModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="submit">
                Confirm payment
              </Button>
            </div>
          </form>
        )}
      </AppDialog>
    </div>
    </div>
  );
}
