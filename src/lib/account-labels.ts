const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  CASH: "Cash",
  BANK_ACCOUNT: "Bank account",
  CREDIT_CARD: "Credit card",
  DEBIT_CARD: "Debit card",
  UPI_WALLET: "UPI wallet",
  PAYTM: "Paytm",
  PHONEPE: "PhonePe",
  GOOGLE_PAY: "Google Pay",
  CUSTOM: "Other",
};

/** Human-readable payment method from financial account type */
export function formatPaymentMode(accountType?: string | null) {
  if (!accountType) return "—";
  return ACCOUNT_TYPE_LABELS[accountType] ?? accountType.replace(/_/g, " ").toLowerCase();
}

export const ACCOUNT_TYPE_OPTIONS = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_ACCOUNT", label: "Bank account" },
  { value: "CREDIT_CARD", label: "Credit card" },
  { value: "DEBIT_CARD", label: "Debit card" },
  { value: "UPI_WALLET", label: "UPI wallet" },
  { value: "PAYTM", label: "Paytm" },
  { value: "PHONEPE", label: "PhonePe" },
  { value: "GOOGLE_PAY", label: "Google Pay" },
  { value: "CUSTOM", label: "Other" },
] as const;
