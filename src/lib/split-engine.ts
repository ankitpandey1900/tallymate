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
 * Calculates exact pairwise debts between members instead of simplifying/optimizing.
 * (Used to replace minimizeDebts so the user sees exactly who owes whom based on raw expenses)
 */
export function calculateExactDebts(
  members: GroupMemberInput[],
  expenses: GroupExpenseInput[],
  settlements: { payerId: string; receiverId: string; amount: number }[]
): OptimizedSettlement[] {
  const memberMap = new Map(members.map((m) => [m.userId, m]));
  
  // owed[debtor][creditor] = amount
  const owed: Record<string, Record<string, number>> = {};
  
  members.forEach(m => {
    owed[m.userId] = {};
    members.forEach(m2 => {
      owed[m.userId][m2.userId] = 0;
    });
  });

  // 1. Add debts from expenses
  expenses.forEach(expense => {
    const creditorId = expense.paidByUserId;
    if (!owed[creditorId]) return;
    
    expense.splits.forEach(split => {
      const debtorId = split.userId;
      if (debtorId !== creditorId && owed[debtorId]) {
        owed[debtorId][creditorId] += Number(split.amount);
      }
    });
  });

  // 2. Subtract debts from settlements
  // If A pays B, A's debt to B decreases.
  settlements.forEach(s => {
    const debtorId = s.payerId;
    const creditorId = s.receiverId;
    if (owed[debtorId] && owed[debtorId][creditorId] !== undefined) {
      owed[debtorId][creditorId] -= Number(s.amount);
    }
  });

  // 3. Compute net pairwise debts
  const exactSettlements: OptimizedSettlement[] = [];
  
  // To avoid duplicate pairs (A,B) and (B,A), we can iterate with a fixed order or a Set
  const processedPairs = new Set<string>();

  members.forEach(m1 => {
    members.forEach(m2 => {
      if (m1.userId === m2.userId) return;
      
      const pairKey = [m1.userId, m2.userId].sort().join("-");
      if (processedPairs.has(pairKey)) return;
      processedPairs.add(pairKey);

      const m1OwesM2 = owed[m1.userId][m2.userId];
      const m2OwesM1 = owed[m2.userId][m1.userId];
      
      const net = m1OwesM2 - m2OwesM1;
      const roundedNet = Math.round(Math.abs(net) * 100) / 100;

      if (roundedNet > 0) {
        if (net > 0) {
          // m1 owes m2
          exactSettlements.push({
            fromUserId: m1.userId,
            fromUserName: m1.name || m1.email || "Unknown",
            toUserId: m2.userId,
            toUserName: m2.name || m2.email || "Unknown",
            amount: roundedNet,
          });
        } else {
          // m2 owes m1
          exactSettlements.push({
            fromUserId: m2.userId,
            fromUserName: m2.name || m2.email || "Unknown",
            toUserId: m1.userId,
            toUserName: m1.name || m1.email || "Unknown",
            amount: roundedNet,
          });
        }
      }
    });
  });

  // Sort largest debts first for UI
  return exactSettlements.sort((a, b) => b.amount - a.amount);
}
