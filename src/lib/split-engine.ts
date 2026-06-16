export interface MemberBalance {
  userId: string;
  userName: string;
  userEmail: string;
  netBalance: number; // Positive means they are owed money, negative means they owe
}

export interface OptimizedSettlement {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
}

export interface ExpenseSplitInput {
  userId: string;
  amount: number;
}

export interface GroupExpenseInput {
  amount: number;
  paidByUserId: string;
  splits: ExpenseSplitInput[];
}

export interface GroupMemberInput {
  userId: string;
  name: string;
  email: string;
}

/**
 * Calculates net balances for all group members based on expenses.
 */
export function calculateBalances(
  members: GroupMemberInput[],
  expenses: GroupExpenseInput[],
  settlements: { payerId: string; receiverId: string; amount: number }[]
): MemberBalance[] {
  const balances: Record<string, number> = {};

  // Initialize all members with 0 balance
  members.forEach((m) => {
    balances[m.userId] = 0;
  });

  // Calculate based on expenses
  expenses.forEach((expense) => {
    const paidById = expense.paidByUserId;
    const totalAmount = Number(expense.amount);

    // Credit the payer
    if (balances[paidById] !== undefined) {
      balances[paidById] += totalAmount;
    }

    // Debit the splits
    expense.splits.forEach((split) => {
      const debtorId = split.userId;
      const splitAmount = Number(split.amount);
      if (balances[debtorId] !== undefined) {
        balances[debtorId] -= splitAmount;
      }
    });
  });

  // Apply already completed settlements
  // Payer paid the settlement -> payer's balance increases (paid off debt or credited more)
  // Receiver received settlement -> receiver's balance decreases (received money they were owed)
  settlements.forEach((s) => {
    const payerId = s.payerId;
    const receiverId = s.receiverId;
    const amount = Number(s.amount);

    if (balances[payerId] !== undefined) {
      balances[payerId] += amount;
    }
    if (balances[receiverId] !== undefined) {
      balances[receiverId] -= amount;
    }
  });

  // Return formatted array
  return members.map((m) => ({
    userId: m.userId,
    userName: m.name || m.email,
    userEmail: m.email,
    netBalance: Math.round(balances[m.userId] * 100) / 100, // round to 2 decimals
  }));
}

/**
 * Minimizes the number of settlements required to resolve all debts.
 * Greedy algorithm: match the largest debtor with the largest creditor.
 */
export function minimizeDebts(
  members: GroupMemberInput[],
  balances: MemberBalance[]
): OptimizedSettlement[] {
  const memberMap = new Map(members.map((m) => [m.userId, m]));

  // Separate into debtors and creditors
  const debtors = balances
    .filter((b) => b.netBalance < -0.01)
    .map((b) => ({ userId: b.userId, balance: Math.abs(b.netBalance) }));

  const creditors = balances
    .filter((b) => b.netBalance > 0.01)
    .map((b) => ({ userId: b.userId, balance: b.netBalance }));

  const optimizedSettlements: OptimizedSettlement[] = [];

  // Sort: Debtors descending by amount owed, Creditors descending by amount owed to them
  debtors.sort((a, b) => b.balance - a.balance);
  creditors.sort((a, b) => b.balance - a.balance);

  let dIndex = 0;
  let cIndex = 0;

  while (dIndex < debtors.length && cIndex < creditors.length) {
    const debtor = debtors[dIndex];
    const creditor = creditors[cIndex];

    const amount = Math.min(debtor.balance, creditor.balance);
    const roundedAmount = Math.round(amount * 100) / 100;

    if (roundedAmount > 0.01) {
      const debtorMember = memberMap.get(debtor.userId);
      const creditorMember = memberMap.get(creditor.userId);

      optimizedSettlements.push({
        fromUserId: debtor.userId,
        fromUserName: debtorMember?.name || debtorMember?.email || "Unknown",
        toUserId: creditor.userId,
        toUserName: creditorMember?.name || creditorMember?.email || "Unknown",
        amount: roundedAmount,
      });

      debtor.balance -= roundedAmount;
      creditor.balance -= roundedAmount;
    }

    if (debtor.balance < 0.01) {
      dIndex++;
    }
    if (creditor.balance < 0.01) {
      cIndex++;
    }
  }

  return optimizedSettlements;
}
