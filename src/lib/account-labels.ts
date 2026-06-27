const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  CASH: "Cash",
  BANK_ACCOUNT: "Bank",
  CREDIT_CARD: "Credit Card",
  WALLET: "Wallet",
  FD: "FD",
  MUTUAL_FUND: "Mutual Fund",
  STOCKS: "Stocks",
  CRYPTO: "Crypto",
};

/** Human-readable payment method from financial account type */
export function formatPaymentMode(accountType?: string | null) {
  if (!accountType) return "—";
  return ACCOUNT_TYPE_LABELS[accountType] ?? accountType.replace(/_/g, " ").toLowerCase();
}

export const ACCOUNT_TYPE_OPTIONS = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_ACCOUNT", label: "Bank" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "WALLET", label: "Wallet" },
  { value: "FD", label: "FD" },
  { value: "MUTUAL_FUND", label: "Mutual Fund" },
  { value: "STOCKS", label: "Stocks" },
  { value: "CRYPTO", label: "Crypto" },
] as const;
