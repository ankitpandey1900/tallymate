import React from "react";
import TransactionsView from "@/components/transactions/TransactionsView";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transactions Ledger - Tallymate",
  description: "Record, search, and filter personal income and expenses, and upload receipt files.",
};

export default function TransactionsPage() {
  return <TransactionsView />;
}
