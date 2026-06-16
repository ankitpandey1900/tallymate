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
import { getOrSetPageCache, invalidateUserPageCache } from "@/lib/page-cache";

const DEFAULT_CATEGORIES = [
  { name: "Food & Dining", color: "#EF4444" },
  { name: "Transport", color: "#3B82F6" },
  { name: "Shopping", color: "#8B5CF6" },
  { name: "Entertainment", color: "#F59E0B" },
  { name: "Bills & Rent", color: "#10B981" },
];

const DEFAULT_INCOME_SOURCES = ["Salary", "Freelancing", "Investments"];

async function ensureUserDefaults(userId: string) {
  const [categories, incomeSources] = await Promise.all([
    UnifiedDB.getCategories(userId),
    UnifiedDB.getIncomeSources(userId),
  ]);

  const tasks: Promise<unknown>[] = [];
  if (categories.length === 0) {
    tasks.push(
      ...DEFAULT_CATEGORIES.map((c) => UnifiedDB.createCategory(userId, c.name, c.color))
    );
  }
  if (incomeSources.length === 0) {
    tasks.push(
      ...DEFAULT_INCOME_SOURCES.map((name) => UnifiedDB.createIncomeSource(userId, name))
    );
  }
  if (tasks.length > 0) {
    await Promise.all(tasks);
  }
}

/** Seed defaults only when catalog is empty — avoids extra writes on every load. */
const ensureCatalogDefaults = cache(async (userId: string) => {
  const [categories, incomeSources] = await Promise.all([
    UnifiedDB.getCategories(userId),
    UnifiedDB.getIncomeSources(userId),
  ]);

  if (categories.length === 0 || incomeSources.length === 0) {
    await ensureUserDefaults(userId);
    return {
      categories: categories.length === 0 ? await UnifiedDB.getCategories(userId) : categories,
      incomeSources:
        incomeSources.length === 0 ? await UnifiedDB.getIncomeSources(userId) : incomeSources,
    };
  }

  return { categories, incomeSources };
});

function computeBudgetProgress(
  budgets: Awaited<ReturnType<typeof UnifiedDB.getBudgets>>,
  categories: Awaited<ReturnType<typeof UnifiedDB.getCategories>>,
  groups: Awaited<ReturnType<typeof UnifiedDB.getGroups>>,
  transactions: UnifiedTransaction[]
) {
  return budgets.map((budget) => {
    const cat = categories.find((catItem) => catItem.id === budget.categoryId);
    const grp = groups.find((g) => g.id === budget.groupId);

    const spent = transactions
      .filter((t) => {
        const isMatchCategory = !budget.categoryId || t.categoryId === budget.categoryId;
        const isMatchGroup = !budget.groupId || t.groupId === budget.groupId;
        const isExpense = t.type === "EXPENSE";
        const isDateInRange =
          new Date(t.date) >= new Date(budget.startDate) &&
          new Date(t.date) <= new Date(budget.endDate);
        return isMatchCategory && isMatchGroup && isExpense && isDateInRange;
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const limit = Number(budget.amount);
    const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
    const remaining = Math.max(limit - spent, 0);

    return {
      budget,
      categoryName: cat?.name || "Overall Monthly",
      groupName: grp?.name || null,
      spent,
      remaining,
      percentage,
    };
  });
}

async function getReportsForUser(
  userId: string,
  timeframe: "weekly" | "monthly" | "quarterly" | "yearly"
): Promise<ReportMetrics> {
  const now = new Date();
  const startDate = getReportStartDate(timeframe, now);

  const [txs, categories, incomeSources] = await Promise.all([
    UnifiedDB.getTransactions(userId, { startDate: startDate.toISOString(), endDate: now.toISOString() }),
    UnifiedDB.getCategories(userId),
    UnifiedDB.getIncomeSources(userId),
  ]);

  return computeReports(txs, categories, incomeSources, timeframe, now);
}

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

async function bustPageCache(userId: string) {
  await invalidateUserPageCache(userId);
}

// Accounts actions
export async function getAccounts() {
  const user = await getCurrentUser();
  return await UnifiedDB.getAccounts(user.id);
}

// Dashboard (single fetch to reduce round-trips)
export async function getDashboardData(timeframe: "weekly" | "monthly" | "quarterly" | "yearly" = "monthly") {
  const user = await getCurrentUser();

  return getOrSetPageCache(
    user.id,
    "dashboard",
    async () => {
      const [accounts, transactions, budgets, goals, groups, reports, catalog] =
        await Promise.all([
          UnifiedDB.getAccounts(user.id),
          UnifiedDB.getTransactions(user.id, { limit: 5 }),
          UnifiedDB.getBudgets(user.id),
          UnifiedDB.getGoals(user.id),
          UnifiedDB.getGroups(user.id),
          getReportsForUser(user.id, timeframe),
          ensureCatalogDefaults(user.id),
        ]);

      return {
        accounts,
        transactions,
        budgets,
        goals,
        groups,
        reports,
        categories: catalog.categories,
        incomeSources: catalog.incomeSources,
      };
    },
    timeframe
  );
}

// Shell layout — one round-trip for sidebar user + notification badge
export async function getLayoutData() {
  const user = await getCurrentUser();
  return getOrSetPageCache(user.id, "layout", async () => {
    const notifications = await UnifiedDB.getNotifications(user.id, { limit: 20 });
    return {
      user: { id: user.id, name: user.name, email: user.email, image: user.image },
      notifications,
    };
  });
}

export async function getTransactionsPageData() {
  const user = await getCurrentUser();
  return getOrSetPageCache(user.id, "transactions", async () => {
    const [catalog, accounts, transactions] = await Promise.all([
      ensureCatalogDefaults(user.id),
      UnifiedDB.getAccounts(user.id),
      UnifiedDB.getTransactions(user.id, { limit: 200 }),
    ]);
    return {
      accounts,
      transactions,
      categories: catalog.categories,
      incomeSources: catalog.incomeSources,
    };
  });
}

export async function getBudgetsPageData() {
  const user = await getCurrentUser();
  return getOrSetPageCache(user.id, "budgets", async () => {
    const [budgets, categories, groups] = await Promise.all([
      UnifiedDB.getBudgets(user.id),
      UnifiedDB.getCategories(user.id),
      UnifiedDB.getGroups(user.id),
    ]);

    let transactions: UnifiedTransaction[] = [];
    if (budgets.length > 0) {
      const startMs = Math.min(...budgets.map((b) => new Date(b.startDate).getTime()));
      const endMs = Math.max(...budgets.map((b) => new Date(b.endDate).getTime()));
      transactions = await UnifiedDB.getTransactions(user.id, {
        type: "EXPENSE",
        startDate: new Date(startMs).toISOString(),
        endDate: new Date(endMs).toISOString(),
      });
    }

    return {
      budgets,
      categories,
      groups,
      budgetProgressList: computeBudgetProgress(budgets, categories, groups, transactions),
    };
  });
}

export async function getGroupsPageData() {
  const user = await getCurrentUser();
  return getOrSetPageCache(user.id, "groups", async () => {
    const [groups, accounts] = await Promise.all([
      UnifiedDB.getGroups(user.id),
      UnifiedDB.getAccounts(user.id),
    ]);
    return { groups, accounts, userId: user.id };
  });
}

export async function getGoalsPageData() {
  const user = await getCurrentUser();
  return getOrSetPageCache(user.id, "goals", async () => {
    const goals = await UnifiedDB.getGoals(user.id);
    return { goals };
  });
}

export async function getSettingsPageData() {
  const user = await getCurrentUser();
  return getOrSetPageCache(user.id, "settings", async () => {
    const catalog = await ensureCatalogDefaults(user.id);
    return {
      user: { id: user.id, name: user.name, email: user.email, image: user.image },
      categories: catalog.categories,
      incomeSources: catalog.incomeSources,
    };
  });
}

export async function getReportsPageData(
  timeframe: "weekly" | "monthly" | "quarterly" | "yearly" = "monthly"
) {
  const user = await getCurrentUser();
  return getOrSetPageCache(
    user.id,
    "reports",
    async () => {
      const reports = await getReportsForUser(user.id, timeframe);
      return { reports, timeframe };
    },
    timeframe
  );
}

export async function getNotificationsPageData() {
  const user = await getCurrentUser();
  return getOrSetPageCache(user.id, "notifications", async () => {
    const notifications = await UnifiedDB.getNotifications(user.id, { limit: 100 });
    return { notifications };
  });
}

export async function getDebtTrackerData() {
  const user = await getCurrentUser();

  return getOrSetPageCache(user.id, "debts", async () => {
    const groups = await UnifiedDB.getGroups(user.id);

    let totalYouOwe = 0;
    let totalOwedToYou = 0;
    const groupSummaries: {
      groupId: string;
      groupName: string;
      yourBalance: number;
      pendingCount: number;
    }[] = [];
    const pendingSettlements: {
      groupId: string;
      groupName: string;
      fromUserId: string;
      fromUserName: string;
      toUserId: string;
      toUserName: string;
      amount: number;
      youArePayer: boolean;
      youAreReceiver: boolean;
    }[] = [];
    const peopleMap = new Map<
      string,
      { name: string; email: string; youOwe: number; owesYou: number; groups: Set<string> }
    >();

    for (const group of groups) {
      const details = await getGroupDetails(group.id);
      const myBalance = details.balances.find((b) => b.userId === user.id);
      const balance = myBalance?.netBalance ?? 0;

      if (balance < -0.01) totalYouOwe += Math.abs(balance);
      if (balance > 0.01) totalOwedToYou += balance;

      const relevantSettlements = details.optimizedSettlements.filter(
        (s) => s.fromUserId === user.id || s.toUserId === user.id
      );

      groupSummaries.push({
        groupId: group.id,
        groupName: group.name,
        yourBalance: balance,
        pendingCount: relevantSettlements.length,
      });

      for (const s of details.optimizedSettlements) {
        if (s.fromUserId === user.id || s.toUserId === user.id) {
          pendingSettlements.push({
            groupId: group.id,
            groupName: group.name,
            fromUserId: s.fromUserId,
            fromUserName: s.fromUserName,
            toUserId: s.toUserId,
            toUserName: s.toUserName,
            amount: s.amount,
            youArePayer: s.fromUserId === user.id,
            youAreReceiver: s.toUserId === user.id,
          });

          const otherId = s.fromUserId === user.id ? s.toUserId : s.fromUserId;
          const otherName = s.fromUserId === user.id ? s.toUserName : s.fromUserName;
          const otherMember = details.members.find((m) => m.userId === otherId);
          const entry = peopleMap.get(otherId) ?? {
            name: otherName,
            email: otherMember?.email ?? "",
            youOwe: 0,
            owesYou: 0,
            groups: new Set<string>(),
          };
          entry.groups.add(group.name);
          if (s.fromUserId === user.id) entry.youOwe += s.amount;
          if (s.toUserId === user.id) entry.owesYou += s.amount;
          peopleMap.set(otherId, entry);
        }
      }
    }

    const people = [...peopleMap.entries()].map(([userId, data]) => ({
      userId,
      name: data.name,
      email: data.email,
      youOwe: Math.round(data.youOwe * 100) / 100,
      owesYou: Math.round(data.owesYou * 100) / 100,
      net: Math.round((data.owesYou - data.youOwe) * 100) / 100,
      groups: [...data.groups],
    }));

    const personalDebts = await UnifiedDB.getPersonalDebts(user.id);
    const activePersonal = personalDebts.filter((d) => d.status === "ACTIVE");

    let personalYouOwe = 0;
    let personalOwedToYou = 0;
    for (const d of activePersonal) {
      if (d.direction === "I_OWE") personalYouOwe += d.remainingAmount;
      else personalOwedToYou += d.remainingAmount;
    }

    const groupYouOwe = totalYouOwe;
    const groupOwedToYou = totalOwedToYou;
    totalYouOwe += personalYouOwe;
    totalOwedToYou += personalOwedToYou;

    return {
      totalYouOwe: Math.round(totalYouOwe * 100) / 100,
      totalOwedToYou: Math.round(totalOwedToYou * 100) / 100,
      netPosition: Math.round((totalOwedToYou - totalYouOwe) * 100) / 100,
      groupYouOwe: Math.round(groupYouOwe * 100) / 100,
      groupOwedToYou: Math.round(groupOwedToYou * 100) / 100,
      personalYouOwe: Math.round(personalYouOwe * 100) / 100,
      personalOwedToYou: Math.round(personalOwedToYou * 100) / 100,
      groupSummaries,
      pendingSettlements,
      people: people.sort((a, b) => b.net - a.net),
      personalDebts,
    };
  });
}

export async function createPersonalDebt(data: {
  title: string;
  counterpartyName: string;
  direction: "I_OWE" | "OWED_TO_ME";
  category: string;
  totalAmount: number;
  remainingAmount?: number;
  interestRate?: number;
  dueDate?: string;
  notes?: string;
}) {
  const reqHeaders = await headers();
  await enforceActionRateLimit(reqHeaders, "createPersonalDebt", 40, 60);
  const user = await getCurrentUser();

  if (!data.title.trim() || !data.counterpartyName.trim()) {
    throw new Error("Title and counterparty name are required.");
  }
  if (data.totalAmount <= 0) {
    throw new Error("Amount must be greater than zero.");
  }

  const debt = await UnifiedDB.createPersonalDebt(user.id, data);
  await bustPageCache(user.id);
  return debt;
}

export async function recordPersonalDebtPayment(
  debtId: string,
  data: { amount: number; notes?: string; date?: string }
) {
  const reqHeaders = await headers();
  await enforceActionRateLimit(reqHeaders, "recordPersonalDebtPayment", 60, 60);
  const user = await getCurrentUser();

  const debt = await UnifiedDB.recordPersonalDebtPayment(user.id, debtId, data);
  await bustPageCache(user.id);
  return debt;
}

export async function markPersonalDebtSettled(debtId: string) {
  const user = await getCurrentUser();
  const debt = await UnifiedDB.updatePersonalDebt(user.id, debtId, {
    remainingAmount: 0,
    status: "SETTLED",
  });
  await bustPageCache(user.id);
  return debt;
}

export async function deletePersonalDebt(debtId: string) {
  const user = await getCurrentUser();
  await UnifiedDB.deletePersonalDebt(user.id, debtId);
  await bustPageCache(user.id);
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

  await bustPageCache(user.id);
  return acc;
}

// Categories actions
export async function getCategories() {
  const user = await getCurrentUser();
  return await UnifiedDB.getCategories(user.id);
}

export async function createCategory(data: { name: string; color: string }) {
  const user = await getCurrentUser();
  const cat = await UnifiedDB.createCategory(user.id, data.name, data.color);
  await bustPageCache(user.id);
  return cat;
}

// Income Sources actions
export async function getIncomeSources() {
  const user = await getCurrentUser();
  return await UnifiedDB.getIncomeSources(user.id);
}

export async function createIncomeSource(data: { name: string }) {
  const user = await getCurrentUser();
  const src = await UnifiedDB.createIncomeSource(user.id, data.name);
  await bustPageCache(user.id);
  return src;
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

  await bustPageCache(user.id);
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
  const budget = await UnifiedDB.createBudget(user.id, {
    categoryId: data.categoryId,
    groupId: data.groupId || null,
    amount: data.amount,
    period: data.period,
    startDate: data.startDate,
    endDate: data.endDate,
  });
  await bustPageCache(user.id);
  return budget;
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
  const goal = await UnifiedDB.createGoal(user.id, data);
  await bustPageCache(user.id);
  return goal;
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

  await bustPageCache(user.id);
  return goal;
}

// Group operations
export async function getGroups() {
  const user = await getCurrentUser();
  return await UnifiedDB.getGroups(user.id);
}

export async function joinGroup(inviteCode: string) {
  const user = await getCurrentUser();
  const group = await UnifiedDB.joinGroupByInviteCode(user.id, inviteCode);
  await bustPageCache(user.id);
  return group;
}

export async function createGroup(data: { name: string; type: string; memberEmails: string[] }) {
  const reqHeaders = await headers();
  await enforceActionRateLimit(reqHeaders, "createGroup", 20, 60);
  const user = await getCurrentUser();
  
  // Resolve emails to user IDs, or create stub users
  const resolvedMemberIds: string[] = [user.id];
  const emails = data.memberEmails.filter((e) => e.trim()).map((e) => e.toLowerCase());
  const existingUsers = await UnifiedDB.getUsersByEmails(emails);

  for (const email of emails) {
    const existing = existingUsers.find((u) => u.email.toLowerCase() === email);
    if (existing) {
      resolvedMemberIds.push(existing.id);
    } else {
      const stub = await UnifiedDB.createUser({
        email,
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

  await bustPageCache(user.id);
  return newGroup;
}

export async function updateGroupSettings(groupId: string, settings: Partial<Omit<UnifiedGroup, "id" | "name" | "type" | "members">>) {
  const user = await getCurrentUser();
  const result = await UnifiedDB.updateGroupSettings(groupId, settings);
  await bustPageCache(user.id);
  return result;
}

export async function getGroupDetails(groupId: string) {
  const user = await getCurrentUser();
  const groups = await UnifiedDB.getGroups(user.id);
  const group = groups.find((g) => g.id === groupId);

  if (!group) throw new Error("Group not found or access denied.");

  const expenses = await UnifiedDB.getGroupExpenses(groupId);
  const settlements = await UnifiedDB.getSettlements(groupId);
  const memberIds = group.members.map((m) => m.userId);
  const payerIds = expenses.map((e) => e.paidByUserId);
  const userIds = [...new Set([...memberIds, ...payerIds])];
  const users = await UnifiedDB.getUsersByIds(userIds);

  // Map user ID to member metadata
  const groupMembersWithDetails = group.members.map((m) => {
    const details = users.find((u) => u.id === m.userId);
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

  await bustPageCache(user.id);
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

  const groups = await UnifiedDB.getGroups(user.id);
  const group = groups.find((g) => g.id === groupId);
  if (!group) {
    throw new Error("Group not found or access denied.");
  }

  if (data.payerId !== user.id && data.receiverId !== user.id) {
    throw new Error("Only the payer or receiver can record this payment.");
  }

  const memberIds = new Set(group.members.map((m) => m.userId));
  if (!memberIds.has(data.payerId) || !memberIds.has(data.receiverId)) {
    throw new Error("Payer and receiver must be members of this group.");
  }

  if (data.amount <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

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
  let payerName = "Someone";
  if (data.payerId === user.id) {
    payerName = user.name || user.email || "Someone";
  } else {
    const payerUser = (await UnifiedDB.getUsersByIds([data.payerId]))[0];
    payerName = payerUser?.name || payerUser?.email || "Someone";
  }
  await UnifiedDB.createNotification(
    data.receiverId,
    "Payment received",
    `${payerName} paid you ₹${data.amount} in ${group.name}.`,
    "SETTLEMENT_REMINDER"
  );

  await bustPageCache(user.id);
  return settlement;
}

// Notifications actions
export async function getNotifications() {
  const user = await getCurrentUser();
  return await UnifiedDB.getNotifications(user.id, { limit: 20 });
}

export async function markNotificationAsRead(id: string) {
  return await UnifiedDB.markNotificationRead(id);
}

// Reports & Analytics actions
export async function getReports(timeframe: "weekly" | "monthly" | "quarterly" | "yearly") {
  const user = await getCurrentUser();
  return getReportsForUser(user.id, timeframe);
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
  await bustPageCache(user.id);
}

export async function updateTransaction(
  txId: string,
  data: Partial<Omit<UnifiedTransaction, "id" | "userId">>
) {
  const user = await getCurrentUser();
  const tx = await UnifiedDB.updateTransaction(user.id, txId, data);
  await bustPageCache(user.id);
  return tx;
}

export async function deleteGroup(groupId: string) {
  const user = await getCurrentUser();
  await UnifiedDB.deleteGroup(user.id, groupId);
  await bustPageCache(user.id);
}

export async function leaveGroup(groupId: string) {
  const reqHeaders = await headers();
  await enforceActionRateLimit(reqHeaders, "leaveGroup", 30, 60);
  const user = await getCurrentUser();
  await UnifiedDB.leaveGroup(user.id, groupId);
  await bustPageCache(user.id);
}

export async function deleteBudget(budgetId: string) {
  const user = await getCurrentUser();
  await UnifiedDB.deleteBudget(user.id, budgetId);
  await bustPageCache(user.id);
}

export async function deleteGoal(goalId: string) {
  const user = await getCurrentUser();
  await UnifiedDB.deleteGoal(user.id, goalId);
  await bustPageCache(user.id);
}
