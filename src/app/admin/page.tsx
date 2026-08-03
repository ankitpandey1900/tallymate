import React from "react";
import { prisma } from "@/lib/db";
import { Users, Activity, Target, ShieldAlert, CreditCard, Flag, HandCoins, UserPlus } from "lucide-react";
import { format } from "date-fns";

export default async function AdminDashboardPage() {
  // Fetch high level metrics
  const [
    userCount, 
    groupCount, 
    transactionCount, 
    financialAccounts,
    budgetCount,
    goalCount,
    recentUsers
  ] = await Promise.all([
    prisma.user.count(),
    prisma.group.count(),
    prisma.transaction.count(),
    prisma.financialAccount.findMany({ select: { balance: true } }),
    prisma.budget.count(),
    prisma.financialGoal.count(),
    prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, name: true, email: true, createdAt: true } })
  ]);

  // Calculate total platform wealth
  const totalPlatformWealth = financialAccounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
  const formattedWealth = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalPlatformWealth);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Admin Overview</h1>
        <p className="text-sm text-neutral-500">Welcome to the Tallymate control center.</p>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Total Wealth */}
        <div className="panel-card p-6 bg-emerald-50 dark:bg-emerald-500/10 border-none rounded-2xl flex flex-col gap-4 col-span-1 md:col-span-2">
          <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
            <HandCoins size={24} />
            <h3 className="font-bold text-sm uppercase tracking-wider">Total Platform Wealth</h3>
          </div>
          <div className="text-4xl md:text-5xl font-bold text-emerald-700 dark:text-emerald-300">
            {formattedWealth}
          </div>
          <p className="text-emerald-600/70 dark:text-emerald-400/70 text-sm font-medium">Combined balance across all users</p>
        </div>

        {/* Total Users */}
        <div className="panel-card p-6 bg-white dark:bg-[#111113] border border-black/[0.04] dark:border-white/[0.04] rounded-2xl flex flex-col justify-center gap-2">
          <div className="flex items-center gap-3 text-neutral-500">
            <Users size={18} />
            <h3 className="font-semibold text-sm uppercase tracking-wider">Total Users</h3>
          </div>
          <div className="text-4xl font-bold">{userCount.toLocaleString()}</div>
        </div>

        {/* Total Transactions */}
        <div className="panel-card p-6 bg-white dark:bg-[#111113] border border-black/[0.04] dark:border-white/[0.04] rounded-2xl flex flex-col justify-center gap-2">
          <div className="flex items-center gap-3 text-neutral-500">
            <Activity size={18} />
            <h3 className="font-semibold text-sm uppercase tracking-wider">Transactions</h3>
          </div>
          <div className="text-4xl font-bold">{transactionCount.toLocaleString()}</div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="panel-card p-6 bg-white dark:bg-[#111113] border border-black/[0.04] dark:border-white/[0.04] rounded-2xl flex flex-col justify-center gap-2">
          <div className="flex items-center gap-3 text-neutral-500">
            <Users size={18} />
            <h3 className="font-semibold text-sm uppercase tracking-wider">Active Groups</h3>
          </div>
          <div className="text-3xl font-bold">{groupCount.toLocaleString()}</div>
        </div>
        <div className="panel-card p-6 bg-white dark:bg-[#111113] border border-black/[0.04] dark:border-white/[0.04] rounded-2xl flex flex-col justify-center gap-2">
          <div className="flex items-center gap-3 text-neutral-500">
            <Target size={18} />
            <h3 className="font-semibold text-sm uppercase tracking-wider">Active Budgets</h3>
          </div>
          <div className="text-3xl font-bold">{budgetCount.toLocaleString()}</div>
        </div>
        <div className="panel-card p-6 bg-white dark:bg-[#111113] border border-black/[0.04] dark:border-white/[0.04] rounded-2xl flex flex-col justify-center gap-2">
          <div className="flex items-center gap-3 text-neutral-500">
            <Flag size={18} />
            <h3 className="font-semibold text-sm uppercase tracking-wider">Financial Goals</h3>
          </div>
          <div className="text-3xl font-bold">{goalCount.toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity Feed */}
        <div className="panel-card p-6 bg-white dark:bg-[#111113] border border-black/[0.04] dark:border-white/[0.04] rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <UserPlus className="w-5 h-5 text-neutral-400" />
              <h2 className="font-semibold">Recent Signups</h2>
            </div>
          </div>
          
          <div className="space-y-1">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex justify-between items-center p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors text-sm">
                <div className="flex flex-col">
                  <span className="font-medium">{user.name || "Unnamed User"}</span>
                  <span className="text-xs text-neutral-500">{user.email}</span>
                </div>
                <span className="text-xs font-medium text-neutral-400">
                  {format(new Date(user.createdAt), "MMM d, h:mm a")}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-card p-8 bg-neutral-900 text-white rounded-2xl border-none">
          <div className="flex items-start gap-4">
            <ShieldAlert className="w-8 h-8 text-red-400 shrink-0" />
            <div className="space-y-2">
              <h2 className="text-lg font-bold">Admin Mode Active</h2>
              <p className="text-sm text-neutral-400 leading-relaxed max-w-xl">
                You are currently viewing Tallymate with administrative privileges. You have the ability to view all system data. Please handle user data with care and respect privacy.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
