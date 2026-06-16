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
    if (!newGroupForm.name) return;

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
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode) return;

    try {
      await joinGroup(inviteCode);
      setShowJoinGroup(false);
      setInviteCode("");
      toast.success("Joined group successfully");
      router.refresh();
    } catch (err: unknown) {
      toastError(err, "Failed to join group");
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
      toast.error(`Split total (₹${sumSplits}) must match expense amount (₹${totalAmount})`);
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
      toast.success("Payment recorded");
    } catch (err) {
      toastError(err, "Failed to record payment");
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

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Left panel: Group list */}
      <div className="md:col-span-1 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold tracking-tight">Your Groups</h3>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline-app"
              onClick={() => setShowJoinGroup(true)}
              className="gap-1 px-2.5 py-1.5 border-black/[0.04] dark:border-neutral-800"
            >
              <UserPlus size={14} />
              Join
            </Button>
            <Button
              type="button"
              variant="cta"
              onClick={() => setShowCreateGroup(true)}
              className="gap-1 px-2.5 py-1.5 shadow-none"
            >
              <Plus size={14} />
              Create
            </Button>
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
              const isConfirmingDelete = confirmDeleteGroupId === g.id;
              const isConfirmingLeave = confirmLeaveGroupId === g.id;
              const isDeleting = deletingGroupId === g.id;
              const isLeaving = leavingGroupId === g.id;
              return (
                <div key={g.id} className="relative group/card">
                  <Button
                    type="button"
                    variant="unstyled"
                    onClick={() => {
                      setConfirmDeleteGroupId(null);
                      setConfirmLeaveGroupId(null);
                      setSelectedGroupId(g.id);
                    }}
                    className={cn(
                      "w-full h-auto min-h-0 text-left py-3.5 px-4 rounded-lg border transition-all duration-150 flex items-center justify-between gap-3 pr-12 text-sm font-normal",
                      selectedGroupId === g.id
                        ? "border-neutral-900 bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900"
                        : "border-black/[0.04] bg-white dark:border-neutral-800 dark:bg-[#18181b] hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold leading-snug truncate">{g.name}</h4>
                      <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                        {formatGroupType(g.type)} · {g.members.length} member{g.members.length !== 1 ? "s" : ""}
                        {isOwner ? " · You manage this group" : ""}
                      </p>
                    </div>
                    <ArrowRight size={14} className="text-neutral-400 shrink-0" />
                  </Button>

                  {/* Owner: delete — Member: leave */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover/card:opacity-100 transition-opacity">
                    {isOwner ? (
                      isConfirmingDelete ? (
                        <>
                          <Button
                            type="button"
                            variant="destructive-sm"
                            onClick={() => handleDeleteGroup(g.id)}
                            title="Confirm delete group"
                          >
                            {isDeleting ? <Loader2 size={11} className="animate-spin" /> : "Delete?"}
                          </Button>
                          <Button
                            type="button"
                            variant="unstyled"
                            onClick={() => setConfirmDeleteGroupId(null)}
                            className="p-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-[10px] font-bold"
                          >
                            No
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          variant="unstyled"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmLeaveGroupId(null);
                            handleDeleteGroup(g.id);
                          }}
                          disabled={isDeleting}
                          className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 text-neutral-400 hover:text-red-500 transition-colors disabled:opacity-50"
                          title="Delete group"
                        >
                          {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </Button>
                      )
                    ) : isConfirmingLeave ? (
                      <>
                        <Button
                          type="button"
                          variant="destructive-sm"
                          onClick={() => handleLeaveGroup(g.id)}
                          title="Confirm leave group"
                        >
                          {isLeaving ? <Loader2 size={11} className="animate-spin" /> : "Leave?"}
                        </Button>
                        <Button
                          type="button"
                          variant="unstyled"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmLeaveGroupId(null);
                          }}
                          className="p-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-[10px] font-bold"
                        >
                          No
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="unstyled"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteGroupId(null);
                          handleLeaveGroup(g.id);
                        }}
                        disabled={isLeaving}
                        className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors disabled:opacity-50"
                        title="Leave group"
                      >
                        {isLeaving ? <Loader2 size={13} className="animate-spin" /> : <LogOut size={13} />}
                      </Button>
                    )}
                  </div>
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

            {/* Balances Dashboard Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Balances list */}
              <div className="panel-card p-5 space-y-4">
                <SectionHeading
                  title="Who owes what"
                  description="Each member's balance after splitting all shared expenses."
                />
                <div className="space-y-2">
                  {groupDetails.balances.map((b) => {
                    const isOwed = b.netBalance > 0.01;
                    const isDebtor = b.netBalance < -0.01;
                    return (
                      <div key={b.userId} className="flex items-center justify-between py-2 border-b border-neutral-50 dark:border-neutral-800/40 last:border-none">
                        <div>
                          <p className="text-sm font-semibold">{b.userName}</p>
                          <p className="text-[11px] text-neutral-400 mt-0.5">{b.userEmail}</p>
                        </div>
                        <span
                          className={cn(
                            "text-xs font-semibold font-mono text-right",
                            isOwed ? "text-emerald-600" : isDebtor ? "text-rose-600" : "text-neutral-400"
                          )}
                        >
                          {isOwed
                            ? `Gets back ₹${Math.abs(b.netBalance).toLocaleString()}`
                            : isDebtor
                              ? `Owes ₹${Math.abs(b.netBalance).toLocaleString()}`
                              : "All settled"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="panel-card p-5 space-y-4">
                <SectionHeading
                  title="Easiest way to settle"
                  description="Fewest payments needed to clear everyone's balance."
                />
                <div className="space-y-3">
                  {groupDetails.optimizedSettlements.length === 0 ? (
                    <div className="py-8 text-center text-xs text-neutral-400 flex flex-col items-center justify-center">
                      <Check size={20} className="text-emerald-500 mb-1" />
                      Everyone is settled up in this group.
                    </div>
                  ) : (
                    groupDetails.optimizedSettlements.map((s, idx) => {
                      const isInvolved =
                        currentUserId === s.fromUserId || currentUserId === s.toUserId;
                      const youPay = currentUserId === s.fromUserId;
                      const youReceive = currentUserId === s.toUserId;

                      return (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-neutral-50 dark:border-neutral-800/40 last:border-none">
                        <div className="text-sm">
                          {youPay ? (
                            <>
                              <span className="text-neutral-500">You pay </span>
                              <span className="font-semibold">{s.toUserName}</span>
                            </>
                          ) : youReceive ? (
                            <>
                              <span className="font-semibold">{s.fromUserName}</span>
                              <span className="text-neutral-500"> pays you</span>
                            </>
                          ) : (
                            <>
                              <span className="font-semibold">{s.fromUserName}</span>
                              <span className="text-neutral-400 mx-1.5">pays</span>
                              <span className="font-semibold">{s.toUserName}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "font-bold font-mono text-sm",
                              youPay ? "text-rose-600" : youReceive ? "text-emerald-600" : "text-neutral-500"
                            )}
                          >
                            ₹{s.amount.toLocaleString()}
                          </span>
                          {isInvolved ? (
                          <Button
                            type="button"
                            variant="outline-app"
                            onClick={() => {
                              setSettlementForm({
                                payerId: s.fromUserId,
                                receiverId: s.toUserId,
                                amount: String(s.amount),
                                notes: `Payment for ${groupDetails.group.name}`,
                                accountId: personalAccounts[0]?.id || "",
                                receiveAccountId: "",
                              });
                              setShowSettleModal(true);
                            }}
                            className="px-2.5 py-1 text-[11px]"
                          >
                            {youPay ? "Mark as paid" : "Confirm received"}
                          </Button>
                          ) : (
                            <span className="text-[10px] text-neutral-400 italic px-1">
                              Between other members
                            </span>
                          )}
                        </div>
                      </div>
                    );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Expenses List */}
            <div className="panel-card p-5 space-y-4">
              <SectionHeading
                title="Shared expenses"
                description="Everything the group has spent together, and who paid."
              />
              <div className="space-y-1">
                {groupDetails.expenses.length === 0 ? (
                  <div className="py-12 text-center text-xs text-neutral-400">
                    No expenses yet. Tap &quot;Add Expense&quot; to split a bill.
                  </div>
                ) : (
                  groupDetails.expenses.map((e) => {
                    const payer = groupDetails.members.find((m) => m.userId === e.paidByUserId);
                    const splitSummary = e.splits
                      .map((s) => {
                        const member = groupDetails.members.find((m) => m.userId === s.userId);
                        return `${member?.name?.split(" ")[0] ?? "Member"}: ₹${s.amount}`;
                      })
                      .join(" · ");
                    return (
                      <div key={e.id} className="flex items-start justify-between gap-4 py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-none">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold capitalize">{e.description}</p>
                          <p className="text-[11px] text-neutral-500 mt-0.5">
                            Paid by {payer?.name ?? "someone"} · {new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                          <p className="text-[10px] text-neutral-400 mt-1 truncate" title={splitSummary}>
                            Split: {splitSummary}
                          </p>
                        </div>
                        <span className="text-sm font-bold font-mono shrink-0">
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
            <Button type="submit" variant="submit">
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
            <Button type="submit" variant="submit">
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
              <Button type="submit" variant="submit">
                Save Expense
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
