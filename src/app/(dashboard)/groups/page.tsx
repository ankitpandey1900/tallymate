import React from "react";
import GroupsManager from "@/components/groups/GroupsManager";
import { getGroupsPageData } from "@/app/actions";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Groups & Splits - Tallymate",
  description: "Create groups and split shared bills equally or unequally, with debt minimization calculations.",
};

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const initialData = await getGroupsPageData();
  return <GroupsManager initialData={initialData} />;
}
