"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard, ArrowUpDown, PieChart, Target, Users, TrendingUp,
  Bell, Settings, ChevronRight, Menu, X, ArrowLeft, Sun, Moon,
  Sparkles, Shield, Zap, CreditCard, UserPlus, LogIn,
  BarChart2, AlertTriangle, CheckCircle2, Hash, BookOpen, HandCoins, Calendar,
} from "lucide-react";
import TallymateLogo from "@/components/TallymateLogo";

const sections = [
  { id: "getting-started", label: "Getting Started", icon: Sparkles },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "transactions", label: "Transactions", icon: ArrowUpDown },
  { id: "calendar", label: "Calendar View", icon: Calendar },
  { id: "import-rules", label: "Smart Imports", icon: Zap },
  { id: "budgets", label: "Budgets", icon: PieChart },
  { id: "goals", label: "Financial Goals", icon: Target },
  { id: "groups", label: "Groups & Bill Splitting", icon: Users },
  { id: "debts", label: "Debt Tracker", icon: HandCoins },
  { id: "reports", label: "Reports", icon: TrendingUp },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "security", label: "Security & Privacy", icon: Shield },
];

function SectionHeading({ id, icon: Icon, title, subtitle }: { id: string; icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <div id={id} className="scroll-mt-24 mb-8">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
          <Icon size={16} className="text-neutral-700 dark:text-neutral-300" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">{title}</h2>
      </div>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed ml-11">{subtitle}</p>
      <div className="mt-4 h-px bg-neutral-100 dark:bg-neutral-800" />
    </div>
  );
}

function Callout({ type = "info", children }: { type?: "info" | "tip" | "warning"; children: React.ReactNode }) {
  const styles = {
    info: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300",
    tip: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300",
    warning: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300",
  };
  const icons = { info: Zap, tip: CheckCircle2, warning: AlertTriangle };
  const Icon = icons[type];
  return (
    <div className={`flex gap-3 p-4 rounded-xl border text-sm leading-relaxed ${styles[type]} my-5`}>
      <Icon size={15} className="shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 my-5">
      <div className="w-7 h-7 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-black flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{n}</div>
      <div>
        <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 mb-1">{title}</p>
        <div className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function Badge({ children, color = "neutral" }: { children: React.ReactNode; color?: string }) {
  const c: Record<string, string> = {
    neutral: "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300",
    green: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400",
    blue: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400",
    red: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${c[color]}`}>{children}</span>;
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("getting-started");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActiveSection(e.target.id); });
      },
      { rootMargin: "-20% 0px -75% 0px" }
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fb] dark:bg-[#0c0c0e] text-neutral-900 dark:text-neutral-50">
      {/* Top nav */}
      <header className="h-14 sticky top-0 z-50 bg-white dark:bg-[#0f0f11] border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-5 gap-4">
        <div className="flex items-center gap-3">
          <button className="md:hidden p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800" onClick={() => setSidebarOpen(true)}>
            <Menu size={18} />
          </button>
          <Link href="/" className="flex items-center gap-2.5 group">
            <TallymateLogo size={26} className="text-neutral-900 dark:text-white" />
            <span className="font-bold text-sm tracking-tight">Tallymate</span>
          </Link>
          <ChevronRight size={14} className="text-neutral-400" />
          <span className="text-sm text-neutral-500 font-medium flex items-center gap-1.5">
            <BookOpen size={13} /> Documentation
          </span>
        </div>
        <div className="flex items-center gap-2">
          {mounted && (
            <button onClick={toggleDark} className="p-2 rounded-md border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition-colors">
              {dark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          )}
          <Link href="/login" className="px-4 py-1.5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-black text-xs font-bold hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors">
            Open App
          </Link>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Sidebar overlay on mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`fixed md:sticky top-14 z-50 md:z-auto inset-y-0 left-0 w-64 bg-white dark:bg-[#0f0f11] border-r border-neutral-200 dark:border-neutral-800 flex flex-col p-4 overflow-y-auto h-[calc(100vh-3.5rem)] transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
          <div className="flex items-center justify-between mb-4 md:hidden">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Contents</span>
            <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"><X size={15} /></button>
          </div>
          <p className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 mb-2 hidden md:block">Contents</p>
          <nav className="space-y-0.5">
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === s.id ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 font-semibold" : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-800 dark:hover:text-neutral-200"}`}
                >
                  <Icon size={14} className="shrink-0" />
                  {s.label}
                </a>
              );
            })}
          </nav>
          <div className="mt-auto pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <Link href="/" className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors">
              <ArrowLeft size={12} /> Back to Home
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 px-6 md:px-12 py-10 max-w-3xl">

          {/* Hero */}
          <div className="mb-14">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white dark:bg-[#141416] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm">
                <TallymateLogo size={32} className="text-neutral-900 dark:text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white mb-2">Help Center</h1>
                <p className="text-base text-neutral-500 dark:text-neutral-400">Easy guides to help you use Tallymate and master your money.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
              {[
                { label: "Track Spending", icon: CreditCard, color: "green" },
                { label: "Split Bills", icon: Users, color: "blue" },
                { label: "Set Budgets", icon: PieChart, color: "neutral" },
              ].map((f) => (
                <div key={f.label} className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141416] flex items-center gap-2.5">
                  <f.icon size={16} className="text-neutral-600 dark:text-neutral-400 shrink-0" />
                  <span className="text-sm font-medium">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── GETTING STARTED ── */}
          <SectionHeading id="getting-started" icon={Sparkles} title="Getting Started" subtitle="Everything you need to create your account and start your financial journey in under 2 minutes." />

          <h3 className="font-semibold text-base mb-3 text-neutral-800 dark:text-neutral-200">Create an Account</h3>
          <Step n={1} title="Go to the Login page">Visit <Link href="/login" className="text-blue-600 dark:text-blue-400 underline underline-offset-2">/login</Link> and click the <Badge>Sign Up</Badge> tab at the top of the form.</Step>
          <Step n={2} title="Enter your details">Fill in your <strong>Full Name</strong>, <strong>Email Address</strong>, and a secure <strong>Password</strong>. Your password should be at least 8 characters.</Step>
          <Step n={3} title="Launch your Dashboard">After signing up, you are automatically redirected to your personal dashboard. Your data is now securely stored in the cloud.</Step>

          <Callout type="tip">
            <strong>Just exploring?</strong> You can create a normal account and start using the dashboard immediately.
          </Callout>

          <h3 className="font-semibold text-base mb-3 mt-8 text-neutral-800 dark:text-neutral-200">First Steps After Signing Up</h3>
          <Step n={1} title="Set up your Accounts">Go to <strong>Transactions → Add Transaction</strong> and select or create your first financial account (Bank Account, Cash, Credit Card, or UPI Wallet).</Step>
          <Step n={2} title="Add your first transaction">Record an income or expense to start building your financial picture. Every transaction is tied to a category and account.</Step>
          <Step n={3} title="Create a budget">Head to the <strong>Budgets</strong> section and set a monthly spending limit for your biggest expense categories like Food, Transport, or Shopping.</Step>

          {/* ── DASHBOARD ── */}
          <div className="mt-14">
            <SectionHeading id="dashboard" icon={LayoutDashboard} title="Dashboard" subtitle="Your financial command centre. Everything important, at a glance." />
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-5">Your Dashboard is your home screen. It gives you a quick summary of your money so you don't have to search around for answers.</p>
            <div className="space-y-4">
              {[
                { label: "Net Worth", desc: "The sum of all your accounts (bank balances, cash, wallets) minus credit card balances. This is your single most important number." },
                { label: "Monthly Income vs Expenses", desc: "A side-by-side summary of how much you earned vs. how much you spent this calendar month." },
                { label: "Recent Transactions", desc: "The last 5 transactions you recorded, so you can quickly spot anything unusual." },
                { label: "Budget Alerts", desc: "Any active budgets where you have spent more than 80% of your limit are highlighted here automatically." },
                { label: "Goal Progress", desc: "A quick summary of your active savings goals and how close you are to each milestone." },
              ].map((item) => (
                <div key={item.label} className="flex gap-3 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-[#141416]">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{item.label}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── TRANSACTIONS ── */}
          <div className="mt-14">
            <SectionHeading id="transactions" icon={ArrowUpDown} title="Transactions" subtitle="Record every rupee that comes in or goes out — income and expenses in one list." />
            <h3 className="font-semibold text-base mb-3 text-neutral-800 dark:text-neutral-200">Adding a Transaction</h3>
            <Step n={1} title='Click "Add Transaction"'>The button is always visible at the top of the Transactions page.</Step>
            <Step n={2} title="Fill in the details">
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li><strong>Type:</strong> Income or Expense</li>
                <li><strong>Amount:</strong> The value in your local currency</li>
                <li><strong>Category:</strong> Choose from defaults or your custom categories (set in Settings)</li>
                <li><strong>Account:</strong> Which wallet/account this money came from or went to</li>
                <li><strong>Date:</strong> Defaults to today, but you can back-date entries</li>
                <li><strong>Note:</strong> Optional description for your reference</li>
              </ul>
            </Step>
            <Step n={3} title="Save it">The transaction instantly appears in your list and updates your Dashboard totals and budget tracking.</Step>
            <Callout type="info">
              <strong>Custom Categories:</strong> The default categories (Food, Transport, Health, etc.) cover most cases. Go to <strong>Settings → Custom Categories</strong> to create your own tags in any color.
            </Callout>
          </div>

          {/* ── CALENDAR ── */}
          <div className="mt-14">
            <SectionHeading id="calendar" icon={Calendar} title="Calendar View" subtitle="Because sometimes looking at a list of numbers just doesn't cut it." />
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-5">
              Ever wonder exactly which days of the month you spend the most? Or when all your subscriptions hit? 
              The <strong>Calendar</strong> page gives you a literal birds-eye view of your month. It’s honestly the best way to spot patterns you’d otherwise miss.
            </p>
            <Step n={1} title="See the big picture">Open the Calendar from the sidebar. You'll instantly see green numbers (money in) and red numbers (money out) mapped to every day of the month.</Step>
            <Step n={2} title="Click a day to drill down">If you see a random Tuesday where you spent ₹5,000, just click on that day. A sidebar slides out showing you exactly where every rupee went.</Step>
            <Step n={3} title="Plan your cashflow">It's a great tool to mentally prepare for the rest of the month. If the first two weeks look heavy on the red, you know you need to chill for the last two weeks.</Step>
          </div>

          {/* ── SMART IMPORTS ── */}
          <div className="mt-14">
            <SectionHeading id="import-rules" icon={Zap} title="Smart CSV Imports & Rules" subtitle="Stop typing out every single transaction manually. Let the robots do the heavy lifting." />
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-5">
              Let's be real—manually entering every Swiggy order or Uber ride gets old fast. 
              Tallymate has a seriously powerful CSV importer that actually understands Indian bank statements.
            </p>
            
            <h3 className="font-semibold text-base mb-3 text-neutral-800 dark:text-neutral-200">The Magic Parser</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
              When you upload a bank statement, you usually get garbage descriptions like <code>UPI/DR/609171394895/ZOMATO /BKID/atharv1132/UPI</code>. 
              Our parser is smart enough to strip away all that banking jargon (UPI, NEFT, IMPS, reference numbers) and just give you the clean name: <strong>Zomato</strong>.
            </p>

            <h3 className="font-semibold text-base mb-3 mt-8 text-neutral-800 dark:text-neutral-200">Import Rules (Automating your life)</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-5">
              Want Tallymate to automatically know that "Zomato" means Food? That's what Import Rules are for.
            </p>
            <Step n={1} title="Create a Rule">Go to <strong>Import Rules</strong> in the sidebar. Click New Rule.</Step>
            <Step n={2} title="Tell it what to look for">Set a keyword like "Swiggy", "Zomato", or "Blinkit".</Step>
            <Step n={3} title="Tell it what to do">Set the category to "Food & Dining". Now, every single time you upload a CSV, any transaction matching that keyword is instantly categorized. Zero manual effort.</Step>
            
            <Callout type="tip">
              <strong>Internal Transfers:</strong> When you transfer money between your own accounts (like from HDFC to SBI), you don't want it counted as an "Expense". 
              When importing, just type keywords like "self" or "transfer" into the Internal Transfers box, and we'll ignore them so they don't mess up your budgets!
            </Callout>
          </div>

          {/* ── BUDGETS ── */}
          <div className="mt-14">
            <SectionHeading id="budgets" icon={PieChart} title="Budgets" subtitle="Set monthly limits per category and get alerted before you overspend." />
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-5">Budgets help you stop overspending. Just set a limit for things like &quot;Food&quot; or &quot;Shopping&quot;, and Tallymate will warn you before you run out of money.</p>
            <h3 className="font-semibold text-base mb-3 text-neutral-800 dark:text-neutral-200">Creating a Budget</h3>
            <Step n={1} title="Go to Budgets">Click Budgets in the left sidebar.</Step>
            <Step n={2} title="Click New Budget">Fill in the Category (e.g., Food), your monthly Limit (e.g., ₹8,000), and an optional alert threshold (default is 80%).</Step>
            <Step n={3} title="Track your progress">Tallymate automatically scans your transactions every time you add one and updates the budget progress bar. No manual input needed.</Step>
            <div className="grid grid-cols-3 gap-3 my-5">
              {[{ label: "Under 80%", color: "green", status: "On Track" }, { label: "80–99%", color: "neutral", status: "Warning" }, { label: "100%+", color: "red", status: "Exceeded" }].map((b) => (
                <div key={b.label} className="p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-[#141416] text-center">
                  <Badge color={b.color}>{b.status}</Badge>
                  <p className="text-xs text-neutral-400 mt-1.5">{b.label}</p>
                </div>
              ))}
            </div>
            <Callout type="warning">
              You will receive an in-app notification automatically when a budget crosses your alert threshold (default: 80%) and again when it is fully exceeded.
            </Callout>
          </div>

          {/* ── GOALS ── */}
          <div className="mt-14">
            <SectionHeading id="goals" icon={Target} title="Financial Goals" subtitle="Plan for what matters. Track progress toward your savings milestones." />
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-5">Goals let you visualize saving toward a specific target — a new phone, an emergency fund, a vacation, or a down payment. You decide how much to save and by when.</p>
            <h3 className="font-semibold text-base mb-3 text-neutral-800 dark:text-neutral-200">Creating a Goal</h3>
            <Step n={1} title="Go to Goals and click New Goal">Give your goal a name and target amount (e.g., &quot;Emergency Fund – ₹1,00,000&quot;).</Step>
            <Step n={2} title="Set a target date (optional)">If you have a deadline (like a trip), add it. Tallymate will show you if you are on track to meet it.</Step>
            <Step n={3} title="Add contributions">Manually log each time you set money aside for this goal. The progress bar updates instantly.</Step>
          </div>

          {/* ── GROUPS ── */}
          <div className="mt-14">
            <SectionHeading id="groups" icon={Users} title="Split Bills with Friends" subtitle="Easily split dinner bills, rent, or travel costs with your friends. Tallymate calculates who owes who." />
            <h3 className="font-semibold text-base mb-3 text-neutral-800 dark:text-neutral-200">Creating a Group</h3>
            <Step n={1} title="Go to Groups and click New Group">Give it a name (e.g., &quot;Goa Trip 2026&quot; or &quot;Flat mates&quot;) and select a currency.</Step>
            <Step n={2} title="Share your Invite Code">Every group gets a unique invite code. Share it with your friends so they can join the group.</Step>
            <Step n={3} title="Join a Group">If someone shares a code with you, click the <Badge>Join Group</Badge> button on the Groups page, enter the code, and you are in.</Step>

            <Callout type="tip">
              Your group&apos;s invite code is always visible on the group detail page under the <strong>Invite Members</strong> section. You can share it via chat, email, or copy it directly.
            </Callout>

            <h3 className="font-semibold text-base mb-3 mt-8 text-neutral-800 dark:text-neutral-200">Adding a Group Expense</h3>
            <Step n={1} title="Open the Group and click Add Expense">Enter a description (e.g., &quot;Hotel booking&quot;) and the total amount.</Step>
            <Step n={2} title="Choose how to split">
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li><Badge color="blue">Equally</Badge> — Divided equally among all members</li>
                <li><Badge color="green">By Percentage</Badge> — Each member pays a custom percentage</li>
                <li><Badge color="neutral">Exact Amounts</Badge> — You specify each person&apos;s exact share</li>
              </ul>
            </Step>
            <Step n={3} title="Record who paid">Select the member who paid upfront. Tallymate automatically calculates who owes who.</Step>

            <h3 className="font-semibold text-base mb-3 mt-8 text-neutral-800 dark:text-neutral-200">Settling Up</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">Tallymate does the math for you. It figures out the easiest way for everyone to pay each other back. For example, if A owes B, and B owes C, Tallymate might just tell A to pay C directly! Open <strong>Who owes what</strong> in your group and tap <strong>Mark as paid</strong> when you send or receive money.</p>
          </div>

          {/* ── DEBTS ── */}
          <div className="mt-14">
            <SectionHeading id="debts" icon={HandCoins} title="Debt Tracker" subtitle="See what you owe and what others owe you across all your groups." />
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-5">The <strong>Debts</strong> page adds up everything from all your groups. It gives you one simple list showing who you owe, and who owes you money — without having to check each group one by one.</p>
            <Step n={1} title="Open Debts from the sidebar">See your total position at the top: you owe, you&apos;re owed, and net balance.</Step>
            <Step n={2} title="Review suggested payments">Payments you can make or confirm appear under <strong>Payments you can make</strong>. Tap <strong>Settle</strong> to jump to the right group.</Step>
            <Step n={3} title="Check balances by person or group">Use <strong>By person</strong> and <strong>By group</strong> to understand who you share debts with and where they come from.</Step>

            <h3 className="font-semibold text-base mb-3 mt-8 text-neutral-800 dark:text-neutral-200">Loans &amp; other debts</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">Not everything is a group split. Use <strong>Add loan / debt</strong> on the Debts page to track bank loans, credit cards, EMIs, or money you lent to or borrowed from friends. Record payments as you go — totals update automatically and combine with your group balances.</p>
          </div>

          {/* ── REPORTS ── */}
          <div className="mt-14">
            <SectionHeading id="reports" icon={TrendingUp} title="Reports" subtitle="Visualize your spending patterns and financial trends over time." />
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-5">The Reports section turns your raw transaction data into meaningful charts and summaries. Switch between <strong>Monthly</strong>, <strong>Quarterly</strong>, and <strong>Annual</strong> views to understand your patterns.</p>
            <div className="space-y-3">
              {[
                { label: "Spending by Category", desc: "A breakdown of where your money went — Food, Transport, Entertainment, etc." },
                { label: "Income vs Expenses Trend", desc: "A month-by-month line or bar chart showing your cash flow over time." },
                { label: "Net Worth Growth", desc: "How your total assets minus liabilities has changed over the selected period." },
              ].map((r) => (
                <div key={r.label} className="flex gap-3 items-start p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-[#141416]">
                  <BarChart2 size={15} className="text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{r.label}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── NOTIFICATIONS ── */}
          <div className="mt-14">
            <SectionHeading id="notifications" icon={Bell} title="Notifications" subtitle="Stay informed. Tallymate proactively alerts you so nothing slips through the cracks." />
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">You will receive notifications for these events automatically:</p>
            <ul className="space-y-2.5">
              {[
                "A budget reaches 80% or 100% of its limit",
                "Someone adds you to a new group",
                "A new expense is recorded in a group you belong to",
                "A group member settles a balance with you",
                "A recurring transaction is due (if configured)",
              ].map((n) => (
                <li key={n} className="flex items-start gap-2.5 text-sm text-neutral-600 dark:text-neutral-400">
                  <Bell size={13} className="text-neutral-400 shrink-0 mt-1" />
                  {n}
                </li>
              ))}
            </ul>
            <Callout type="info">
              Unread notifications show a badge count on the Bell icon in your top navigation bar. Click it to see all notifications and mark them as read.
            </Callout>
          </div>

          {/* ── SETTINGS ── */}
          <div className="mt-14">
            <SectionHeading id="settings" icon={Settings} title="Settings" subtitle="Customize Tallymate to work exactly the way you think about money." />
            <div className="space-y-4">
              {[
                { icon: Hash, label: "Custom Categories", desc: "Create your own expense categories with a unique color tag. Use these anywhere you'd use a default category." },
                { icon: TrendingUp, label: "Income Sources", desc: "Add your custom income streams (e.g., Freelancing, Rental Income, Dividends) so your income transactions are properly categorized." },
                { icon: LogIn, label: "Account Profile", desc: "View your registered email address and display name. Your profile is synced with your authentication account." },
              ].map((s) => (
                <div key={s.label} className="flex gap-3 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-[#141416]">
                  <s.icon size={15} className="text-neutral-500 dark:text-neutral-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{s.label}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── SECURITY ── */}
          <div className="mt-14 mb-20">
            <SectionHeading id="security" icon={Shield} title="Security & Privacy" subtitle="Your money is your business. We keep it safe." />
            <div className="space-y-4">
              {[
                { label: "Secure Authentication", desc: "Tallymate uses Better Auth, an industry-standard authentication framework. Your password is hashed and never stored in plain text." },
                { label: "Cloud-backed Database", desc: "Your data is stored in a PostgreSQL database hosted on Supabase, which provides enterprise-grade infrastructure with automatic backups." },
                { label: "Session Management", desc: "Each login creates a unique, time-limited session token. Logging out invalidates the token immediately. You can log in from multiple devices." },
                { label: "Server-side Logic Only", desc: "Your financial data is never processed in the browser. All reads and writes go through secure Next.js server actions that verify your identity before every operation." },
                { label: "No Third-party Data Sharing", desc: "Tallymate does not sell, share, or transmit your personal financial data to any third party. You own your data." },
              ].map((s) => (
                <div key={s.label} className="flex gap-3 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-[#141416]">
                  <Shield size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{s.label}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141416] text-center">
              <TallymateLogo size={36} className="text-neutral-900 dark:text-white mx-auto mb-3" />
              <h3 className="font-bold text-base mb-1">Ready to start?</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Your financial clarity is one click away.</p>
              <Link href="/login" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-black text-sm font-bold hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors">
                <UserPlus size={14} /> Create your account
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
