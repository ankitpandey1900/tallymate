import React from "react";
import ImportRulesManager from "@/components/import-rules/ImportRulesManager";
import { getImportRulesPageData } from "@/app/actions";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Import Rules - Tallymate",
  description: "Manage auto-categorization mapping rules for CSV imports.",
};

export const dynamic = "force-dynamic";

export default async function ImportRulesPage() {
  const initialData = await getImportRulesPageData();
  return <ImportRulesManager initialData={initialData} />;
}
