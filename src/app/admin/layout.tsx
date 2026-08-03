import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ShieldAlert, Users, LayoutDashboard, Database, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Admin Panel - Tallymate",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const sessionUser = await getCurrentUser();
  
  // Verify against database for most up-to-date role
  const dbUser = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    // @ts-ignore
    select: { id: true, name: true, email: true, role: true }
  });

  // @ts-ignore - role might not be fully typed yet
  if (!dbUser || dbUser.role !== "ADMIN") {
    // If not admin, bounce them back to the main dashboard immediately
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen bg-neutral-100 dark:bg-black font-sans text-neutral-900 dark:text-neutral-100">
      
      {/* Sidebar */}
      <aside className="w-64 border-r border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#111113] p-6 flex flex-col hidden md:flex">
        <div className="flex items-center gap-2 mb-10">
          <ShieldAlert className="w-6 h-6 text-red-500" />
          <h1 className="font-bold text-lg tracking-tight">Tallymate <span className="text-red-500">Admin</span></h1>
        </div>

        <nav className="space-y-1.5 flex-1">
          <Link href="/admin">
            <span className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
              <LayoutDashboard size={18} />
              Overview
            </span>
          </Link>
          <Link href="/admin/users">
            <span className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
              <Users size={18} />
              Users
            </span>
          </Link>
          <Link href="/admin/system">
            <span className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors opacity-50 cursor-not-allowed">
              <Database size={18} />
              System Logs (WIP)
            </span>
          </Link>
        </nav>

        <div className="pt-6 border-t border-black/[0.08] dark:border-white/[0.08]">
          <Link href="/dashboard">
            <Button variant="outline-app" className="w-full justify-start gap-2">
              <LogOut size={16} />
              Exit Admin
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#111113]">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <span className="font-bold">Admin</span>
          </div>
          <Link href="/dashboard">
            <Button variant="outline-app" size="sm">Exit</Button>
          </Link>
        </header>

        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

    </div>
  );
}
