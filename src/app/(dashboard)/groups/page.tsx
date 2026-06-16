import React from "react";
import GroupsManager from "@/components/groups/GroupsManager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Groups & Splits - Tallymate",
  description: "Create groups and split shared bills equally or unequally, with debt minimization calculations.",
};

export default function GroupsPage() {
  return <GroupsManager />;
}
