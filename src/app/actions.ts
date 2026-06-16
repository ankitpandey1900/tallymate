"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { UnifiedDB, UnifiedTransaction, UnifiedGroup } from "@/lib/unified-db";
import { calculateBalances, minimizeDebts } from "@/lib/split-engine";
import { uploadFile } from "@/lib/storage";
import { redirect } from "next/navigation";
import { cache } from "react";
import { computeReports, type ReportMetrics, getReportStartDate } from "@/lib/reports";
import { enforceActionRateLimit } from "@/lib/rate-limit";

// Helper to get active session user or redirect if unauthenticated
export const getCurrentUser = cache(async () => {
  try {
    const reqHeaders = await headers();

    const session = await auth.api.getSession({
      headers: reqHeaders,
    });
    
    if (session?.user) {
      return session.user;
    }
  } catch (error) {
    console.error("Auth session lookup failed:", error);
  }
  
  redirect("/login");
});

// Accounts actions
export async function getAccounts() {
  const user = await getCurrentUser();
  return await UnifiedDB.getAccounts(user.id);
}

// Dashboard (single fetch to reduce round-trips)
export async function getDashboardData(timeframe: "weekly" | "monthly" | "quarterly" | "yearly" = "monthly") {
  const user = await getCurrentUser();

  const [accounts, transactions, budgets, goals, groups, reports] =
    await Promise.all([
      UnifiedDB.getAccounts(user.id),
      UnifiedDB.getTransactions(user.id, { limit: 5 }),
      UnifiedDB.getBudgets(user.id),
      UnifiedDB.getGoals(user.id),
      UnifiedDB.getGroups(user.id),
      getReports(timeframe),
    ]);

  return {
    accounts,
    transactions,
    budgets,
    goals,
    groups,
    reports,
  };
}

export async function createAccount(data: { name: string; type: string; balance: number }) {
  const reqHeaders = await headers();
  await enforceActionRateLimit(reqHeaders, "createAccount", 40, 60);
  const user = await getCurrentUser();
  const acc = await UnifiedDB.createAccount(user.id, data);
  
  await UnifiedDB.createNotification(
    user.id,
    "Financial Account Created",
    `Account "${data.name}" has been created with a starting balance of ₹${data.balance}.`,
    "GOAL_PROGRESS"
  );
  
  return acc;
}

// Categories actions
export async function getCategories() {
  const user = await getCurrentUser();
  return await UnifiedDB.getCategories(user.id);
}

export async function createCategory(data: { name: string; color: string }) {
  const user = await getCurrentUser();
  return await UnifiedDB.createCategory(user.id, data.name, data.color);
}

// Income Sources actions
export async function getIncomeSources() {
  const user = await getCurrentUser();
  return await UnifiedDB.getIncomeSources(user.id);
}

export async function createIncomeSource(data: { name: string }) {
  const user = await getCurrentUser();
  return await UnifiedDB.createIncomeSource(user.id, data.name);
}

// Transactions actions
export async function getTransactions(filters?: { groupId?: string; type?: string; limit?: number }) {
  const user = await getCurrentUser();
  return await UnifiedDB.getTransactions(user.id, filters);
}

export async function createTransaction(data: Omit<UnifiedTransaction, "id" | "userId">) {
  const reqHeaders = await headers();
  await enforceActionRateLimit(reqHeaders, "createTransaction", 120, 60);
  const user = await getCurrentUser();
  const tx = await UnifiedDB.createTransaction(user.id, {
    ...data,
    userId: user.id,
  });

  // Check budgets after creating an expense transaction
  if (data.type === "EXPENSE" && data.categoryId) {
    await checkBudgetsForCategory(user.id, data.categoryId);
  }

  return tx;
}

// Budgets actions
export async function getBudgets() {
  const user = await getCurrentUser();
  return await UnifiedDB.getBudgets(user.id);
}

export async function createBudget(data: { categoryId: string | null; amount: number; period: string; startDate: string; endDate: string; groupId?: string }) {
  const reqHeaders = await headers();
  await enforceActionRateLimit(reqHeaders, "createBudget", 30, 60);
  const user = await getCurrentUser();
  return await UnifiedDB.createBudget(user.id, {
    categoryId: data.categoryId,
    groupId: data.groupId || null,
    amount: data.amount,
    period: data.period,
    startDate: data.startDate,
    endDate: data.endDate,
  });
}

// Helper: Check budgets and trigger notifications
async function checkBudgetsForCategory(userId: string, categoryId: string) {
  const budgets = await UnifiedDB.getBudgets(userId);
  const catBudgets = budgets.filter((b) => b.categoryId === categoryId);
  const categories = await UnifiedDB.getCategories(userId);
  const category = categories.find((c) => c.id === categoryId);
  const categoryName = category?.name || "Category";

  for (const b of catBudgets) {
    // Sum transactions in this budget's timeframe
    const txs = await UnifiedDB.getTransactions(userId);
    const budgetTxs = txs.filter((t) => {
      return (
        t.type === "EXPENSE" &&
        t.categoryId === categoryId &&
        new Date(t.date) >= new Date(b.startDate) &&
        new Date(t.date) <= new Date(b.endDate)
      );
    });

    const totalSpent = budgetTxs.reduce((sum, t) => sum + Number(t.amount), 0);
    const limit = Number(b.amount);
    const ratio = totalSpent / limit;

    if (ratio >= 1.0) {
      await UnifiedDB.createNotification(
        userId,
        "🚨 Budget Exceeded!",
        `You have exceeded your budget of ₹${limit} for ${categoryName}. Current spending: ₹${totalSpent}.`,
        "BUDGET_EXCEEDED"
      );
    } else if (ratio >= 0.9) {
      await UnifiedDB.createNotification(
        userId,
        "⚠️ Budget Warning (90%)",
        `You have used 90% of your budget (₹${limit}) for ${categoryName}. Current spending: ₹${totalSpent}.`,
        "BUDGET_WARNING"
      );
    } else if (ratio >= 0.8) {
      await UnifiedDB.createNotification(
        userId,
        "⚠️ Budget Warning (80%)",
        `You have used 80% of your budget (₹${limit}) for ${categoryName}. Current spending: ₹${totalSpent}.`,
        "BUDGET_WARNING"
      );
    }
  }
}

// Financial Goals actions
export async function getGoals() {
  const user = await getCurrentUser();
  return await UnifiedDB.getGoals(user.id);
}

export async function createGoal(data: { name: string; targetAmount: number; currentAmount: number; deadline?: string }) {
  const reqHeaders = await headers();
  await enforceActionRateLimit(reqHeaders, "createGoal", 30, 60);
  const user = await getCurrentUser();
  return await UnifiedDB.createGoal(user.id, data);
}

export async function updateGoalProgress(goalId: string, currentAmount: number) {
  const user = await getCurrentUser();
  const goal = await UnifiedDB.updateGoal(user.id, goalId, { currentAmount });

  const progressPercent = Math.round((goal.currentAmount / goal.targetAmount) * 100);
  if (progressPercent >= 100) {
    await UnifiedDB.createNotification(
      user.id,
      "🎉 Goal Achieved!",
      `Congratulations! You have reached your savings goal "${goal.name}" of ₹${goal.targetAmount}!`,
      "GOAL_PROGRESS"
    );
  } else {
    await UnifiedDB.createNotification(
      user.id,
      "📈 Goal Progress Updated",
      `Savings goal "${goal.name}" is now at ${progressPercent}% progress (₹${goal.currentAmount} / ₹${goal.targetAmount}).`,
      "GOAL_PROGRESS"
    );
  }

  return goal;
}

// Group operations
export async function getGroups() {
  const user = await getCurrentUser();
  return await UnifiedDB.getGroups(user.id);
}

export async function joinGroup(inviteCode: string) {
  const user = await getCurrentUser();
  return await UnifiedDB.joinGroupByInviteCode(user.id, inviteCode);
}

export async function createGroup(data: { name: string; type: string; memberEmails: string[] }) {
  const reqHeaders = await headers();
  await enforceActionRateLimit(reqHeaders, "createGroup", 20, 60);
  const user = await getCurrentUser();
  
  // Resolve emails to user IDs, or create stub users
  const resolvedMemberIds: string[] = [user.id];
  const allUsers = await UnifiedDB.getAllUsers();

  for (const email of data.memberEmails) {
    if (!email.trim()) continue;
    const existing = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      resolvedMemberIds.push(existing.id);
    } else {
      // Create stub user
      const stub = await UnifiedDB.createUser({
        email: email.toLowerCase(),
        name: email.split("@")[0],
      });
      resolvedMemberIds.push(stub.id);
    }
  }

  const newGroup = await UnifiedDB.createGroup(user.id, {
    name: data.name,
    type: data.type,
    members: resolvedMemberIds,
  });

  // Notify other members
  for (const memberId of resolvedMemberIds) {
    if (memberId === user.id) continue;
    await UnifiedDB.createNotification(
      memberId,
      "New Group Invitation",
      `You have been added to the group "${data.name}" by ${user.name || user.email}.`,
      "NEW_GROUP_EXPENSE"
    );
  }

  return newGroup;
}

export async function updateGroupSettings(groupId: string, settings: Partial<Omit<UnifiedGroup, "id" | "name" | "type" | "members">>) {
  return await UnifiedDB.updateGroupSettings(groupId, settings);
}

export async function getGroupDetails(groupId: string) {
  const user = await getCurrentUser();
  const groups = await UnifiedDB.getGroups(user.id);
  const group = groups.find((g) => g.id === groupId);

  if (!group) throw new Error("Group not found or access denied.");

  const allUsers = await UnifiedDB.getAllUsers();
  const expenses = await UnifiedDB.getGroupExpenses(groupId);
  const settlements = await UnifiedDB.getSettlements(groupId);

  // Map user ID to member metadata
  const groupMembersWithDetails = group.members.map((m) => {
    const details = allUsers.find((u) => u.id === m.userId);
    return {
      userId: m.userId,
      role: m.role,
      name: details?.name || details?.email || "Unknown",
      email: details?.email || "",
    };
  });

  // Map expenses to matching engine inputs
  const engineExpenses = expenses.map((e) => ({
    amount: e.amount,
    paidByUserId: e.paidByUserId,
    splits: e.splits.map((s) => ({ userId: s.userId, amount: s.amount })),
  }));

  const engineSettlements = settlements.map((s) => ({
    payerId: s.payerId,
    receiverId: s.receiverId,
    amount: s.amount,
  }));

  const balances = calculateBalances(groupMembersWithDetails, engineExpenses, engineSettlements);
  const optimizedSettlements = minimizeDebts(groupMembersWithDetails, balances);

  return {
    group,
    members: groupMembersWithDetails,
    expenses,
    settlements,
    balances,
    optimizedSettlements,
  };
}

export async function createGroupExpense(
  groupId: string,
  data: {
    amount: number;
    description: string;
    paidByUserId: string;
    splits: { userId: string; amount: number; type: string }[];
    accountId?: string; // personal account used to pay
  }
) {
  const reqHeaders = await headers();
  await enforceActionRateLimit(reqHeaders, "createGroupExpense", 80, 60);
  const user = await getCurrentUser();
  
  // Save group expense
  const groupExpense = await UnifiedDB.createGroupExpense(groupId, {
    amount: data.amount,
    description: data.description,
    date: new Date().toISOString(),
    paidByUserId: data.paidByUserId,
    splits: data.splits,
  });

  // Unified Finance Engine integration:
  // If the active user paid for it (paidByUserId === user.id) and selected a payment account,
  // record it in their personal transaction records so account balance is deducted.
  if (data.paidByUserId === user.id && data.accountId) {
    await UnifiedDB.createTransaction(user.id, {
      userId: user.id,
      accountId: data.accountId,
      type: "EXPENSE",
      scope: "GROUP",
      amount: data.amount, // Full out of pocket amount paid
      date: new Date().toISOString(),
      description: `[Group Paid] ${data.description}`,
      notes: `Total group expense was ₹${data.amount}. Your share is ₹${
        data.splits.find((s) => s.userId === user.id)?.amount || 0
      }.`,
      tags: ["Group Expense"],
      groupId,
    });
  }

  // Create notifications for group members
  const groups = await UnifiedDB.getGroups(user.id);
  const group = groups.find((g) => g.id === groupId);
  const groupName = group?.name || "Group";

  for (const split of data.splits) {
    if (split.userId === data.paidByUserId) continue;
    await UnifiedDB.createNotification(
      split.userId,
      "New Group Expense",
      `₹${split.amount} owes to ${user.name || user.email} for "${data.description}" in ${groupName}.`,
      "NEW_GROUP_EXPENSE"
    );
  }

  return groupExpense;
}

export async function createSettlement(
  groupId: string,
  data: {
    payerId: string;
    receiverId: string;
    amount: number;
    notes?: string;
    accountId?: string; // Payer's personal account
    receiveAccountId?: string; // Receiver's personal account
  }
) {
  const reqHeaders = await headers();
  await enforceActionRateLimit(reqHeaders, "createSettlement", 60, 60);
  const user = await getCurrentUser();

  const settlement = await UnifiedDB.createSettlement(groupId, {
    payerId: data.payerId,
    receiverId: data.receiverId,
    amount: data.amount,
    date: new Date().toISOString(),
    notes: data.notes,
  });

  // Unified Finance Engine reconcile:
  // Payer records settlement as an expense / out-of-pocket transfer
  if (data.payerId === user.id && data.accountId) {
    await UnifiedDB.createTransaction(user.id, {
      userId: user.id,
      accountId: data.accountId,
      type: "EXPENSE",
      scope: "GROUP",
      amount: data.amount,
      date: new Date().toISOString(),
      description: `[Settlement Paid]`,
      notes: data.notes || "Settled balance in group.",
      tags: ["Settlement"],
      groupId,
    });
  }

  // Receiver records settlement as income
  if (data.receiverId === user.id && data.receiveAccountId) {
    await UnifiedDB.createTransaction(user.id, {
      userId: user.id,
      accountId: data.receiveAccountId,
      type: "INCOME",
      scope: "GROUP",
      amount: data.amount,
      date: new Date().toISOString(),
      description: `[Settlement Received]`,
      notes: data.notes || "Received settlement in group.",
      tags: ["Settlement"],
      groupId,
    });
  }

  // Notify receiver
  await UnifiedDB.createNotification(
    data.receiverId,
    "Payment Received (Settlement)",
    `User has paid you ₹${data.amount} to settle balances in group.`,
    "SETTLEMENT_REMINDER"
  );

  return settlement;
}

// Notifications actions
export async function getNotifications() {
  const user = await getCurrentUser();
  return await UnifiedDB.getNotifications(user.id, { limit: 100 });
}

export async function markNotificationAsRead(id: string) {
  return await UnifiedDB.markNotificationRead(id);
}

// Reports & Analytics actions
export async function getReports(timeframe: "weekly" | "monthly" | "quarterly" | "yearly") {
  const user = await getCurrentUser();
  const now = new Date();
  const startDate = getReportStartDate(timeframe, now);

  const [txs, categories, incomeSources] = await Promise.all([
    UnifiedDB.getTransactions(user.id, { startDate: startDate.toISOString(), endDate: now.toISOString() }),
    UnifiedDB.getCategories(user.id),
    UnifiedDB.getIncomeSources(user.id),
  ]);

  const metrics: ReportMetrics = computeReports(txs, categories, incomeSources, timeframe, now);
  return metrics;
}

export async function uploadReceipt(formData: FormData) {
  const reqHeaders = await headers();
  await enforceActionRateLimit(reqHeaders, "uploadReceipt", 30, 60);
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");
  const result = await uploadFile(file);
  return result;
}

export async function deleteTransaction(txId: string) {
  const user = await getCurrentUser();
  await UnifiedDB.deleteTransaction(user.id, txId);
}

export async function updateTransaction(
  txId: string,
  data: Partial<Omit<UnifiedTransaction, "id" | "userId">>
) {
  const user = await getCurrentUser();
  return await UnifiedDB.updateTransaction(user.id, txId, data);
}

export async function deleteGroup(groupId: string) {
  const user = await getCurrentUser();
  await UnifiedDB.deleteGroup(user.id, groupId);
}

export async function deleteBudget(budgetId: string) {
  const user = await getCurrentUser();
  await UnifiedDB.deleteBudget(user.id, budgetId);
}

export async function deleteGoal(goalId: string) {
  const user = await getCurrentUser();
  await UnifiedDB.deleteGoal(user.id, goalId);
}
