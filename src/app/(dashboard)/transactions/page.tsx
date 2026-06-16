import React from "react";
import TransactionsView from "@/components/transactions/TransactionsView";
import { getTransactionsPageData } from "@/app/actions";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transactions Ledger - Tallymate",
  description: "Record, search, and filter personal income and expenses, and upload receipt files.",
};

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const initialData = await getTransactionsPageData();
  return <TransactionsView initialData={initialData} />;
}
