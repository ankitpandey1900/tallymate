"use client";

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
          <p className="text-2xl font-bold font-mono">₹{data.totalYouOwe.toLocaleString()}</p>
          {(data.groupYouOwe > 0 || data.personalYouOwe > 0) && (
            <p className="text-[10px] text-neutral-400">
              {data.groupYouOwe > 0 && `₹${data.groupYouOwe.toLocaleString()} groups`}
              {data.groupYouOwe > 0 && data.personalYouOwe > 0 && " · "}
              {data.personalYouOwe > 0 && `₹${data.personalYouOwe.toLocaleString()} personal`}
            </p>
          )}
        </div>
        <div className="panel-card p-5 space-y-1">
          <div className="flex items-center gap-2 text-emerald-500">
            <TrendingUp size={16} />
            <span className="text-xs font-medium text-neutral-500">You&apos;re owed</span>
          </div>
          <p className="text-2xl font-bold font-mono">₹{data.totalOwedToYou.toLocaleString()}</p>
          {(data.groupOwedToYou > 0 || data.personalOwedToYou > 0) && (
            <p className="text-[10px] text-neutral-400">
              {data.groupOwedToYou > 0 && `₹${data.groupOwedToYou.toLocaleString()} groups`}
              {data.groupOwedToYou > 0 && data.personalOwedToYou > 0 && " · "}
              {data.personalOwedToYou > 0 && `₹${data.personalOwedToYou.toLocaleString()} personal`}
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
            {data.netPosition >= 0 ? "+" : "-"}₹{Math.abs(data.netPosition).toLocaleString()}
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
                      ₹{(d.totalAmount - d.remainingAmount).toLocaleString()} of ₹{d.totalAmount.toLocaleString()} paid
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        "font-bold font-mono text-sm",
                        isOwe ? "text-rose-500" : "text-emerald-500"
                      )}
                    >
                      ₹{d.remainingAmount.toLocaleString()}
                    </span>
                    <Button
                      type="button"
                      variant="outline-app"
                      onClick={() => {
                        setPaymentDebtId(d.id);
                        setPaymentAmount(String(d.remainingAmount));
                        setPaymentNotes("");
                      }}
                      className="text-[10px] px-2 py-1 h-auto"
                    >
                      Record payment
                    </Button>
                    <Button
                      type="button"
                      variant="unstyled"
                      onClick={() => handleMarkSettled(d.id)}
                      className="text-[10px] px-2 py-1 h-auto text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
                    >
                      Settled
                    </Button>
                    <Button
                      type="button"
                      variant="unstyled"
                      onClick={() => handleDeleteDebt(d.id)}
                      className="p-1.5 text-neutral-400 hover:text-rose-500"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {settledPersonal.length > 0 && (
          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold mb-2">
              Settled ({settledPersonal.length})
            </p>
            <div className="space-y-1">
              {settledPersonal.slice(0, 5).map((d) => (
                <div key={d.id} className="flex items-center justify-between text-xs text-neutral-400 py-1">
                  <span>{d.title} · {d.counterpartyName}</span>
                  <Button
                    type="button"
                    variant="unstyled"
                    onClick={() => handleDeleteDebt(d.id)}
                    className="p-1 hover:text-rose-500"
                  >
                    <Trash2 size={12} />
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
              {data.pendingSettlements.map((s, idx) => (
                <div
                  key={`${s.groupId}-${idx}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-none"
                >
                  <div className="text-sm">
                    {s.youArePayer ? (
                      <>
                        You pay <span className="font-semibold">{s.toUserName}</span>
                      </>
                    ) : s.youAreReceiver ? (
                      <>
                        <span className="font-semibold">{s.fromUserName}</span> pays you
                      </>
                    ) : (
                      <>
                        {s.fromUserName} pays {s.toUserName}
                      </>
                    )}
                    <p className="text-[11px] text-neutral-400 mt-0.5">in {s.groupName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "font-bold font-mono text-sm",
                        s.youArePayer ? "text-rose-500" : "text-emerald-500"
                      )}
                    >
                      ₹{s.amount.toLocaleString()}
                    </span>
                    <Link
                      href="/groups"
                      className="inline-flex items-center px-2 py-1 border border-[#e4e4e7] dark:border-[#27272a] hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-md text-[10px] font-semibold"
                    >
                      Settle
                    </Link>
                  </div>
                </div>
              ))}
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
            <div className="space-y-2">
              {data.people.map((p) => (
                <div
                  key={p.userId}
                  className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-none"
                >
                  <div>
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="text-[11px] text-neutral-400">{p.groups.join(", ")}</p>
                  </div>
                  <span
                    className={cn(
                      "text-xs font-bold font-mono",
                      p.net > 0 ? "text-emerald-500" : p.net < 0 ? "text-rose-500" : "text-neutral-400"
                    )}
                  >
                    {p.net > 0
                      ? `Owes you ₹${p.net}`
                      : p.net < 0
                        ? `You owe ₹${Math.abs(p.net)}`
                        : "Settled"}
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
          <div className="space-y-2">
            {data.groupSummaries.map((g) => (
              <Link
                key={g.groupId}
                href="/groups"
                className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold">{g.groupName}</p>
                  <p className="text-[11px] text-neutral-400">
                    {g.pendingCount > 0
                      ? `${g.pendingCount} suggested payment${g.pendingCount > 1 ? "s" : ""}`
                      : "All settled"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-xs font-bold font-mono",
                      g.yourBalance > 0
                        ? "text-emerald-500"
                        : g.yourBalance < 0
                          ? "text-rose-500"
                          : "text-neutral-400"
                    )}
                  >
                    {g.yourBalance > 0
                      ? `+₹${g.yourBalance.toLocaleString()}`
                      : g.yourBalance < 0
                        ? `-₹${Math.abs(g.yourBalance).toLocaleString()}`
                        : "Settled"}
                  </span>
                  <ArrowRight size={14} className="text-neutral-400" />
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
              Remaining: <span className="font-mono font-semibold">₹{paymentDebt.remainingAmount.toLocaleString()}</span>
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
