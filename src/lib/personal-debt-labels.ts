const CATEGORY_LABELS: Record<string, string> = {
  LOAN: "Bank / loan",
  CREDIT_CARD: "Credit card",
  EMI: "EMI / installment",
  PERSONAL: "Personal",
  FRIEND: "Friend",
  FAMILY: "Family",
  OTHER: "Other",
};

export function formatPersonalDebtCategory(category: string) {
  return CATEGORY_LABELS[category] ?? category;
}

export const PERSONAL_DEBT_CATEGORIES = [
  { value: "LOAN", label: "Bank / loan" },
  { value: "CREDIT_CARD", label: "Credit card" },
  { value: "EMI", label: "EMI / installment" },
  { value: "FRIEND", label: "Friend" },
  { value: "FAMILY", label: "Family" },
  { value: "OTHER", label: "Other" },
] as const;
