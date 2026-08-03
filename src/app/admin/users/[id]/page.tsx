import React from "react";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserCircle, Activity, CreditCard, Users, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await prisma.user.findUnique({
    where: { id: resolvedParams.id },
    include: {
      accounts: true,
      financialAccounts: true,
      groupMembers: {
        include: {
          group: true
        }
      },
      transactions: {
        orderBy: { date: 'desc' },
        take: 10
      }
    }
  });

  if (!user) {
    notFound();
  }

  const totalBalance = user.financialAccounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <Link href="/admin/users" className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            {user.name || "Unnamed User"} 
            {/* @ts-ignore */}
            {user.role === "ADMIN" && (
              <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400 uppercase tracking-wider font-semibold">Admin</span>
            )}
          </h1>
          <p className="text-sm text-neutral-500">{user.email}</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Wealth */}
          <div className="panel-card p-6 bg-white dark:bg-[#111113] border border-black/[0.04] dark:border-white/[0.04] rounded-2xl flex flex-col justify-center">
            <div className="flex items-center gap-3 text-neutral-500 mb-2">
              <CreditCard size={18} />
              <span className="text-sm font-medium uppercase tracking-wider">Total Stored Wealth</span>
            </div>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalBalance)}</div>
          </div>

          <div className="panel-card p-6 bg-white dark:bg-[#111113] border border-black/[0.04] dark:border-white/[0.04] rounded-2xl flex flex-col justify-center">
            <div className="flex items-center gap-3 text-neutral-500 mb-2">
              <CreditCard size={18} />
              <span className="text-sm font-medium uppercase tracking-wider">Financial Accounts</span>
            </div>
            <div className="text-3xl font-bold">{user.financialAccounts.length}</div>
          </div>

          <div className="panel-card p-6 bg-white dark:bg-[#111113] border border-black/[0.04] dark:border-white/[0.04] rounded-2xl flex flex-col justify-center">
            <div className="flex items-center gap-3 text-neutral-500 mb-2">
              <Users size={18} />
              <span className="text-sm font-medium uppercase tracking-wider">Active Groups</span>
            </div>
            <div className="text-3xl font-bold">{user.groupMembers.length}</div>
          </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Basic Info Card */}
        <div className="panel-card p-6 bg-white dark:bg-[#111113] border border-black/[0.04] dark:border-white/[0.04] rounded-2xl md:col-span-1">
          <div className="flex items-center gap-3 mb-6">
            <UserCircle className="w-5 h-5 text-neutral-400" />
            <h2 className="font-semibold">Account Info</h2>
          </div>
          
          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-black/[0.04] dark:border-white/[0.04]">
              <span className="text-neutral-500">Joined</span>
              <span className="font-medium">{format(new Date(user.createdAt), "MMM d, yyyy")}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-black/[0.04] dark:border-white/[0.04]">
              <span className="text-neutral-500">Email Verified</span>
              <span className="font-medium">
                {user.emailVerified ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 inline-block" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500 inline-block" />
                )}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-black/[0.04] dark:border-white/[0.04]">
              <span className="text-neutral-500">Auth Providers</span>
              <span className="font-medium flex gap-1">
                {user.accounts.length > 0 ? user.accounts.map(a => a.providerId).join(", ") : "Email/Password"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-neutral-500">User ID</span>
              <span className="font-mono text-[10px] text-neutral-400">{user.id}</span>
            </div>
          </div>
        </div>

        {/* Financial Accounts Breakdown */}
        <div className="panel-card p-6 bg-white dark:bg-[#111113] border border-black/[0.04] dark:border-white/[0.04] rounded-2xl md:col-span-1">
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="w-5 h-5 text-neutral-400" />
            <h2 className="font-semibold">Financial Accounts Breakdown</h2>
          </div>
          
          {user.financialAccounts.length === 0 ? (
             <div className="text-center py-10 text-neutral-500 text-sm">No financial accounts setup.</div>
          ) : (
            <div className="space-y-1">
              {user.financialAccounts.map((acc) => (
                <div key={acc.id} className="flex justify-between items-center p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium">{acc.name}</span>
                    <span className="text-xs text-neutral-500 capitalize">{acc.type.toLowerCase()}</span>
                  </div>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {formatCurrency(Number(acc.balance))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="panel-card p-6 bg-white dark:bg-[#111113] border border-black/[0.04] dark:border-white/[0.04] rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-neutral-400" />
              <h2 className="font-semibold">Recent Transactions (Last 10)</h2>
            </div>
          </div>

          {user.transactions.length === 0 ? (
            <div className="text-center py-10 text-neutral-500 text-sm">No transactions found for this user.</div>
          ) : (
            <div className="space-y-1">
              {user.transactions.map((tx) => (
                <div key={tx.id} className="flex justify-between items-center p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium truncate max-w-[200px]">{tx.description}</span>
                    <span className="text-xs text-neutral-500">{format(new Date(tx.date), "MMM d, yyyy")} • {tx.type}</span>
                  </div>
                  <span className={`font-semibold ${tx.type === 'INCOME' ? 'text-emerald-500' : 'text-neutral-900 dark:text-neutral-100'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Group Memberships */}
        <div className="panel-card p-6 bg-white dark:bg-[#111113] border border-black/[0.04] dark:border-white/[0.04] rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-neutral-400" />
              <h2 className="font-semibold">Group Memberships</h2>
            </div>
          </div>

          {user.groupMembers.length === 0 ? (
            <div className="text-center py-10 text-neutral-500 text-sm">User is not part of any groups.</div>
          ) : (
            <div className="space-y-1">
              {user.groupMembers.map((member) => (
                <div key={member.id} className="flex justify-between items-center p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium truncate max-w-[200px]">{member.group.name}</span>
                    <span className="text-xs text-neutral-500 capitalize">{member.group.type.toLowerCase()} • Role: {member.role.toLowerCase()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
