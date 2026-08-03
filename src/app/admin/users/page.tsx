import React from "react";
import { prisma } from "@/lib/db";
import { format } from "date-fns";
import Link from "next/link";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      // @ts-ignore
      role: true,
      createdAt: true,
      updatedAt: true,
      financialAccounts: {
        select: {
          balance: true
        }
      },
      // @ts-ignore
      _count: {
        select: {
          transactions: true,
          groupMembers: true,
          financialAccounts: true,
        }
      }
    }
  });

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-sm text-neutral-500">View and manage all registered users.</p>
      </div>

      <div className="bg-white dark:bg-[#111113] border border-black/[0.04] dark:border-white/[0.04] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-neutral-500 uppercase bg-neutral-50 dark:bg-neutral-900 border-b border-black/[0.04] dark:border-white/[0.04] whitespace-nowrap">
              <tr>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Joined / Last Active</th>
                <th className="px-6 py-4 font-semibold text-right">Transactions</th>
                <th className="px-6 py-4 font-semibold text-right">Groups</th>
                <th className="px-6 py-4 font-semibold text-right">Accounts</th>
                <th className="px-6 py-4 font-semibold text-right">Total Wealth</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
              {users.map((u) => {
                const totalBalance = (u as any).financialAccounts.reduce((sum: number, acc: any) => sum + Number(acc.balance), 0);

                return (
                  <tr key={u.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">{u.name || "Unnamed"}</span>
                        <span className="text-xs text-neutral-500">{u.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {/* @ts-ignore */}
                      {u.role === "ADMIN" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400">
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-400">
                          User
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-neutral-500 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span>{format(new Date(u.createdAt), "MMM d, yyyy")}</span>
                        <span className="text-xs text-neutral-400">Upd: {format(new Date(u.updatedAt), "MMM d, yyyy")}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      {/* @ts-ignore */}
                      {u._count.transactions}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      {/* @ts-ignore */}
                      {u._count.groupMembers}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      {/* @ts-ignore */}
                      {u._count.financialAccounts}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {formatCurrency(totalBalance)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/users/${u.id}`} className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-xs uppercase tracking-wide">
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
