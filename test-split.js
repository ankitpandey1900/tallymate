const members = [
  { userId: "A", name: "Alice", email: "a@a.com" },
  { userId: "B", name: "Bob", email: "b@b.com" },
];

const expenses = [
  {
    amount: 1000,
    paidByUserId: "A",
    splits: [
      { userId: "A", amount: 500 },
      { userId: "B", amount: 500 }
    ]
  }
];

const settlements = [
  {
    payerId: "B",
    receiverId: "A",
    amount: 500
  }
];

function calculateBalances(members, expenses, settlements) {
  const balances = {};
  members.forEach((m) => { balances[m.userId] = 0; });
  
  expenses.forEach((expense) => {
    const paidById = expense.paidByUserId;
    const totalAmount = Number(expense.amount);
    if (balances[paidById] !== undefined) {
      balances[paidById] += totalAmount;
    }
    expense.splits.forEach((split) => {
      const debtorId = split.userId;
      const splitAmount = Number(split.amount);
      if (balances[debtorId] !== undefined) {
        balances[debtorId] -= splitAmount;
      }
    });
  });

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

  return members.map((m) => ({
    userId: m.userId,
    netBalance: Math.round(balances[m.userId] * 100) / 100,
  }));
}

console.log(calculateBalances(members, expenses, settlements));
