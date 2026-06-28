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
import { getCategoryIcon } from "@/lib/category-icons";
import { cn } from "@/lib/utils";
import { toast, toastError } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    members: { userId: string; role: string; name: string; email: string; image?: string | null }[];
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
  const [previewExpenseId, setPreviewExpenseId] = useState<string | null>(null);

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

  // Invite Member Form
  const [showInviteModal, setShowInviteModal] = useState(false);

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
        accountId: "",
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
        accountId: expenseForm.accountId || undefined,
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
        accountId: personalAccounts.length > 0 ? personalAccounts[0].id : "",
        receiveAccountId: personalAccounts.length > 0 ? personalAccounts[0].id : "",
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
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-500 shrink-0 text-xl font-bold shadow-sm">
                    {groupDetails.group.name[0].toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                      {groupDetails.group.name}
                    </h2>
                    <p className="text-sm text-neutral-500 mt-0.5 font-medium">
                      {formatGroupType(groupDetails.group.type)} group · {groupDetails.members.length} members
                    </p>
                  </div>
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
                    variant="outline-app"
                    onClick={() => setShowInviteModal(true)}
                    className="px-4 py-2 text-[13px] font-bold shadow-sm"
                  >
                    <UserPlus size={14} className="mr-1.5" />
                    Add Member
                  </Button>
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
                  <Button
                    type="button"
                    variant="cta"
                    onClick={() => {
                       const firstPending = groupDetails.optimizedSettlements.find(s => s.fromUserId === currentUserId || s.toUserId === currentUserId);
                       if (firstPending) {
                          setSettlementForm({
                            payerId: firstPending.fromUserId,
                            receiverId: firstPending.toUserId,
                            amount: String(firstPending.amount),
                            notes: `Settled up in ${groupDetails.group.name}`,
                            accountId: personalAccounts.length > 0 ? personalAccounts[0].id : "",
                            receiveAccountId: personalAccounts.length > 0 ? personalAccounts[0].id : "",
                          });
                       } else {
                          setSettlementForm({
                            payerId: "",
                            receiverId: "",
                            amount: "",
                            notes: `Settled up in ${groupDetails.group.name}`,
                            accountId: personalAccounts.length > 0 ? personalAccounts[0].id : "",
                            receiveAccountId: personalAccounts.length > 0 ? personalAccounts[0].id : "",
                          });
                       }
                       setShowSettleModal(true);
                    }}
                    className="px-4 py-2 text-[13px] font-bold shadow-sm"
                  >
                    Settle up
                  </Button>
                </div>
              </div>

            </div>

            {/* Splitwise Layout: Left Column (Timeline) + Right Column (Balances) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mt-6 animate-fade-in-up">
              
              {/* Left Column: Timeline */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.04] pb-2">
                  <div>
                    <h3 className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">{new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}</h3>
                  </div>
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
                          netStr = `₹${Math.abs(netAmount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
                        } else if (netAmount < 0) {
                          shareText = "you borrowed";
                          shareColor = "text-rose-600 dark:text-rose-500";
                          netStr = `₹${Math.abs(netAmount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
                        } else if (isPayer && myShare === e.amount) {
                          shareText = "not involved"; // paid for yourself
                        } else if (mySplit) {
                          shareText = "you borrowed";
                          shareColor = "text-rose-600 dark:text-rose-500";
                          netStr = "₹0";
                        }

                        const isExpanded = previewExpenseId === e.id;

                        return (
                          <div key={`exp-${id}`} className="group/item">
                            <div
                              className="flex items-center p-4 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors relative cursor-pointer"
                              onClick={() => setPreviewExpenseId(isExpanded ? null : e.id)}
                            >
                              {/* Date Block */}
                              <div className="w-12 shrink-0 flex flex-col items-center justify-center text-center opacity-70">
                                <span className="text-[10px] uppercase font-bold text-neutral-500">{month}</span>
                                <span className="text-xl leading-none font-medium text-neutral-900 dark:text-neutral-100">{day}</span>
                              </div>
                              
                              {/* Icon & Title */}
                              <div className="w-10 h-10 shrink-0 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center text-neutral-500 ml-2">
                                {getCategoryIcon(e.description, 20)}
                              </div>
                              <div className="ml-4 flex-1 min-w-0">
                                <p className="text-[15px] font-semibold text-neutral-900 dark:text-white truncate">{e.description}</p>
                                <div className="flex items-center gap-1.5 text-xs text-neutral-500 mt-0.5">
                                  <span className={cn("font-medium", isPayer && "text-neutral-900 dark:text-neutral-300")}>
                                    {isPayer ? "You" : payer?.name?.split(" ")[0]}
                                  </span>
                                  <span>paid</span>
                                  <span className="font-semibold font-mono text-neutral-700 dark:text-neutral-300">
                                    ₹{e.amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
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
                                    onClick={(ev) => {
                                      ev.stopPropagation();
                                      setEditingExpenseId(e.id);
                                      setExpenseForm({
                                        amount: String(e.amount),
                                        description: e.description,
                                        paidByUserId: e.paidByUserId,
                                        accountId: "keep",
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
                                    onClick={(ev) => { ev.stopPropagation(); handleDeleteExpense(e.id); }}
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors shadow-sm border border-neutral-200 dark:border-neutral-800"
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {/* Expandable Preview */}
                            {isExpanded && (
                              <div className="px-4 pb-4 pt-1 bg-neutral-50/70 dark:bg-neutral-900/30 border-t border-dashed border-black/[0.06] dark:border-white/[0.06] animate-fade-in-up">
                                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[13px]">
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold mb-1">Paid by</p>
                                    <p className="font-semibold text-neutral-900 dark:text-white">{isPayer ? "You" : payer?.name}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold mb-1">Total</p>
                                    <p className="font-bold font-mono text-neutral-900 dark:text-white">₹{e.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                                  </div>
                                  <div className="col-span-2 mt-2">
                                    <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold mb-2">Split breakdown</p>
                                    <div className="space-y-1.5">
                                      {e.splits.map((sp) => {
                                        const member = groupDetails.members.find(m => m.userId === sp.userId);
                                        return (
                                          <div key={sp.userId} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-[10px] font-bold shrink-0 overflow-hidden border border-black/5 dark:border-white/5">
                                                {member?.image ? (
                                                  <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                                                ) : (
                                                  (member?.name?.[0] || "?").toUpperCase()
                                                )}
                                              </div>
                                              <span className="font-medium text-neutral-800 dark:text-neutral-200">{sp.userId === currentUserId ? "You" : member?.name}</span>
                                            </div>
                                            <span className="font-mono font-semibold text-neutral-900 dark:text-white">₹{sp.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
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
                                ₹{s.amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
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
                          {isOwed ? "+" : isDebtor ? "-" : ""}₹{Math.abs(myNet).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-neutral-500 mt-1">
                        {isOwed ? "You are owed in total" : isDebtor ? "You owe in total" : "You are all settled up"}
                      </p>
                    </div>
                  );
                })()}

                {/* Group Balances */}
                <div className="panel-card p-5 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none bg-white dark:bg-[#111113]">
                  <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-4">Group Balances</h4>
                  
                  <div className="space-y-3">
                    {groupDetails.balances.map((b) => {
                      const net = b.netBalance;
                      const member = groupDetails.members.find(m => m.userId === b.userId);
                      const isOwed = net > 0.01;
                      const isDebtor = net < -0.01;
                      const isSettled = !isOwed && !isDebtor;
                      
                      return (
                        <div key={b.userId} className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-[13px] font-bold shrink-0 border border-black/5 dark:border-white/5 overflow-hidden">
                            {member?.image ? (
                              <img src={member.image} alt={b.userName} className="w-full h-full object-cover" />
                            ) : (
                              b.userName[0].toUpperCase()
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100 truncate">
                              {b.userId === currentUserId ? "You" : b.userName}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            {isSettled ? (
                              <span className="text-[12px] font-semibold text-neutral-400">settled</span>
                            ) : (
                              <>
                                <p className={cn("text-[10px] font-bold uppercase tracking-wider", isOwed ? "text-emerald-600/70" : "text-rose-600/70")}>
                                  {isOwed ? "gets back" : "owes"}
                                </p>
                                <p className={cn("text-[14px] font-bold font-mono", isOwed ? "text-emerald-500" : "text-rose-500")}>
                                  ₹{Math.abs(net).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
          <form onSubmit={handleAddExpense} className="space-y-5">
            {/* Description & Amount */}
            <div className="space-y-4 px-1">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-1.5 block">Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dinner, Groceries, Cab"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm((prev) => ({ ...prev, description: e.target.value }))}
                  style={{ border: 'none', borderBottom: '1px solid rgba(128,128,128,0.2)', outline: 'none', background: 'transparent', boxShadow: 'none', borderRadius: 0, padding: '8px 0' }}
                  className="w-full text-lg font-semibold placeholder:text-neutral-400 text-neutral-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-1.5 block">Amount</label>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-semibold text-neutral-500">₹</span>
                  <input
                    type="number"
                    required
                    placeholder="0.00"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))}
                    style={{ border: 'none', borderBottom: '1px solid rgba(128,128,128,0.2)', outline: 'none', background: 'transparent', boxShadow: 'none', borderRadius: 0, padding: '8px 0' }}
                    className="flex-1 text-lg font-semibold font-mono text-neutral-900 dark:text-white placeholder:text-neutral-400"
                  />
                </div>
              </div>
            </div>

            {/* Paid by / Split */}
            <div className="flex items-center justify-center gap-2 text-[14px] text-neutral-600 dark:text-neutral-400 py-2 px-1">
              <span>Paid by</span>
              <Select value={expenseForm.paidByUserId} onValueChange={(val) => setExpenseForm((prev) => ({ ...prev, paidByUserId: val || "" }))}>
                <SelectTrigger className="w-auto h-auto px-1 py-0.5 border-none shadow-none rounded-none border-b-[1.5px] border-neutral-900 dark:border-white text-[14px] font-bold text-neutral-900 dark:text-white bg-transparent hover:bg-black/5 dark:hover:bg-white/5 data-[state=open]:bg-black/5 dark:data-[state=open]:bg-white/5 transition-colors focus:ring-0">
                  {groupDetails.members.find(m => m.userId === expenseForm.paidByUserId)?.userId === currentUserId 
                    ? "you" 
                    : groupDetails.members.find(m => m.userId === expenseForm.paidByUserId)?.name}
                </SelectTrigger>
                <SelectContent>
                  {groupDetails.members.map((m) => (
                    <SelectItem key={m.userId} value={m.userId}>
                      {m.userId === currentUserId ? "you" : m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>· split</span>
              <Select value={splitType} onValueChange={(val) => setSplitType((val as any) || "EQUAL")}>
                <SelectTrigger className="w-auto h-auto px-1 py-0.5 border-none shadow-none rounded-none border-b-[1.5px] border-neutral-900 dark:border-white text-[14px] font-bold text-neutral-900 dark:text-white bg-transparent hover:bg-black/5 dark:hover:bg-white/5 data-[state=open]:bg-black/5 dark:data-[state=open]:bg-white/5 transition-colors focus:ring-0">
                  {splitType === "EQUAL" ? "equally" : splitType === "UNEQUAL" ? "unequally" : "by %"}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EQUAL">equally</SelectItem>
                  <SelectItem value="UNEQUAL">unequally</SelectItem>
                  <SelectItem value="PERCENTAGE">by %</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sync settings to payer's accounts */}
            {expenseForm.paidByUserId === currentUserId && (
              <div className="space-y-1.5 px-1 pb-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-1.5 block">Deduct From Personal Account</label>
                <NativeSelect
                  value={expenseForm.accountId}
                  onChange={(e) => setExpenseForm((prev) => ({ ...prev, accountId: e.target.value }))}
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

            {/* Split Grid */}
            <div className="space-y-0 border-t border-black/[0.06] dark:border-white/[0.06]">
              {groupDetails.members.map((m) => (
                <div key={m.userId} className="flex items-center justify-between py-3 px-1 border-b border-black/[0.04] dark:border-white/[0.04] last:border-none">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-[12px] font-bold shrink-0 border border-black/5 dark:border-white/5 overflow-hidden">
                      {(m as any).image ? (
                        <img src={(m as any).image} alt={m.name} className="w-full h-full object-cover" />
                      ) : (
                        m.name[0].toUpperCase()
                      )}
                    </div>
                    <span className="text-[14px] font-semibold text-neutral-900 dark:text-white">{m.userId === currentUserId ? "You" : m.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {splitType === "EQUAL" ? (
                      <span className="text-[14px] text-neutral-700 dark:text-neutral-300 font-mono font-semibold">
                        ₹{expenseForm.amount
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
                          className="w-24 px-2 py-1 text-sm font-mono text-right border-neutral-300 dark:border-neutral-700 font-semibold"
                        />
                        <span className="absolute right-2.5 text-[11px] text-neutral-400 select-none">
                          {splitType === "PERCENTAGE" ? "%" : "₹"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
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

      <AppDialog open={showInviteModal} onOpenChange={setShowInviteModal} title="Invite Friends">
        <div className="space-y-6 text-center py-4">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-500 mb-4">
            <UserPlus size={28} />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight mb-2">Share this invite code</h3>
            <p className="text-sm text-neutral-500">
              Anyone with this code can instantly join the <span className="font-semibold text-neutral-900 dark:text-white">"{groupDetails?.group.name}"</span> group.
            </p>
          </div>
          
          <div className="bg-neutral-50 dark:bg-neutral-900 p-6 rounded-2xl border border-black/5 dark:border-white/5">
            <p className="text-4xl font-mono font-bold tracking-[0.2em] text-neutral-900 dark:text-white mb-4">
              {groupDetails?.group.inviteCode}
            </p>
            <Button 
              type="button" 
              variant="cta" 
              className="w-full"
              onClick={() => {
                navigator.clipboard.writeText(groupDetails?.group.inviteCode || "");
                toast.success("Invite code copied to clipboard!");
              }}
            >
              Copy Invite Code
            </Button>
          </div>
        </div>
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
          <form onSubmit={handleEditExpenseSubmit} className="space-y-5">
            {/* Description & Amount */}
            <div className="space-y-4 px-1">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-1.5 block">Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dinner, Groceries, Cab"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm((prev) => ({ ...prev, description: e.target.value }))}
                  style={{ border: 'none', borderBottom: '1px solid rgba(128,128,128,0.2)', outline: 'none', background: 'transparent', boxShadow: 'none', borderRadius: 0, padding: '8px 0' }}
                  className="w-full text-lg font-semibold placeholder:text-neutral-400 text-neutral-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-1.5 block">Amount</label>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-semibold text-neutral-500">₹</span>
                  <input
                    type="number"
                    required
                    placeholder="0.00"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))}
                    style={{ border: 'none', borderBottom: '1px solid rgba(128,128,128,0.2)', outline: 'none', background: 'transparent', boxShadow: 'none', borderRadius: 0, padding: '8px 0' }}
                    className="flex-1 text-lg font-semibold font-mono text-neutral-900 dark:text-white placeholder:text-neutral-400"
                  />
                </div>
              </div>
            </div>

            {/* Paid by / Split */}
            <div className="flex items-center justify-center gap-2 text-[14px] text-neutral-600 dark:text-neutral-400 py-2 px-1">
              <span>Paid by</span>
              <Select value={expenseForm.paidByUserId} onValueChange={(val) => setExpenseForm((prev) => ({ ...prev, paidByUserId: val || "" }))}>
                <SelectTrigger className="w-auto h-auto px-1 py-0.5 border-none shadow-none rounded-none border-b-[1.5px] border-neutral-900 dark:border-white text-[14px] font-bold text-neutral-900 dark:text-white bg-transparent hover:bg-black/5 dark:hover:bg-white/5 data-[state=open]:bg-black/5 dark:data-[state=open]:bg-white/5 transition-colors focus:ring-0">
                  {groupDetails.members.find(m => m.userId === expenseForm.paidByUserId)?.userId === currentUserId 
                    ? "you" 
                    : groupDetails.members.find(m => m.userId === expenseForm.paidByUserId)?.name}
                </SelectTrigger>
                <SelectContent>
                  {groupDetails.members.map((m) => (
                    <SelectItem key={m.userId} value={m.userId}>
                      {m.userId === currentUserId ? "you" : m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>· split</span>
              <Select value={splitType} onValueChange={(val) => setSplitType((val as any) || "EQUAL")}>
                <SelectTrigger className="w-auto h-auto px-1 py-0.5 border-none shadow-none rounded-none border-b-[1.5px] border-neutral-900 dark:border-white text-[14px] font-bold text-neutral-900 dark:text-white bg-transparent hover:bg-black/5 dark:hover:bg-white/5 data-[state=open]:bg-black/5 dark:data-[state=open]:bg-white/5 transition-colors focus:ring-0">
                  {splitType === "EQUAL" ? "equally" : splitType === "UNEQUAL" ? "unequally" : "by %"}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EQUAL">equally</SelectItem>
                  <SelectItem value="UNEQUAL">unequally</SelectItem>
                  <SelectItem value="PERCENTAGE">by %</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sync settings to payer's accounts */}
            {expenseForm.paidByUserId === currentUserId && (
              <div className="space-y-1.5 px-1 pb-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-1.5 block">Deduct From Personal Account</label>
                <NativeSelect
                  value={expenseForm.accountId}
                  onChange={(e) => setExpenseForm((prev) => ({ ...prev, accountId: e.target.value }))}
                >
                  <option value="keep">Keep existing account (or ignore if none)</option>
                  <option value="skip">Unlink — don't deduct from my account</option>
                  {personalAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (₹{a.balance})
                    </option>
                  ))}
                </NativeSelect>
              </div>
            )}

            {/* Split Grid */}
            <div className="space-y-0 border-t border-black/[0.06] dark:border-white/[0.06]">
              {groupDetails.members.map((m) => (
                <div key={m.userId} className="flex items-center justify-between py-3 px-1 border-b border-black/[0.04] dark:border-white/[0.04] last:border-none">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-[12px] font-bold shrink-0 border border-black/5 dark:border-white/5 overflow-hidden">
                      {(m as any).image ? (
                        <img src={(m as any).image} alt={m.name} className="w-full h-full object-cover" />
                      ) : (
                        m.name[0].toUpperCase()
                      )}
                    </div>
                    <span className="text-[14px] font-semibold text-neutral-900 dark:text-white">{m.userId === currentUserId ? "You" : m.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {splitType === "EQUAL" ? (
                      <span className="text-[14px] text-neutral-700 dark:text-neutral-300 font-mono font-semibold">
                        ₹{expenseForm.amount
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
                          className="w-24 px-2 py-1 text-sm font-mono text-right border-neutral-300 dark:border-neutral-700 font-semibold"
                        />
                        <span className="absolute right-2.5 text-[11px] text-neutral-400 select-none">
                          {splitType === "PERCENTAGE" ? "%" : "₹"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
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
                  <option value="">Skip — will not show in personal Transactions</option>
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
                  <option value="">Skip — will not show in personal Transactions</option>
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
