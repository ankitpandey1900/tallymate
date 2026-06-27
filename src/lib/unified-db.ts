import { prisma } from "./db";

// Types matching database schema
export interface UnifiedUser {
  id: string;
  email: string;
  name: string | null;
  image?: string | null;
  passwordHash?: string | null;
}

export interface UnifiedAccount {
  id: string;
  userId: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
}

export interface UnifiedCategory {
  id: string;
  userId: string;
  name: string;
  color: string;
}

export interface UnifiedIncomeSource {
  id: string;
  userId: string;
  name: string;
}

export interface UnifiedTransaction {
  id: string;
  userId: string;
  accountId: string;
  type: string;
  scope: string;
  amount: number;
  date: string;
  description: string;
  notes?: string;
  tags: string[];
  receiptUrl?: string;
  categoryId?: string;
  incomeSourceId?: string;
  groupId?: string;
  transferToAccountId?: string;
}

export interface UnifiedBudget {
  id: string;
  userId: string;
  categoryId: string | null;
  groupId: string | null;
  amount: number;
  period: string;
  startDate: string;
  endDate: string;
}

export interface UnifiedGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
}

export interface UnifiedGroup {
  id: string;
  name: string;
  inviteCode?: string;
  type: string;
  currency: string;
  enableSharedFinance: boolean;
  enableSharedBudgets: boolean;
  enableSharedIncome: boolean;
  enableRecurringExpenses: boolean;
  enableSettlementTracking: boolean;
  members: UnifiedGroupMember[];
}

export interface UnifiedGroupMember {
  userId: string;
  role: string;
}

export interface UnifiedGroupExpense {
  id: string;
  groupId: string;
  amount: number;
  description: string;
  date: string;
  paidByUserId: string;
  splits: { userId: string; amount: number; type: string }[];
}

export interface UnifiedSettlement {
  id: string;
  groupId: string;
  payerId: string;
  receiverId: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface UnifiedPersonalDebt {
  id: string;
  userId: string;
  title: string;
  counterpartyName: string;
  direction: "I_OWE" | "OWED_TO_ME";
  category: string;
  totalAmount: number;
  remainingAmount: number;
  interestRate?: number;
  dueDate?: string;
  notes?: string;
  status: "ACTIVE" | "SETTLED";
  createdAt: string;
  updatedAt: string;
}

export interface UnifiedPersonalDebtPayment {
  id: string;
  personalDebtId: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface UnifiedNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "GRP-";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function mapTransaction(t: {
  id: string;
  userId: string;
  accountId: string;
  type: string;
  scope: string;
  amount: { toNumber?: () => number } | number | string;
  date: Date;
  description: string | null;
  notes: string | null;
  tags: string[];
  receiptUrl: string | null;
  categoryId: string | null;
  incomeSourceId: string | null;
  groupId: string | null;
  transferToAccountId: string | null;
}): UnifiedTransaction {
  return {
    id: t.id,
    userId: t.userId,
    accountId: t.accountId,
    type: t.type,
    scope: t.scope,
    amount: Number(t.amount),
    date: t.date.toISOString(),
    description: t.description || "",
    notes: t.notes || "",
    tags: t.tags,
    receiptUrl: t.receiptUrl || undefined,
    categoryId: t.categoryId || undefined,
    incomeSourceId: t.incomeSourceId || undefined,
    groupId: t.groupId || undefined,
    transferToAccountId: t.transferToAccountId || undefined,
  };
}

function mapGroup(grp: {
  id: string;
  name: string;
  inviteCode: string | null;
  type: string;
  currency: string;
  enableSharedFinance: boolean;
  enableSharedBudgets: boolean;
  enableSharedIncome: boolean;
  enableRecurringExpenses: boolean;
  enableSettlementTracking: boolean;
  members: { userId: string; role: string }[];
}): UnifiedGroup {
  return {
    id: grp.id,
    name: grp.name,
    inviteCode: grp.inviteCode || undefined,
    type: grp.type,
    currency: grp.currency,
    enableSharedFinance: grp.enableSharedFinance,
    enableSharedBudgets: grp.enableSharedBudgets,
    enableSharedIncome: grp.enableSharedIncome,
    enableRecurringExpenses: grp.enableRecurringExpenses,
    enableSettlementTracking: grp.enableSettlementTracking,
    members: grp.members.map((m) => ({ userId: m.userId, role: m.role })),
  };
}

export class UnifiedDB {
  static async getUserByEmail(email: string): Promise<UnifiedUser | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    return user ? { id: user.id, email: user.email, name: user.name, image: user.image } : null;
  }

  static async createUser(data: { id?: string; email: string; name: string; image?: string }): Promise<UnifiedUser> {
    return await prisma.user.create({
      data: {
        id: data.id,
        email: data.email,
        name: data.name,
        image: data.image,
      },
    });
  }

  static async getAccounts(userId: string): Promise<UnifiedAccount[]> {
    const accounts = await prisma.financialAccount.findMany({ where: { userId } });
    return accounts.map((a) => ({
      id: a.id,
      userId: a.userId,
      name: a.name,
      type: a.type,
      balance: Number(a.balance),
      currency: a.currency,
    }));
  }

  static async createAccount(userId: string, data: { name: string; type: string; balance: number }): Promise<UnifiedAccount> {
    const acc = await prisma.financialAccount.create({
      data: {
        userId,
        name: data.name,
        type: data.type as "CASH" | "BANK_ACCOUNT" | "CREDIT_CARD" | "DEBIT_CARD" | "UPI_WALLET" | "PAYTM" | "PHONEPE" | "GOOGLE_PAY" | "CUSTOM",
        balance: data.balance,
      },
    });
    return {
      id: acc.id,
      userId: acc.userId,
      name: acc.name,
      type: acc.type,
      balance: Number(acc.balance),
      currency: acc.currency,
    };
  }

  static async updateAccount(userId: string, accountId: string, data: { name: string; type: string; balance: number }): Promise<UnifiedAccount> {
    const acc = await prisma.financialAccount.update({
      where: { id: accountId, userId },
      data: {
        name: data.name,
        type: data.type as "CASH" | "BANK_ACCOUNT" | "CREDIT_CARD" | "DEBIT_CARD" | "UPI_WALLET" | "PAYTM" | "PHONEPE" | "GOOGLE_PAY" | "CUSTOM",
        balance: data.balance,
      },
    });
    return {
      id: acc.id,
      userId: acc.userId,
      name: acc.name,
      type: acc.type,
      balance: Number(acc.balance),
      currency: acc.currency,
    };
  }

  static async deleteAccount(userId: string, accountId: string): Promise<void> {
    await prisma.financialAccount.delete({
      where: { id: accountId, userId },
    });
  }

  static async getCategories(userId: string): Promise<UnifiedCategory[]> {
    const categories = await prisma.expenseCategory.findMany({ where: { userId } });
    return categories.map((c) => ({
      id: c.id,
      userId: c.userId,
      name: c.name,
      color: c.color || "#9CA3AF",
    }));
  }

  static async createCategory(userId: string, name: string, color: string): Promise<UnifiedCategory> {
    const cat = await prisma.expenseCategory.create({
      data: { userId, name, color },
    });
    return { id: cat.id, userId: cat.userId, name: cat.name, color: cat.color || "#9CA3AF" };
  }

  static async updateCategory(
    userId: string,
    categoryId: string,
    data: { name?: string; color?: string }
  ): Promise<UnifiedCategory> {
    const existing = await prisma.expenseCategory.findFirst({ where: { id: categoryId, userId } });
    if (!existing) throw new Error("Category not found.");

    const cat = await prisma.expenseCategory.update({
      where: { id: categoryId },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.color !== undefined && { color: data.color }),
      },
    });
    return { id: cat.id, userId: cat.userId, name: cat.name, color: cat.color || "#9CA3AF" };
  }

  static async deleteCategory(userId: string, categoryId: string): Promise<void> {
    const existing = await prisma.expenseCategory.findFirst({ where: { id: categoryId, userId } });
    if (!existing) throw new Error("Category not found.");

    const budgetCount = await prisma.budget.count({ where: { categoryId, userId } });
    if (budgetCount > 0) {
      throw new Error("This category is used in a budget. Delete or change that budget first.");
    }

    await prisma.transaction.updateMany({
      where: { categoryId, userId },
      data: { categoryId: null },
    });
    await prisma.expenseCategory.delete({ where: { id: categoryId } });
  }

  static async getIncomeSources(userId: string): Promise<UnifiedIncomeSource[]> {
    const sources = await prisma.incomeSource.findMany({ where: { userId } });
    return sources.map((s) => ({
      id: s.id,
      userId: s.userId,
      name: s.name,
    }));
  }

  static async createIncomeSource(userId: string, name: string): Promise<UnifiedIncomeSource> {
    const src = await prisma.incomeSource.create({
      data: { userId, name },
    });
    return { id: src.id, userId: src.userId, name: src.name };
  }

  static async updateIncomeSource(
    userId: string,
    sourceId: string,
    data: { name: string }
  ): Promise<UnifiedIncomeSource> {
    const existing = await prisma.incomeSource.findFirst({ where: { id: sourceId, userId } });
    if (!existing) throw new Error("Income source not found.");

    const src = await prisma.incomeSource.update({
      where: { id: sourceId },
      data: { name: data.name.trim() },
    });
    return { id: src.id, userId: src.userId, name: src.name };
  }

  static async deleteIncomeSource(userId: string, sourceId: string): Promise<void> {
    const existing = await prisma.incomeSource.findFirst({ where: { id: sourceId, userId } });
    if (!existing) throw new Error("Income source not found.");

    await prisma.transaction.updateMany({
      where: { incomeSourceId: sourceId, userId },
      data: { incomeSourceId: null },
    });
    await prisma.incomeSource.delete({ where: { id: sourceId } });
  }

  static async getTransactions(
    userId: string,
    filters?: { groupId?: string; type?: string; limit?: number; startDate?: string; endDate?: string }
  ): Promise<UnifiedTransaction[]> {
    // Prisma expects enums for `type`; for this unified layer we accept string
    // values coming from the UI and pass them through as-is.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { userId };

    if (filters?.groupId) where.groupId = filters.groupId;
    if (filters?.type) where.type = filters.type;
    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) where.date.lte = new Date(filters.endDate);
    }

    const txs = await prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      take: filters?.limit,
    });
    return txs.map(mapTransaction);
  }

  static async createTransaction(userId: string, data: Omit<UnifiedTransaction, "id">): Promise<UnifiedTransaction> {
    const tx = await prisma.transaction.create({
      data: {
        userId,
        accountId: data.accountId,
        type: data.type as "INCOME" | "EXPENSE" | "TRANSFER" | "REFUND" | "LOAN_GIVEN" | "LOAN_TAKEN" | "INVESTMENT",
        scope: data.scope as "PERSONAL" | "GROUP",
        amount: data.amount,
        date: new Date(data.date),
        description: data.description,
        notes: data.notes,
        tags: data.tags,
        receiptUrl: data.receiptUrl,
        categoryId: data.categoryId,
        incomeSourceId: data.incomeSourceId,
        groupId: data.groupId,
        transferToAccountId: data.transferToAccountId,
      },
    });

    const modifier = data.type === "INCOME" || data.type === "REFUND" || data.type === "LOAN_TAKEN" ? 1 : -1;
    await prisma.financialAccount.update({
      where: { id: data.accountId },
      data: { balance: { increment: data.amount * modifier } },
    });

    if (data.type === "TRANSFER" && data.transferToAccountId) {
      await prisma.financialAccount.update({
        where: { id: data.transferToAccountId },
        data: { balance: { increment: data.amount } },
      });
    }

    return mapTransaction(tx);
  }

  static async getBudgets(userId: string): Promise<UnifiedBudget[]> {
    const budgets = await prisma.budget.findMany({ where: { userId } });
    return budgets.map((b) => ({
      id: b.id,
      userId: b.userId,
      categoryId: b.categoryId,
      groupId: b.groupId,
      amount: Number(b.amount),
      period: b.period,
      startDate: b.startDate.toISOString(),
      endDate: b.endDate.toISOString(),
    }));
  }

  static async createBudget(userId: string, data: Omit<UnifiedBudget, "id" | "userId">): Promise<UnifiedBudget> {
    const b = await prisma.budget.create({
      data: {
        userId,
        categoryId: data.categoryId,
        groupId: data.groupId,
        amount: data.amount,
        period: data.period,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
    });
    return {
      id: b.id,
      userId: b.userId,
      categoryId: b.categoryId,
      groupId: b.groupId,
      amount: Number(b.amount),
      period: b.period,
      startDate: b.startDate.toISOString(),
      endDate: b.endDate.toISOString(),
    };
  }

  static async deleteBudget(userId: string, budgetId: string): Promise<void> {
    await prisma.budget.delete({ where: { id: budgetId, userId } });
  }

  static async getGoals(userId: string): Promise<UnifiedGoal[]> {
    const goals = await prisma.financialGoal.findMany({ where: { userId } });
    return goals.map((g) => ({
      id: g.id,
      userId: g.userId,
      name: g.name,
      targetAmount: Number(g.targetAmount),
      currentAmount: Number(g.currentAmount),
      deadline: g.deadline?.toISOString() || undefined,
    }));
  }

  static async updateGoal(userId: string, id: string, data: { currentAmount: number }): Promise<UnifiedGoal> {
    const g = await prisma.financialGoal.update({
      where: { id, userId },
      data: { currentAmount: data.currentAmount },
    });
    return {
      id: g.id,
      userId: g.userId,
      name: g.name,
      targetAmount: Number(g.targetAmount),
      currentAmount: Number(g.currentAmount),
      deadline: g.deadline?.toISOString() || undefined,
    };
  }

  static async createGoal(
    userId: string,
    data: { name: string; targetAmount: number; currentAmount: number; deadline?: string }
  ): Promise<UnifiedGoal> {
    const g = await prisma.financialGoal.create({
      data: {
        userId,
        name: data.name,
        targetAmount: data.targetAmount,
        currentAmount: data.currentAmount,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
      },
    });
    return {
      id: g.id,
      userId: g.userId,
      name: g.name,
      targetAmount: Number(g.targetAmount),
      currentAmount: Number(g.currentAmount),
      deadline: g.deadline?.toISOString() || undefined,
    };
  }

  static async deleteGoal(userId: string, goalId: string): Promise<void> {
    await prisma.financialGoal.delete({ where: { id: goalId, userId } });
  }

  static async getGroups(userId: string): Promise<UnifiedGroup[]> {
    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: { members: true },
        },
      },
    });
    return memberships.map((m) => mapGroup(m.group));
  }

  static async createGroup(userId: string, data: { name: string; type: string; members: string[] }): Promise<UnifiedGroup> {
    const inviteCode = generateInviteCode();
    const grp = await prisma.group.create({
      data: {
        name: data.name,
        type: data.type as "TRIP" | "FAMILY" | "FLATMATES" | "COUPLE" | "FRIENDS" | "CUSTOM",
        inviteCode,
        members: {
          createMany: {
            data: [
              { userId, role: "OWNER" },
              ...data.members.filter((id) => id !== userId).map((mId) => ({ userId: mId, role: "MEMBER" as const })),
            ],
          },
        },
      },
      include: { members: true },
    });
    return mapGroup(grp);
  }

  static async joinGroupByInviteCode(userId: string, inviteCode: string): Promise<UnifiedGroup> {
    const grp = await prisma.group.findUnique({
      where: { inviteCode },
      include: { members: true },
    });

    if (!grp) throw new Error("Invalid or expired invite code.");

    const isMember = grp.members.some((m) => m.userId === userId);
    if (!isMember) {
      await prisma.groupMember.create({
        data: { groupId: grp.id, userId, role: "MEMBER" },
      });
      const refreshed = await prisma.group.findUnique({
        where: { id: grp.id },
        include: { members: true },
      });
      if (!refreshed) throw new Error("Error loading updated group.");
      return mapGroup(refreshed);
    }

    return mapGroup(grp);
  }

  static async updateGroupSettings(
    groupId: string,
    data: Partial<Omit<UnifiedGroup, "id" | "name" | "type" | "members">>
  ): Promise<UnifiedGroup> {
    const grp = await prisma.group.update({
      where: { id: groupId },
      data,
      include: { members: true },
    });
    return mapGroup(grp);
  }

  static async getGroupExpenses(groupId: string): Promise<UnifiedGroupExpense[]> {
    const expenses = await prisma.groupExpense.findMany({
      where: { groupId },
      include: { splits: true },
      orderBy: { date: "desc" },
    });
    return expenses.map((e) => ({
      id: e.id,
      groupId: e.groupId,
      amount: Number(e.amount),
      description: e.description,
      date: e.date.toISOString(),
      paidByUserId: e.paidByUserId,
      splits: e.splits.map((s) => ({
        userId: s.userId,
        amount: Number(s.amount),
        type: s.type,
      })),
    }));
  }

  static async createGroupExpense(
    groupId: string,
    data: Omit<UnifiedGroupExpense, "id" | "groupId">
  ): Promise<UnifiedGroupExpense> {
    const exp = await prisma.groupExpense.create({
      data: {
        groupId,
        amount: data.amount,
        description: data.description,
        date: new Date(data.date),
        paidByUserId: data.paidByUserId,
        splits: {
          createMany: {
            data: data.splits.map((s) => ({
              userId: s.userId,
              amount: s.amount,
              type: s.type as "EQUAL" | "PERCENTAGE" | "CUSTOM" | "UNEQUAL",
            })),
          },
        },
      },
      include: { splits: true },
    });

    return {
      id: exp.id,
      groupId: exp.groupId,
      amount: Number(exp.amount),
      description: exp.description,
      date: exp.date.toISOString(),
      paidByUserId: exp.paidByUserId,
      splits: exp.splits.map((s) => ({
        userId: s.userId,
        amount: Number(s.amount),
        type: s.type,
      })),
    };
  }

  static async updateGroupExpense(
    groupId: string,
    expenseId: string,
    data: {
      amount?: number;
      description?: string;
      paidByUserId?: string;
      splits?: { userId: string; amount: number; type: string }[];
    }
  ): Promise<UnifiedGroupExpense> {
    const existing = await prisma.groupExpense.findFirst({ where: { id: expenseId, groupId } });
    if (!existing) throw new Error("Group expense not found.");

    if (data.splits) {
      await prisma.expenseSplit.deleteMany({ where: { groupExpenseId: expenseId } });
    }

    const exp = await prisma.groupExpense.update({
      where: { id: expenseId },
      data: {
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.paidByUserId !== undefined && { paidByUserId: data.paidByUserId }),
        ...(data.splits && {
          splits: {
            createMany: {
              data: data.splits.map((s) => ({
                userId: s.userId,
                amount: s.amount,
                type: s.type as "EQUAL" | "PERCENTAGE" | "CUSTOM" | "UNEQUAL",
              })),
            },
          },
        }),
      },
      include: { splits: true },
    });

    return {
      id: exp.id,
      groupId: exp.groupId,
      amount: Number(exp.amount),
      description: exp.description,
      date: exp.date.toISOString(),
      paidByUserId: exp.paidByUserId,
      splits: exp.splits.map((s) => ({
        userId: s.userId,
        amount: Number(s.amount),
        type: s.type,
      })),
    };
  }

  static async deleteGroupExpense(groupId: string, expenseId: string): Promise<void> {
    await prisma.groupExpense.delete({ where: { id: expenseId, groupId } });
  }

  static async getSettlements(groupId: string): Promise<UnifiedSettlement[]> {
    const settlements = await prisma.settlement.findMany({
      where: { groupId },
      orderBy: { date: "desc" },
    });
    return settlements.map((s) => ({
      id: s.id,
      groupId: s.groupId,
      payerId: s.payerId,
      receiverId: s.receiverId,
      amount: Number(s.amount),
      date: s.date.toISOString(),
      notes: s.notes || undefined,
    }));
  }

  static async createSettlement(groupId: string, data: Omit<UnifiedSettlement, "id" | "groupId">): Promise<UnifiedSettlement> {
    const s = await prisma.settlement.create({
      data: {
        groupId,
        payerId: data.payerId,
        receiverId: data.receiverId,
        amount: data.amount,
        date: new Date(data.date),
        notes: data.notes,
      },
    });
    return {
      id: s.id,
      groupId: s.groupId,
      payerId: s.payerId,
      receiverId: s.receiverId,
      amount: Number(s.amount),
      date: s.date.toISOString(),
      notes: s.notes || undefined,
    };
  }

  static async deleteSettlement(groupId: string, settlementId: string): Promise<void> {
    await prisma.settlement.delete({ where: { id: settlementId, groupId } });
  }

  static async getNotifications(
    userId: string,
    options?: { limit?: number; unreadOnly?: boolean }
  ): Promise<UnifiedNotification[]> {
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(options?.unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: options?.limit,
    });
    return notifications.map((n) => ({
      id: n.id,
      userId: n.userId,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    }));
  }

  static async markNotificationRead(id: string): Promise<boolean> {
    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    return true;
  }

  static async clearAllNotifications(userId: string): Promise<void> {
    await prisma.notification.deleteMany({
      where: { userId },
    });
  }

  static async createNotification(userId: string, title: string, message: string, type: string): Promise<UnifiedNotification> {
    const n = await prisma.notification.create({
      data: { userId, title, message, type },
    });
    return {
      id: n.id,
      userId: n.userId,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    };
  }

  static async getInitData(userId: string) {
    const [accounts, categories, incomeSources] = await Promise.all([
      this.getAccounts(userId),
      this.getCategories(userId),
      this.getIncomeSources(userId),
    ]);
    return { accounts, categories, incomeSources };
  }

  static async getAllUsers(): Promise<UnifiedUser[]> {
    const users = await prisma.user.findMany();
    return users.map((u) => ({ id: u.id, email: u.email, name: u.name, image: u.image }));
  }

  static async getUsersByIds(ids: string[]): Promise<UnifiedUser[]> {
    if (ids.length === 0) return [];
    const users = await prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, email: true, name: true, image: true },
    });
    return users.map((u) => ({ id: u.id, email: u.email, name: u.name, image: u.image }));
  }

  static async getUsersByEmails(emails: string[]): Promise<UnifiedUser[]> {
    const normalized = [...new Set(emails.filter(Boolean).map((e) => e.toLowerCase()))];
    if (normalized.length === 0) return [];
    const users = await prisma.user.findMany({
      where: { email: { in: normalized } },
      select: { id: true, email: true, name: true, image: true },
    });
    return users.map((u) => ({ id: u.id, email: u.email, name: u.name, image: u.image }));
  }

  static async joinGroupByCode(userId: string, code: string): Promise<UnifiedGroup> {
    const group = await prisma.group.findUnique({
      where: { inviteCode: code },
      include: { members: true },
    });
    if (!group) {
      throw new Error("Group not found with the provided code.");
    }

    const isMember = group.members.some((m) => m.userId === userId);
    if (!isMember) {
      await prisma.groupMember.create({
        data: { groupId: group.id, userId, role: "MEMBER" },
      });
    }

    const updatedGroup = await prisma.group.findUnique({
      where: { id: group.id },
      include: { members: true },
    });

    if (!updatedGroup) throw new Error("Error loading updated group.");
    return mapGroup(updatedGroup);
  }

  static async deleteTransaction(userId: string, txId: string): Promise<void> {
    const tx = await prisma.transaction.findUnique({ where: { id: txId, userId } });
    if (!tx) throw new Error("Transaction not found.");

    const modifier = tx.type === "INCOME" || tx.type === "REFUND" || tx.type === "LOAN_TAKEN" ? -1 : 1;
    await prisma.financialAccount.update({
      where: { id: tx.accountId },
      data: { balance: { increment: Number(tx.amount) * modifier } },
    });
    if (tx.type === "TRANSFER" && tx.transferToAccountId) {
      await prisma.financialAccount.update({
        where: { id: tx.transferToAccountId },
        data: { balance: { increment: -Number(tx.amount) } },
      });
    }

    await prisma.transaction.delete({ where: { id: txId, userId } });
  }

  static async bulkCreateTransactions(userId: string, transactions: Omit<UnifiedTransaction, "id" | "userId">[]): Promise<UnifiedTransaction[]> {
    if (transactions.length === 0) return [];
    
    // Calculate net changes per account to optimize db updates
    const accountDeltas: Record<string, number> = {};
    
    const dbTransactions = transactions.map(t => {
      const amount = Number(t.amount);
      const modifier = t.type === "INCOME" || t.type === "REFUND" || t.type === "LOAN_TAKEN" ? 1 : -1;
      
      accountDeltas[t.accountId] = (accountDeltas[t.accountId] || 0) + (amount * modifier);
      
      if (t.type === "TRANSFER" && t.transferToAccountId) {
        accountDeltas[t.transferToAccountId] = (accountDeltas[t.transferToAccountId] || 0) + amount;
      }
      
      return {
        userId,
        accountId: t.accountId,
        type: t.type as any,
        scope: t.scope as any,
        amount: amount,
        date: new Date(t.date),
        description: t.description,
        notes: t.notes,
        tags: t.tags,
        receiptUrl: t.receiptUrl,
        categoryId: t.categoryId,
        incomeSourceId: t.incomeSourceId,
        groupId: t.groupId,
        transferToAccountId: t.transferToAccountId,
      };
    });

    // Execute in a transaction to ensure atomic updates
    await prisma.$transaction(async (tx) => {
      // 1. Insert all transactions
      await tx.transaction.createMany({
        data: dbTransactions,
      });

      // 2. Update all account balances
      for (const [accountId, delta] of Object.entries(accountDeltas)) {
        if (delta === 0) continue;
        await tx.financialAccount.update({
          where: { id: accountId },
          data: { balance: { increment: delta } },
        });
      }
    });

    // createMany doesn't return the inserted records in Prisma, so we'll fetch them back
    // (This is an approximation, we fetch the most recent ones for the user)
    return await this.getTransactions(userId, { limit: transactions.length });
  }

  static async updateTransaction(
    userId: string,
    txId: string,
    data: Partial<Omit<UnifiedTransaction, "id" | "userId">>
  ): Promise<UnifiedTransaction> {
    const tx = await prisma.transaction.update({
      where: { id: txId, userId },
      data: {
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.type !== undefined && { type: data.type as "INCOME" | "EXPENSE" | "TRANSFER" | "REFUND" | "LOAN_GIVEN" | "LOAN_TAKEN" | "INVESTMENT" }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.date !== undefined && { date: new Date(data.date) }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.incomeSourceId !== undefined && { incomeSourceId: data.incomeSourceId }),
        ...(data.tags !== undefined && { tags: data.tags }),
      },
    });
    return mapTransaction(tx);
  }

  static async leaveGroup(userId: string, groupId: string): Promise<void> {
    const membership = await prisma.groupMember.findFirst({
      where: { groupId, userId },
      include: { group: { include: { members: true } } },
    });
    if (!membership) throw new Error("You are not a member of this group.");

    const { group } = membership;
    const memberCount = group.members.length;

    if (membership.role === "OWNER") {
      if (memberCount > 1) {
        throw new Error(
          "You manage this group. Delete the group or ask another member to take over before leaving."
        );
      }
      await prisma.groupExpense.deleteMany({ where: { groupId } });
      await prisma.settlement.deleteMany({ where: { groupId } });
      await prisma.groupMember.deleteMany({ where: { groupId } });
      await prisma.group.delete({ where: { id: groupId } });
      return;
    }

    await prisma.groupMember.delete({ where: { id: membership.id } });
  }

  static async deleteGroup(userId: string, groupId: string): Promise<void> {
    const membership = await prisma.groupMember.findFirst({
      where: { groupId, userId, role: "OWNER" },
    });
    if (!membership) throw new Error("Only the group owner can delete the group.");

    await prisma.groupExpense.deleteMany({ where: { groupId } });
    await prisma.settlement.deleteMany({ where: { groupId } });
    await prisma.groupMember.deleteMany({ where: { groupId } });
    await prisma.group.delete({ where: { id: groupId } });
  }

  static async getPersonalDebts(userId: string): Promise<UnifiedPersonalDebt[]> {
    const debts = await prisma.personalDebt.findMany({
      where: { userId },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    });
    return debts.map(mapPersonalDebt);
  }

  static async createPersonalDebt(
    userId: string,
    data: {
      title: string;
      counterpartyName: string;
      direction: "I_OWE" | "OWED_TO_ME";
      category: string;
      totalAmount: number;
      remainingAmount?: number;
      interestRate?: number;
      dueDate?: string;
      notes?: string;
    }
  ): Promise<UnifiedPersonalDebt> {
    const debt = await prisma.personalDebt.create({
      data: {
        userId,
        title: data.title,
        counterpartyName: data.counterpartyName,
        direction: data.direction,
        category: data.category as "LOAN" | "CREDIT_CARD" | "EMI" | "PERSONAL" | "OTHER",
        totalAmount: data.totalAmount,
        remainingAmount: data.remainingAmount ?? data.totalAmount,
        interestRate: data.interestRate,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        notes: data.notes,
      },
    });
    return mapPersonalDebt(debt);
  }

  static async updatePersonalDebt(
    userId: string,
    debtId: string,
    data: Partial<{
      title: string;
      counterpartyName: string;
      category: string;
      totalAmount: number;
      remainingAmount: number;
      interestRate: number | null;
      dueDate: string | null;
      notes: string | null;
      status: "ACTIVE" | "SETTLED";
    }>
  ): Promise<UnifiedPersonalDebt> {
    const existing = await prisma.personalDebt.findFirst({ where: { id: debtId, userId } });
    if (!existing) throw new Error("Debt not found.");

    const debt = await prisma.personalDebt.update({
      where: { id: debtId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.counterpartyName !== undefined && { counterpartyName: data.counterpartyName }),
        ...(data.category !== undefined && {
          category: data.category as "LOAN" | "CREDIT_CARD" | "EMI" | "PERSONAL" | "OTHER",
        }),
        ...(data.totalAmount !== undefined && { totalAmount: data.totalAmount }),
        ...(data.remainingAmount !== undefined && { remainingAmount: data.remainingAmount }),
        ...(data.interestRate !== undefined && { interestRate: data.interestRate }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });
    return mapPersonalDebt(debt);
  }

  static async recordPersonalDebtPayment(
    userId: string,
    debtId: string,
    data: { amount: number; notes?: string; date?: string }
  ): Promise<UnifiedPersonalDebt> {
    const debt = await prisma.personalDebt.findFirst({ where: { id: debtId, userId } });
    if (!debt) throw new Error("Debt not found.");
    if (debt.status === "SETTLED") throw new Error("This debt is already settled.");

    const paymentAmount = data.amount;
    if (paymentAmount <= 0) throw new Error("Payment amount must be greater than zero.");

    const remaining = Number(debt.remainingAmount);
    if (paymentAmount > remaining + 0.01) {
      throw new Error(`Payment cannot exceed remaining balance of ₹${remaining}.`);
    }

    const newRemaining = Math.round((remaining - paymentAmount) * 100) / 100;

    await prisma.personalDebtPayment.create({
      data: {
        personalDebtId: debtId,
        amount: paymentAmount,
        date: data.date ? new Date(data.date) : new Date(),
        notes: data.notes,
      },
    });

    return mapPersonalDebt(
      await prisma.personalDebt.update({
        where: { id: debtId },
        data: {
          remainingAmount: newRemaining,
          status: newRemaining <= 0.01 ? "SETTLED" : "ACTIVE",
        },
      })
    );
  }

  static async deletePersonalDebt(userId: string, debtId: string): Promise<void> {
    const debt = await prisma.personalDebt.findFirst({ where: { id: debtId, userId } });
    if (!debt) throw new Error("Debt not found.");
    await prisma.personalDebt.delete({ where: { id: debtId } });
  }
}

function mapPersonalDebt(debt: {
  id: string;
  userId: string;
  title: string;
  counterpartyName: string;
  direction: string;
  category: string;
  totalAmount: unknown;
  remainingAmount: unknown;
  interestRate: unknown | null;
  dueDate: Date | null;
  notes: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): UnifiedPersonalDebt {
  return {
    id: debt.id,
    userId: debt.userId,
    title: debt.title,
    counterpartyName: debt.counterpartyName,
    direction: debt.direction as "I_OWE" | "OWED_TO_ME",
    category: debt.category,
    totalAmount: Number(debt.totalAmount),
    remainingAmount: Number(debt.remainingAmount),
    interestRate: debt.interestRate != null ? Number(debt.interestRate) : undefined,
    dueDate: debt.dueDate?.toISOString(),
    notes: debt.notes ?? undefined,
    status: debt.status as "ACTIVE" | "SETTLED",
    createdAt: debt.createdAt.toISOString(),
    updatedAt: debt.updatedAt.toISOString(),
  };
}
