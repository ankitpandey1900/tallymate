import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getLayoutData } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const layoutData = await getLayoutData();
  return <DashboardLayout initialData={layoutData}>{children}</DashboardLayout>;
}
