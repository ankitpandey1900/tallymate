"use client";
import Image from "next/image";

import React, { useEffect, useState, useMemo } from "react";
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
  Search,
  Pencil,
  RotateCcw,
  Clock,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
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
  getPersonalDebtPayments,
  updatePersonalDebtDetails,
  revokePersonalDebtSettlement,
  type getDebtTrackerData,
} from "@/app/actions";

type DebtData = Awaited<ReturnType<typeof getDebtTrackerData>>;

const todayStr = () => new Date().toISOString().slice(0, 10);

const emptyDebtForm = {
  title: "",
  counterpartyName: "",
  direction: "I_OWE" as "I_OWE" | "OWED_TO_ME",
  category: "LOAN",
  totalAmount: "",
  startedAt: todayStr(),
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
  const [detailDebtId, setDetailDebtId] = useState<string | null>(null);
  const [detailPayments, setDetailPayments] = useState<{ id: string; personalDebtId: string; amount: number; date: string; notes?: string }[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<{ title: string; counterpartyName: string; dueDate: string; notes: string }>({ title: "", counterpartyName: "", dueDate: "", notes: "" });

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const activePersonal = data.personalDebts.filter((d) => d.status === "ACTIVE");
  const settledPersonal = data.personalDebts.filter((d) => d.status === "SETTLED");
  const paymentDebt = data.personalDebts.find((d) => d.id === paymentDebtId);
  const [viewMode, setViewMode] = useState<"DETAILED" | "GROUPED">("DETAILED");
  const [settledSearchQuery, setSettledSearchQuery] = useState("");
  const [settledPage, setSettledPage] = useState(1);
  const SETTLED_PER_PAGE = 15;
  const [activeEditDebtId, setActiveEditDebtId] = useState<string | null>(null);
  const [activeEditForm, setActiveEditForm] = useState<{ title: string; counterpartyName: string; category: string; dueDate: string; startedAt: string; notes: string }>({ title: "", counterpartyName: "", category: "LOAN", dueDate: "", startedAt: "", notes: "" });

  // Detailed view: sorting + pagination
  type SortKey = "startedAt" | "dueDate" | "remainingAmount" | "totalAmount";
  const [sortKey, setSortKey] = useState<SortKey>("startedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [activePage, setActivePage] = useState(1);
  const ACTIVE_PER_PAGE = 10;

  // Grouped view: expanded person
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null);

  const filteredSettled = useMemo(() => {
    if (!settledSearchQuery.trim()) return settledPersonal;
    const q = settledSearchQuery.toLowerCase();
    return settledPersonal.filter((d) =>
      d.counterpartyName.toLowerCase().includes(q) ||
      d.title.toLowerCase().includes(q)
    );
  }, [settledPersonal, settledSearchQuery]);

  // Reset pagination to page 1 whenever the search query changes
  useEffect(() => {
    setSettledPage(1);
  }, [settledSearchQuery]);

  const settledTotalPages = Math.ceil(filteredSettled.length / SETTLED_PER_PAGE);
  const paginatedSettled = filteredSettled.slice((settledPage - 1) * SETTLED_PER_PAGE, settledPage * SETTLED_PER_PAGE);



  const groupedPersonalDebts = useMemo(() => {
    const groups: Record<string, { owesYou: number; youOwe: number; net: number; count: number }> = {};
    activePersonal.forEach(d => {
      const name = d.counterpartyName.trim();
      const normalizedName = name.toLowerCase();
      const key = Object.keys(groups).find(k => k.toLowerCase() === normalizedName) || name;
      
      if (!groups[key]) {
        groups[key] = { owesYou: 0, youOwe: 0, net: 0, count: 0 };
      }
      
      groups[key].count += 1;
      if (d.direction === "OWED_TO_ME") {
        groups[key].owesYou += d.remainingAmount;
        groups[key].net += d.remainingAmount;
      } else {
        groups[key].youOwe += d.remainingAmount;
        groups[key].net -= d.remainingAmount;
      }
    });
    
    return Object.entries(groups)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.net - a.net);
  }, [activePersonal]);

  const uniqueCounterparties = useMemo(() => {
    const names = new Set<string>();
    data.personalDebts.forEach(d => names.add(d.counterpartyName.trim()));
    return Array.from(names).sort();
  }, [data.personalDebts]);

  const settledStats = useMemo(() => {
    let totalPaidOut = 0;
    let totalCollected = 0;
    settledPersonal.forEach((d) => {
      if (d.direction === "I_OWE") {
        totalPaidOut += d.totalAmount;
      } else {
        totalCollected += d.totalAmount;
      }
    });
    return { totalPaidOut, totalCollected };
  }, [settledPersonal]);

  const sortedActivePersonal = useMemo(() => {
    const sorted = [...activePersonal].sort((a, b) => {
      let aVal: number, bVal: number;
      if (sortKey === "startedAt") {
        aVal = a.startedAt ? new Date(a.startedAt).getTime() : 0;
        bVal = b.startedAt ? new Date(b.startedAt).getTime() : 0;
      } else if (sortKey === "dueDate") {
        aVal = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        bVal = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      } else if (sortKey === "remainingAmount") {
        aVal = a.remainingAmount;
        bVal = b.remainingAmount;
      } else {
        aVal = a.totalAmount;
        bVal = b.totalAmount;
      }
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });
    return sorted;
  }, [activePersonal, sortKey, sortDir]);

  const activeTotalPages = Math.ceil(sortedActivePersonal.length / ACTIVE_PER_PAGE);
  const paginatedActive = sortedActivePersonal.slice((activePage - 1) * ACTIVE_PER_PAGE, activePage * ACTIVE_PER_PAGE);

  const handleSortChange = (key: typeof sortKey) => {
    if (key === sortKey) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setActivePage(1);
  };

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

  const detailDebt = data.personalDebts.find((d) => d.id === detailDebtId) ?? null;

  const openDetailModal = async (debt: typeof data.personalDebts[number]) => {
    setDetailDebtId(debt.id);
    setEditMode(false);
    setEditForm({
      title: debt.title,
      counterpartyName: debt.counterpartyName,
      dueDate: debt.dueDate ? debt.dueDate.slice(0, 10) : "",
      notes: debt.notes ?? "",
    });
    setDetailLoading(true);
    try {
      const payments = await getPersonalDebtPayments(debt.id);
      setDetailPayments(payments);
    } catch {
      setDetailPayments([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateDebt = async () => {
    if (!detailDebtId) return;
    setSubmitting(true);
    try {
      await updatePersonalDebtDetails(detailDebtId, {
        title: editForm.title.trim(),
        counterpartyName: editForm.counterpartyName.trim(),
        dueDate: editForm.dueDate || null,
        notes: editForm.notes.trim() || null,
      });
      toast.success("Updated");
      setEditMode(false);
      refresh();
    } catch (err) {
      toastError(err, "Failed to update");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeSettlement = async () => {
    if (!detailDebtId) return;
    setSubmitting(true);
    try {
      await revokePersonalDebtSettlement(detailDebtId);
      toast.success("Debt re-opened as active");
      setDetailDebtId(null);
      refresh();
    } catch (err) {
      toastError(err, "Failed to revoke");
    } finally {
      setSubmitting(false);
    }
  };

  const activeEditDebt = data.personalDebts.find((d) => d.id === activeEditDebtId) ?? null;

  const openActiveEditModal = (debt: typeof data.personalDebts[number]) => {
    setActiveEditDebtId(debt.id);
    setActiveEditForm({
      title: debt.title,
      counterpartyName: debt.counterpartyName,
      category: debt.category,
      dueDate: debt.dueDate ? debt.dueDate.slice(0, 10) : "",
      startedAt: debt.startedAt ? debt.startedAt.slice(0, 10) : todayStr(),
      notes: debt.notes ?? "",
    });
  };

  const handleSaveActiveEdit = async () => {
    if (!activeEditDebtId) return;
    setSubmitting(true);
    try {
      await updatePersonalDebtDetails(activeEditDebtId, {
        title: activeEditForm.title.trim(),
        counterpartyName: activeEditForm.counterpartyName.trim(),
        startedAt: activeEditForm.startedAt || null,
        dueDate: activeEditForm.dueDate || null,
        notes: activeEditForm.notes.trim() || null,
      });
      toast.success("Updated");
      setActiveEditDebtId(null);
      refresh();
    } catch (err) {
      toastError(err, "Failed to update");
    } finally {
      setSubmitting(false);
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <SectionHeading
            title="Loans & other debts"
            description="Track bank loans, credit cards, EMIs, or money lent to or borrowed from friends."
          />
          {activePersonal.length > 0 && (
            <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("DETAILED")}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-md transition-colors",
                  viewMode === "DETAILED" ? "bg-white dark:bg-neutral-900 shadow-sm text-neutral-900 dark:text-white" : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                )}
              >
                Detailed List
              </button>
              <button
                type="button"
                onClick={() => setViewMode("GROUPED")}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-md transition-colors",
                  viewMode === "GROUPED" ? "bg-white dark:bg-neutral-900 shadow-sm text-neutral-900 dark:text-white" : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                )}
              >
                Grouped by Person
              </button>
            </div>
          )}
        </div>
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
        ) : viewMode === "DETAILED" ? (
          <div className="space-y-3">
            {/* Sort controls */}
            <div className="flex flex-wrap items-center gap-2 pb-1">
              <span className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider flex items-center gap-1"><ArrowUpDown size={11} />Sort:</span>
              {([
                { key: "startedAt" as const, label: "Taken Date" },
                { key: "dueDate" as const, label: "Due Date" },
                { key: "remainingAmount" as const, label: "Remaining" },
                { key: "totalAmount" as const, label: "Total" },
              ]).map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSortChange(key)}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors",
                    sortKey === key
                      ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30"
                      : "bg-white dark:bg-neutral-900 text-neutral-500 border-neutral-200 dark:border-neutral-700 hover:border-indigo-200 dark:hover:border-indigo-500/30"
                  )}
                >
                  {label}
                  {sortKey === key && (
                    sortDir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />
                  )}
                </button>
              ))}
              <span className="ml-auto text-[11px] text-neutral-400">
                {sortedActivePersonal.length} debt{sortedActivePersonal.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Debt cards */}
            <div className="space-y-2">
            {paginatedActive.map((d) => {
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
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-[15px] font-semibold text-neutral-900 dark:text-white">{d.title}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wide bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                        {formatPersonalDebtCategory(d.category)}
                      </span>
                    </div>
                    
                    <div className="flex flex-col gap-1 mt-1.5 mb-2.5">
                      <p className="text-[12px] text-neutral-600 dark:text-neutral-400">
                        {isOwe ? "You owe" : "Owes you"}: <span className="font-semibold text-neutral-900 dark:text-neutral-200">{d.counterpartyName}</span>
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-neutral-500 dark:text-neutral-500">
                        {d.startedAt && (
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600"></span>
                            Taken: {new Date(d.startedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        )}
                        {d.dueDate && (
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 dark:bg-amber-500"></span>
                            Due: <span className="font-medium text-amber-700 dark:text-amber-500">{new Date(d.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-1 h-1.5 w-full max-w-xs bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", isOwe ? "bg-rose-500" : "bg-emerald-500")}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-1.5 font-medium">
                      ₹{(d.totalAmount - d.remainingAmount).toLocaleString('en-IN')} of ₹{d.totalAmount.toLocaleString('en-IN')} paid
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:items-end justify-center gap-3 shrink-0 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t border-neutral-100 dark:border-neutral-800 sm:border-0 w-full sm:w-auto">
                    <div className="flex items-center gap-1.5 justify-between sm:justify-end w-full sm:w-auto">
                      <span className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider">Remaining</span>
                      <span
                        className={cn(
                          "font-bold font-mono text-lg",
                          isOwe ? "text-rose-600 dark:text-rose-500" : "text-emerald-600 dark:text-emerald-500"
                        )}
                      >
                        ₹{d.remainingAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
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
                        onClick={() => openActiveEditModal(d)}
                        className="w-7 h-7 flex items-center justify-center rounded-md bg-white dark:bg-[#1a1a1c] border border-black/[0.06] dark:border-white/[0.06] text-neutral-400 hover:text-indigo-500 hover:border-indigo-200 transition-colors shadow-sm"
                        title="Edit"
                      >
                        <Pencil size={13} />
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

            {/* Pagination */}
            {activeTotalPages > 1 && (
              <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <span className="text-[11px] text-neutral-400">
                  Page {activePage} of {activeTotalPages} · Showing {(activePage - 1) * ACTIVE_PER_PAGE + 1}–{Math.min(activePage * ACTIVE_PER_PAGE, sortedActivePersonal.length)} of {sortedActivePersonal.length}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={activePage === 1}
                    onClick={() => setActivePage(p => p - 1)}
                    className="px-3 py-1.5 text-[11px] font-semibold rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 disabled:opacity-40 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-colors bg-white dark:bg-neutral-900"
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: activeTotalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === activeTotalPages || Math.abs(p - activePage) <= 1)
                    .reduce<(number | "...")[]>((acc, p, i, arr) => {
                      if (i > 0 && typeof arr[i - 1] === "number" && (p as number) - (arr[i - 1] as number) > 1) acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === "..." ? (
                        <span key={`ellipsis-${i}`} className="px-1 text-neutral-400 text-[11px]">…</span>
                      ) : (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setActivePage(p as number)}
                          className={cn(
                            "w-7 h-7 text-[11px] font-bold rounded-lg transition-colors",
                            activePage === p
                              ? "bg-indigo-500 text-white shadow-sm"
                              : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-indigo-300"
                          )}
                        >
                          {p}
                        </button>
                      )
                    )
                  }
                  <button
                    type="button"
                    disabled={activePage === activeTotalPages}
                    onClick={() => setActivePage(p => p + 1)}
                    className="px-3 py-1.5 text-[11px] font-semibold rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 disabled:opacity-40 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-colors bg-white dark:bg-neutral-900"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1 pb-4 scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-800">
            {groupedPersonalDebts.map((g) => {
              const isExpanded = expandedPerson === g.name;
              const personDebts = activePersonal.filter(
                d => d.counterpartyName.trim().toLowerCase() === g.name.toLowerCase()
              );

              return (
                <div key={g.name} className={cn(
                  "border-b border-neutral-100 dark:border-neutral-800/80 last:border-none",
                  isExpanded && "bg-neutral-50 dark:bg-neutral-900/40 rounded-lg border border-neutral-200 dark:border-neutral-700/60"
                )}>
                  {/* Header row */}
                  <button
                    type="button"
                    onClick={() => setExpandedPerson(isExpanded ? null : g.name)}
                    className="w-full flex items-center justify-between gap-4 py-3 px-2 text-left hover:bg-neutral-50 dark:hover:bg-neutral-900/40 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Simple monogram */}
                      <div className="w-8 h-8 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 font-semibold text-xs shrink-0">
                        {g.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{g.name}</p>
                        <p className="text-xs text-neutral-400 mt-0.5">{g.count} active debt{g.count > 1 ? "s" : ""}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className={cn(
                          "text-sm font-semibold font-mono tabular-nums",
                          g.net > 0 ? "text-emerald-600 dark:text-emerald-500" : g.net < 0 ? "text-rose-600 dark:text-rose-500" : "text-neutral-400"
                        )}>
                          {g.net >= 0 ? "+" : "−"}₹{Math.abs(g.net).toLocaleString('en-IN')}
                        </p>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          {g.net > 0 ? "they owe you" : g.net < 0 ? "you owe" : "settled"}
                        </p>
                      </div>
                      <ChevronDown size={14} className={cn("text-neutral-400 transition-transform", isExpanded && "rotate-180")} />
                    </div>
                  </button>

                  {/* Expanded debt list */}
                  {isExpanded && (
                    <div className="pb-3 px-2 space-y-0">
                      {personDebts.map((d, i) => {
                        const isOwe = d.direction === "I_OWE";
                        const progress = d.totalAmount > 0
                          ? Math.min(100, Math.round(((d.totalAmount - d.remainingAmount) / d.totalAmount) * 100))
                          : 0;
                        return (
                          <div key={d.id} className={cn(
                            "py-3 px-3 rounded-lg",
                            i % 2 === 0 ? "bg-white dark:bg-neutral-900" : "bg-neutral-50/50 dark:bg-neutral-800/30"
                          )}>
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className={cn(
                                    "inline-block w-1.5 h-1.5 rounded-full shrink-0",
                                    isOwe ? "bg-rose-500" : "bg-emerald-500"
                                  )} />
                                  <p className="text-[13px] font-medium text-neutral-900 dark:text-white truncate">{d.title}</p>
                                  <span className="text-[10px] text-neutral-400 border border-neutral-200 dark:border-neutral-700 rounded px-1.5 py-px shrink-0">
                                    {formatPersonalDebtCategory(d.category)}
                                  </span>
                                </div>

                                <div className="flex items-center gap-4 text-[11px] text-neutral-500 mb-2 ml-3.5">
                                  <span>{isOwe ? "You owe" : "Owes you"}</span>
                                  {d.startedAt && <span>Taken {new Date(d.startedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>}
                                  {d.dueDate && <span className="text-amber-600 dark:text-amber-500">Due {new Date(d.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>}
                                </div>

                                <div className="ml-3.5">
                                  <div className="h-1 w-32 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                    <div className={cn("h-full rounded-full", isOwe ? "bg-rose-400" : "bg-emerald-400")} style={{ width: `${progress}%` }} />
                                  </div>
                                  <p className="text-[10px] text-neutral-400 mt-1">₹{(d.totalAmount - d.remainingAmount).toLocaleString("en-IN")} of ₹{d.totalAmount.toLocaleString("en-IN")} paid</p>
                                </div>
                              </div>

                              <div className="shrink-0 text-right">
                                <p className={cn("text-sm font-semibold font-mono", isOwe ? "text-rose-600 dark:text-rose-500" : "text-emerald-600 dark:text-emerald-500")}>
                                  ₹{d.remainingAmount.toLocaleString("en-IN")}
                                </p>
                                <p className="text-[10px] text-neutral-400 mb-2">left</p>

                                <div className="flex items-center gap-1.5 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => { setPaymentDebtId(d.id); setPaymentAmount(String(d.remainingAmount)); setPaymentNotes(""); }}
                                    className="text-[11px] font-medium px-2.5 py-1 rounded border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors bg-white dark:bg-neutral-900"
                                  >
                                    Record Pay
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMarkSettled(d.id)}
                                    className="text-[11px] font-medium px-2.5 py-1 rounded border border-emerald-200 dark:border-emerald-700/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors bg-white dark:bg-neutral-900 flex items-center gap-1"
                                  >
                                    <Check size={10} /> Settle
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openActiveEditModal(d)}
                                    className="p-1.5 rounded border border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors bg-white dark:bg-neutral-900"
                                  >
                                    <Pencil size={11} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDebt(d.id)}
                                    className="p-1.5 rounded border border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:text-rose-500 hover:border-rose-300 transition-colors bg-white dark:bg-neutral-900"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {settledPersonal.length > 0 && (
          <div className="pt-6 mt-4 border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Settled History</h3>
                <p className="text-[11px] text-neutral-500">Your all-time completed debts.</p>
              </div>
              <div className="flex gap-4">
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400">Total Paid</p>
                  <p className="text-sm font-mono font-bold text-rose-500">₹{settledStats.totalPaidOut.toLocaleString('en-IN')}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400">Total Collected</p>
                  <p className="text-sm font-mono font-bold text-emerald-500">₹{settledStats.totalCollected.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
            
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={14} />
              <Input
                placeholder="Search by name or title..."
                value={settledSearchQuery}
                onChange={(e) => setSettledSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs w-full sm:w-64"
              />
            </div>
            
            <div className="space-y-2">
              {paginatedSettled.map((d) => {
                const isOwe = d.direction === "I_OWE";
                return (
                  <div
                    key={d.id}
                    onClick={() => openDetailModal(d)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-black/5 dark:border-white/5 transition-colors group cursor-pointer hover:border-neutral-200 dark:hover:border-neutral-700 hover:shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <Check size={14} strokeWidth={3} />
                        </div>
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-neutral-900 dark:text-white">
                          {isOwe ? (
                            <>You paid <span className="font-bold">{d.counterpartyName}</span></>
                          ) : (
                            <><span className="font-bold">{d.counterpartyName}</span> paid you</>
                          )}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-neutral-500">
                          <span>{d.title}</span>
                          <span>•</span>
                          <span>{new Date(d.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-3 sm:mt-0 pl-10 sm:pl-0">
                      <span className={cn("font-mono font-bold text-[15px]", isOwe ? "text-rose-500" : "text-emerald-500")}>
                        ₹{d.totalAmount.toLocaleString('en-IN')}
                      </span>
                      <ChevronRight size={14} className="text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-500 transition-colors" />
                    </div>
                  </div>
                );
              })}
              {filteredSettled.length === 0 && settledSearchQuery.trim() !== "" && (
                <p className="text-xs text-neutral-400 text-center py-4">No results found for &quot;{settledSearchQuery}&quot;.</p>
              )}
            </div>
            {/* Pagination */}
            {settledTotalPages > 1 && (
              <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  disabled={settledPage <= 1}
                  onClick={() => setSettledPage(p => p - 1)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ← Previous
                </button>
                <span className="text-[11px] text-neutral-400">
                  Page {settledPage} of {settledTotalPages} · {filteredSettled.length} records
                </span>
                <button
                  type="button"
                  disabled={settledPage >= settledTotalPages}
                  onClick={() => setSettledPage(p => p + 1)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
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
        <form onSubmit={handleCreateDebt} className="space-y-4">
          {/* Direction toggle — first decision */}
          <div className="flex bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-xl mb-2">
            <button
              type="button"
              onClick={() => setDebtForm((p) => ({ ...p, direction: "I_OWE" }))}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200",
                debtForm.direction === "I_OWE"
                  ? "bg-white dark:bg-neutral-900 shadow text-rose-500 dark:text-rose-400"
                  : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              )}
            >
              <TrendingDown size={15} /> I owe them
            </button>
            <button
              type="button"
              onClick={() => setDebtForm((p) => ({ ...p, direction: "OWED_TO_ME" }))}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200",
                debtForm.direction === "OWED_TO_ME"
                  ? "bg-white dark:bg-neutral-900 shadow text-emerald-500 dark:text-emerald-400"
                  : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              )}
            >
              <TrendingUp size={15} /> They owe me
            </button>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Title</FieldLabel>
            <Input
              required
              placeholder="e.g. Trip to Goa, HDFC Loan"
              value={debtForm.title}
              onChange={(e) => setDebtForm((p) => ({ ...p, title: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Who is this with?</FieldLabel>
            <Input
              required
              list="counterparties"
              placeholder="e.g. HDFC Bank, Mom, Rahul"
              value={debtForm.counterpartyName}
              onChange={(e) => setDebtForm((p) => ({ ...p, counterpartyName: e.target.value }))}
            />
            {uniqueCounterparties.length > 0 && (
              <datalist id="counterparties">
                {uniqueCounterparties.map(name => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <FieldLabel>Amount (₹)</FieldLabel>
              <Input
                required
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={debtForm.totalAmount}
                onChange={(e) => setDebtForm((p) => ({ ...p, totalAmount: e.target.value }))}
                className="font-mono font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Type</FieldLabel>
              <NativeSelect
                value={debtForm.category}
                onChange={(e) => setDebtForm((p) => ({ ...p, category: e.target.value }))}
              >
                {PERSONAL_DEBT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </NativeSelect>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <FieldLabel>Date taken</FieldLabel>
              <Input
                type="date"
                value={debtForm.startedAt}
                onChange={(e) => setDebtForm((p) => ({ ...p, startedAt: e.target.value }))}
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
              placeholder="EMI number, UPI ref, details..."
              value={debtForm.notes}
              onChange={(e) => setDebtForm((p) => ({ ...p, notes: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="cancel" onClick={() => { setShowAddDebt(false); setDebtForm(emptyDebtForm); }}>
              Cancel
            </Button>
            <Button type="submit" variant="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save debt"}
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

      {/* Active Debt Edit Modal */}
      <AppDialog
        open={!!activeEditDebtId}
        onOpenChange={(open) => { if (!open) setActiveEditDebtId(null); }}
        title="Edit Debt"
        maxWidth="max-w-md"
      >
        {activeEditDebt && (
          <div className="space-y-0">
            {/* Read-only context banner */}
            <div className={cn(
              "flex items-center gap-3 p-3 rounded-xl mb-4 text-xs font-medium",
              activeEditDebt.direction === "I_OWE"
                ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"
                : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            )}>
              {activeEditDebt.direction === "I_OWE" ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
              <span>
                {activeEditDebt.direction === "I_OWE" ? "You owe" : "Owed to you"} &nbsp;·&nbsp;
                <span className="font-mono font-bold">₹{activeEditDebt.remainingAmount.toLocaleString('en-IN')}</span> remaining
              </span>
            </div>

            <div className="space-y-4 mb-4">
              <div className="space-y-1.5">
                <FieldLabel>Title</FieldLabel>
                <Input
                  value={activeEditForm.title}
                  onChange={(e) => setActiveEditForm(p => ({ ...p, title: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>With</FieldLabel>
                <Input
                  list="counterparties"
                  value={activeEditForm.counterpartyName}
                  onChange={(e) => setActiveEditForm(p => ({ ...p, counterpartyName: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <FieldLabel>Date taken</FieldLabel>
                  <Input
                    type="date"
                    value={activeEditForm.startedAt}
                    onChange={(e) => setActiveEditForm(p => ({ ...p, startedAt: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>Due date</FieldLabel>
                  <Input
                    type="date"
                    value={activeEditForm.dueDate}
                    onChange={(e) => setActiveEditForm(p => ({ ...p, dueDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <FieldLabel>Notes</FieldLabel>
                <Input
                  value={activeEditForm.notes}
                  onChange={(e) => setActiveEditForm(p => ({ ...p, notes: e.target.value }))}
                />
              </div>
            </div>

            <p className="text-[11px] text-neutral-400 mb-4">Amount and direction cannot be changed after creation to protect payment history.</p>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="cancel" onClick={() => setActiveEditDebtId(null)}>Cancel</Button>
              <Button type="button" variant="submit" disabled={submitting} onClick={handleSaveActiveEdit}>
                {submitting ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>
        )}
      </AppDialog>

      {/* Debt Detail / Edit / Revoke Modal */}
      <AppDialog
        open={!!detailDebtId}
        onOpenChange={(open) => { if (!open) { setDetailDebtId(null); setEditMode(false); } }}
        title={editMode ? "Edit Debt" : "Debt Details"}
        maxWidth="max-w-lg"
      >
        {detailDebt && (
          <div className="space-y-5">
            {/* Header info */}
            {!editMode && (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-bold text-neutral-900 dark:text-white">{detailDebt.title}</p>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    {detailDebt.direction === "I_OWE" ? (
                      <>You paid <span className="font-semibold text-neutral-700 dark:text-neutral-200">{detailDebt.counterpartyName}</span></>
                    ) : (
                      <><span className="font-semibold text-neutral-700 dark:text-neutral-200">{detailDebt.counterpartyName}</span> paid you</>
                    )}
                  </p>
                  {detailDebt.dueDate && (
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Due: {new Date(detailDebt.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  )}
                  {detailDebt.notes && (
                    <p className="text-[11px] text-neutral-400 mt-0.5 italic">{detailDebt.notes}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className={cn("text-xl font-bold font-mono", detailDebt.direction === "I_OWE" ? "text-rose-500" : "text-emerald-500")}>
                    ₹{detailDebt.totalAmount.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">Settled</span>
                </div>
              </div>
            )}

            {/* Edit Form */}
            {editMode && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <FieldLabel>Title</FieldLabel>
                  <Input value={editForm.title} onChange={(e) => setEditForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>Person / Bank</FieldLabel>
                  <Input value={editForm.counterpartyName} onChange={(e) => setEditForm(p => ({ ...p, counterpartyName: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>Due Date (optional)</FieldLabel>
                  <Input type="date" value={editForm.dueDate} onChange={(e) => setEditForm(p => ({ ...p, dueDate: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>Notes (optional)</FieldLabel>
                  <Input placeholder="Any extra context..." value={editForm.notes} onChange={(e) => setEditForm(p => ({ ...p, notes: e.target.value }))} />
                </div>
              </div>
            )}

            {/* Payment History */}
            {!editMode && (
              <div>
                <p className="text-[11px] uppercase tracking-widest font-bold text-neutral-400 mb-2 flex items-center gap-1.5">
                  <Clock size={11} /> Payment Timeline
                </p>
                {detailLoading ? (
                  <p className="text-xs text-neutral-400 py-3 text-center">Loading...</p>
                ) : detailPayments.length === 0 ? (
                  <p className="text-xs text-neutral-400 py-3 text-center">No individual payment records found.<br />This debt was settled in one go.</p>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {detailPayments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-none">
                        <div>
                          <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                            ₹{p.amount.toLocaleString('en-IN')}
                          </p>
                          {p.notes && <p className="text-[11px] text-neutral-400">{p.notes}</p>}
                        </div>
                        <span className="text-[11px] text-neutral-400">
                          {new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              {!editMode ? (
                <>
                  <button
                    type="button"
                    onClick={handleRevokeSettlement}
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 rounded-md transition-colors disabled:opacity-50"
                  >
                    <RotateCcw size={12} />
                    Revoke &amp; Re-open
                  </button>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="unstyled" onClick={() => handleDeleteDebt(detailDebt.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-400 hover:text-rose-500 rounded-md transition-colors"
                    >
                      <Trash2 size={12} /> Delete
                    </Button>
                    <Button type="button" variant="unstyled"
                      onClick={() => setEditMode(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-md transition-colors"
                    >
                      <Pencil size={12} /> Edit
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 ml-auto">
                  <Button type="button" variant="cancel" onClick={() => setEditMode(false)}>Cancel</Button>
                  <Button type="button" variant="submit" disabled={submitting} onClick={handleUpdateDebt}>
                    {submitting ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </AppDialog>
    </div>
  );
}
