"use client";
import Image from "next/image";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  HandCoins,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeading } from "@/components/ui/section-heading";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { FieldLabel } from "@/components/ui/field-label";
import { toast, toastError } from "@/lib/toast";
import { PERSONAL_DEBT_CATEGORIES, formatPersonalDebtCategory } from "@/lib/personal-debt-labels";
import {
  createPersonalDebt,
  recordPersonalDebtPayment,
  markPersonalDebtSettled,
  deletePersonalDebt,
  type getDebtTrackerData,
} from "@/app/actions";

type DebtData = Awaited<ReturnType<typeof getDebtTrackerData>>;

const emptyDebtForm = {
  title: "",
  counterpartyName: "",
  direction: "I_OWE" as "I_OWE" | "OWED_TO_ME",
  category: "LOAN",
  totalAmount: "",
  dueDate: "",
  notes: "",
};

export default function DebtTrackerView({ initialData }: { initialData: DebtData }) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [debtForm, setDebtForm] = useState(emptyDebtForm);
  const [paymentDebtId, setPaymentDebtId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const activePersonal = data.personalDebts.filter((d) => d.status === "ACTIVE");
  const settledPersonal = data.personalDebts.filter((d) => d.status === "SETTLED");
  const paymentDebt = data.personalDebts.find((d) => d.id === paymentDebtId);

  const refresh = () => {
    router.refresh();
  };

  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createPersonalDebt({
        title: debtForm.title.trim(),
        counterpartyName: debtForm.counterpartyName.trim(),
        direction: debtForm.direction,
        category: debtForm.category,
        totalAmount: Number(debtForm.totalAmount),
        dueDate: debtForm.dueDate || undefined,
        notes: debtForm.notes.trim() || undefined,
      });
      setShowAddDebt(false);
      setDebtForm(emptyDebtForm);
      toast.success("Debt added");
      refresh();
    } catch (err) {
      toastError(err, "Failed to add debt");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentDebtId) return;
    setSubmitting(true);
    try {
      await recordPersonalDebtPayment(paymentDebtId, {
        amount: Number(paymentAmount),
        notes: paymentNotes.trim() || undefined,
      });
      setPaymentDebtId(null);
      setPaymentAmount("");
      setPaymentNotes("");
      toast.success("Payment recorded");
      refresh();
    } catch (err) {
      toastError(err, "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkSettled = async (debtId: string) => {
    try {
      await markPersonalDebtSettled(debtId);
      toast.success("Marked as settled");
      refresh();
    } catch (err) {
      toastError(err, "Failed to update debt");
    }
  };

  const handleDeleteDebt = async (debtId: string) => {
    try {
      await deletePersonalDebt(debtId);
      toast.success("Debt removed");
      refresh();
    } catch (err) {
      toastError(err, "Failed to delete debt");
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Debt Tracker</h2>
          <p className="text-sm text-neutral-500">
            Group splits, loans, and anything else you owe or are owed — in one place.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <Button
            type="button"
            variant="cta"
            onClick={() => setShowAddDebt(true)}
            className="gap-1.5 px-3 py-2 text-xs shadow-none"
          >
            <Plus size={14} />
            Add loan / debt
          </Button>
          <Link
            href="/groups"
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#e4e4e7] dark:border-[#27272a] hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-md text-xs font-semibold"
          >
            <Users size={14} />
            Groups
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="panel-card p-5 space-y-1">
          <div className="flex items-center gap-2 text-rose-500">
            <TrendingDown size={16} />
            <span className="text-xs font-medium text-neutral-500">You owe</span>
          </div>
          <p className="text-2xl font-bold font-mono">₹{data.totalYouOwe.toLocaleString('en-IN')}</p>
          {(data.groupYouOwe > 0 || data.personalYouOwe > 0) && (
            <p className="text-[10px] text-neutral-400">
              {data.groupYouOwe > 0 && `₹${data.groupYouOwe.toLocaleString('en-IN')} groups`}
              {data.groupYouOwe > 0 && data.personalYouOwe > 0 && " · "}
              {data.personalYouOwe > 0 && `₹${data.personalYouOwe.toLocaleString('en-IN')} personal`}
            </p>
          )}
        </div>
        <div className="panel-card p-5 space-y-1">
          <div className="flex items-center gap-2 text-emerald-500">
            <TrendingUp size={16} />
            <span className="text-xs font-medium text-neutral-500">You&apos;re owed</span>
          </div>
          <p className="text-2xl font-bold font-mono">₹{data.totalOwedToYou.toLocaleString('en-IN')}</p>
          {(data.groupOwedToYou > 0 || data.personalOwedToYou > 0) && (
            <p className="text-[10px] text-neutral-400">
              {data.groupOwedToYou > 0 && `₹${data.groupOwedToYou.toLocaleString('en-IN')} groups`}
              {data.groupOwedToYou > 0 && data.personalOwedToYou > 0 && " · "}
              {data.personalOwedToYou > 0 && `₹${data.personalOwedToYou.toLocaleString('en-IN')} personal`}
            </p>
          )}
        </div>
        <div className="panel-card p-5 space-y-1">
          <div className="flex items-center gap-2 text-neutral-500">
            <HandCoins size={16} />
            <span className="text-xs font-medium text-neutral-500">Net position</span>
          </div>
          <p
            className={cn(
              "text-2xl font-bold font-mono",
              data.netPosition > 0 ? "text-emerald-500" : data.netPosition < 0 ? "text-rose-500" : ""
            )}
          >
            {data.netPosition >= 0 ? "+" : "-"}₹{Math.abs(data.netPosition).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      <div className="panel-card p-5 space-y-4">
        <SectionHeading
          title="Loans & other debts"
          description="Track bank loans, credit cards, EMIs, or money lent to or borrowed from friends."
        />
        {activePersonal.length === 0 ? (
          <div className="py-10 text-center">
            <Wallet size={28} className="mx-auto text-neutral-300 dark:text-neutral-700 mb-2" />
            <p className="text-xs text-neutral-400">No personal debts yet.</p>
            <Button
              type="button"
              variant="outline-app"
              onClick={() => setShowAddDebt(true)}
              className="mt-3 text-xs"
            >
              Add your first loan or debt
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {activePersonal.map((d) => {
              const isOwe = d.direction === "I_OWE";
              const progress =
                d.totalAmount > 0
                  ? Math.min(100, Math.round(((d.totalAmount - d.remainingAmount) / d.totalAmount) * 100))
                  : 0;
              return (
                <div
                  key={d.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-none"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{d.title}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                        {formatPersonalDebtCategory(d.category)}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      {isOwe ? "You owe" : "Owes you"}: <span className="font-medium">{d.counterpartyName}</span>
                      {d.dueDate && (
                        <>
                          {" "}
                          · Due{" "}
                          {new Date(d.dueDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </>
                      )}
                    </p>
                    <div className="mt-2 h-1.5 w-full max-w-xs bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", isOwe ? "bg-rose-500" : "bg-emerald-500")}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-1">
                      ₹{(d.totalAmount - d.remainingAmount).toLocaleString('en-IN')} of ₹{d.totalAmount.toLocaleString('en-IN')} paid
                    </p>
                  </div>
                  <div className="flex flex-col sm:items-end justify-center gap-1.5 shrink-0 mt-3 sm:mt-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">Remaining</span>
                      <span
                        className={cn(
                          "font-bold font-mono text-[15px]",
                          isOwe ? "text-rose-500" : "text-emerald-500"
                        )}
                      >
                        ₹{d.remainingAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="unstyled"
                        onClick={() => {
                          setPaymentDebtId(d.id);
                          setPaymentAmount(String(d.remainingAmount));
                          setPaymentNotes("");
                        }}
                        className="text-[11px] font-semibold px-3 py-1.5 h-auto rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors shadow-sm"
                      >
                        Record Pay
                      </Button>
                      <Button
                        type="button"
                        variant="unstyled"
                        onClick={() => handleMarkSettled(d.id)}
                        className="text-[11px] font-semibold px-3 py-1.5 h-auto rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors shadow-sm flex items-center gap-1.5"
                      >
                        <Check size={12} strokeWidth={3} />
                        Settle
                      </Button>
                      <Button
                        type="button"
                        variant="unstyled"
                        onClick={() => handleDeleteDebt(d.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-md bg-white dark:bg-[#1a1a1c] border border-black/[0.06] dark:border-white/[0.06] text-neutral-400 hover:text-rose-500 hover:border-rose-200 transition-colors shadow-sm"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {settledPersonal.length > 0 && (
          <div className="pt-4 mt-2 border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] uppercase tracking-widest text-neutral-400 font-bold">
                Settled History
              </p>
              <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-500 px-2 py-0.5 rounded-full font-semibold">
                {settledPersonal.length}
              </span>
            </div>
            <div className="space-y-1">
              {settledPersonal.slice(0, 5).map((d) => (
                <div key={d.id} className="flex items-center justify-between text-xs text-neutral-500 py-1.5 px-2 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 rounded-md transition-colors group">
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500 opacity-50" />
                    <span className="font-medium line-through decoration-neutral-300 dark:decoration-neutral-700">{d.title}</span>
                    <span className="text-neutral-400">·</span>
                    <span className="text-neutral-400">{d.counterpartyName}</span>
                  </div>
                  <Button
                    type="button"
                    variant="unstyled"
                    onClick={() => handleDeleteDebt(d.id)}
                    className="p-1 text-neutral-300 dark:text-neutral-700 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="panel-card p-5 space-y-4">
          <SectionHeading
            title="Group payments"
            description="Suggested payments from your shared groups."
          />
          {data.pendingSettlements.length === 0 ? (
            <p className="text-xs text-neutral-400 py-6 text-center">No pending group payments.</p>
          ) : (
            <div className="space-y-3">
              {data.pendingSettlements.map((s, idx) => {
                const targetName = s.youArePayer ? s.toUserName : (s.youAreReceiver ? s.fromUserName : `${s.fromUserName} → ${s.toUserName}`);
                const targetImage = s.youArePayer ? (s as any).toUserImage : (s.youAreReceiver ? (s as any).fromUserImage : null);
                const initial = targetName.charAt(0).toUpperCase();
                return (
                  <div
                    key={`${s.groupId}-${idx}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b border-black/[0.04] dark:border-white/[0.04] last:border-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-black/5 flex items-center justify-center text-sm font-bold text-neutral-600 dark:text-neutral-300 shrink-0 shadow-sm overflow-hidden">
                        {targetImage ? (
                          <Image src={targetImage} width={80} height={80} alt={targetName} className="w-full h-full object-cover" />
                        ) : (
                          initial
                        )}
                      </div>
                      <div className="text-[13px]">
                        {s.youArePayer ? (
                          <div className="text-neutral-600 dark:text-neutral-300">
                            You pay <span className="font-bold text-neutral-900 dark:text-white">{s.toUserName}</span>
                          </div>
                        ) : s.youAreReceiver ? (
                          <div className="text-neutral-600 dark:text-neutral-300">
                            <span className="font-bold text-neutral-900 dark:text-white">{s.fromUserName}</span> pays you
                          </div>
                        ) : (
                          <div className="text-neutral-600 dark:text-neutral-300 font-medium">
                            {s.fromUserName} pays {s.toUserName}
                          </div>
                        )}
                        <div className="flex items-center gap-1 mt-0.5">
                          <Users size={10} className="text-neutral-400" />
                          <p className="text-[11px] text-neutral-400 font-medium">{s.groupName}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-12 sm:ml-0">
                      <span
                        className={cn(
                          "font-bold font-mono text-[15px]",
                          s.youArePayer ? "text-rose-500" : "text-emerald-500"
                        )}
                      >
                        ₹{s.amount.toLocaleString('en-IN')}
                      </span>
                      <Link
                        href="/groups"
                        className="inline-flex items-center px-3 py-1.5 bg-neutral-900 text-white dark:bg-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-md text-[11px] font-bold shadow-sm transition-colors"
                      >
                        Settle
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="panel-card p-5 space-y-4">
          <SectionHeading
            title="By person (groups)"
            description="Balances with friends across all shared groups."
          />
          {data.people.length === 0 ? (
            <p className="text-xs text-neutral-400 py-6 text-center">No group debts with anyone yet.</p>
          ) : (
            <div className="space-y-1">
              {data.people.map((p) => (
                <div
                  key={p.userId}
                  className="flex items-center justify-between py-2.5 border-b border-black/[0.04] dark:border-white/[0.04] last:border-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-500 font-bold text-xs shrink-0 shadow-sm overflow-hidden">
                      {(p as any).image ? (
                        <Image src={(p as any).image} width={80} height={80} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        p.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-neutral-900 dark:text-white">{p.name}</p>
                      <p className="text-[11px] text-neutral-500 font-medium line-clamp-1">{p.groups.join(", ")}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-[13px] font-bold font-mono tracking-tight text-right",
                      p.net > 0 ? "text-emerald-500" : p.net < 0 ? "text-rose-500" : "text-neutral-400"
                    )}
                  >
                    {p.net > 0 ? (
                      <>
                        <span className="block text-[10px] font-medium text-emerald-600/70 uppercase tracking-wider mb-0.5">Owes you</span>
                        ₹{p.net.toLocaleString('en-IN')}
                      </>
                    ) : p.net < 0 ? (
                      <>
                        <span className="block text-[10px] font-medium text-rose-600/70 uppercase tracking-wider mb-0.5">You owe</span>
                        ₹{Math.abs(p.net).toLocaleString('en-IN')}
                      </>
                    ) : (
                      "Settled"
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="panel-card p-5 space-y-4">
        <SectionHeading title="By group" description="Your balance in each shared group." />
        {data.groupSummaries.length === 0 ? (
          <p className="text-xs text-neutral-400 py-6 text-center">
            Join or create a group to start tracking shared expenses.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.groupSummaries.map((g) => (
              <Link
                key={g.groupId}
                href="/groups"
                className="flex items-center justify-between p-3 rounded-xl border border-black/5 dark:border-white/5 bg-white dark:bg-[#151517] hover:border-emerald-500/30 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 font-bold shrink-0 overflow-hidden">
                    {(g as any).groupImage ? (
                      <Image src={(g as any).groupImage} width={80} height={80} alt={g.groupName} className="w-full h-full object-cover" />
                    ) : (
                      g.groupName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-neutral-900 dark:text-white group-hover:text-emerald-500 transition-colors">{g.groupName}</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      {g.pendingCount > 0
                        ? `${g.pendingCount} pending payment${g.pendingCount > 1 ? "s" : ""}`
                        : "All settled"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-sm font-bold font-mono",
                      g.yourBalance > 0 ? "text-emerald-500" : g.yourBalance < 0 ? "text-rose-500" : "text-neutral-400"
                    )}
                  >
                    {g.yourBalance > 0 ? "+" : g.yourBalance < 0 ? "-" : ""}
                    ₹{Math.abs(g.yourBalance).toLocaleString('en-IN')}
                  </span>
                  <ArrowRight size={14} className="text-neutral-300 dark:text-neutral-700 group-hover:text-emerald-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <AppDialog open={showAddDebt} onOpenChange={setShowAddDebt} title="Add loan or debt" maxWidth="max-w-lg">
        <form onSubmit={handleCreateDebt} className="space-y-3">
          <div className="space-y-1.5">
            <FieldLabel>What is it?</FieldLabel>
            <Input
              required
              placeholder="e.g. HDFC personal loan, Lent to Rahul"
              value={debtForm.title}
              onChange={(e) => setDebtForm((p) => ({ ...p, title: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Bank / person</FieldLabel>
            <Input
              required
              placeholder="e.g. HDFC Bank, Mom, Rahul"
              value={debtForm.counterpartyName}
              onChange={(e) => setDebtForm((p) => ({ ...p, counterpartyName: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FieldLabel>Direction</FieldLabel>
              <NativeSelect
                value={debtForm.direction}
                onChange={(e) =>
                  setDebtForm((p) => ({ ...p, direction: e.target.value as "I_OWE" | "OWED_TO_ME" }))
                }
              >
                <option value="I_OWE">I owe them</option>
                <option value="OWED_TO_ME">They owe me</option>
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Type</FieldLabel>
              <NativeSelect
                value={debtForm.category}
                onChange={(e) => setDebtForm((p) => ({ ...p, category: e.target.value }))}
              >
                {PERSONAL_DEBT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FieldLabel>Total amount (₹)</FieldLabel>
              <Input
                type="number"
                required
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={debtForm.totalAmount}
                onChange={(e) => setDebtForm((p) => ({ ...p, totalAmount: e.target.value }))}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Due date (optional)</FieldLabel>
              <Input
                type="date"
                value={debtForm.dueDate}
                onChange={(e) => setDebtForm((p) => ({ ...p, dueDate: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Notes (optional)</FieldLabel>
            <Input
              placeholder="EMI amount, account number, etc."
              value={debtForm.notes}
              onChange={(e) => setDebtForm((p) => ({ ...p, notes: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="cancel" onClick={() => setShowAddDebt(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Add debt"}
            </Button>
          </div>
        </form>
      </AppDialog>

      <AppDialog
        open={!!paymentDebt}
        onOpenChange={(open) => {
          if (!open) setPaymentDebtId(null);
        }}
        title="Record payment"
        maxWidth="max-w-sm"
      >
        {paymentDebt && (
          <form onSubmit={handleRecordPayment} className="space-y-3">
            <p className="text-xs text-neutral-500">
              {paymentDebt.title} · {paymentDebt.counterpartyName}
              <br />
              Remaining: <span className="font-mono font-semibold">₹{paymentDebt.remainingAmount.toLocaleString('en-IN')}</span>
            </p>
            <div className="space-y-1.5">
              <FieldLabel>Payment amount (₹)</FieldLabel>
              <Input
                type="number"
                required
                min="0.01"
                step="0.01"
                max={paymentDebt.remainingAmount}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Notes (optional)</FieldLabel>
              <Input
                placeholder="e.g. EMI paid via UPI"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="cancel" onClick={() => setPaymentDebtId(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="submit" disabled={submitting}>
                {submitting ? "Saving…" : "Save payment"}
              </Button>
            </div>
          </form>
        )}
      </AppDialog>
    </div>
  );
}
