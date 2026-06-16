import React from "react";
import TransactionsView from "@/components/transactions/TransactionsView";
import { getTransactionsPageData } from "@/app/actions";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transactions - Tallymate",
  description: "View, add, search, and filter your income and expenses.",
};

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const initialData = await getTransactionsPageData();
  return <TransactionsView initialData={initialData} />;
}
