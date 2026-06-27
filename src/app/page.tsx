import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tallymate - Smart Personal Finance & Bill Splitting App",
  description: "Take control of your money with Tallymate. The best app to track personal expenses, set smart monthly budgets, and split bills fairly with friends.",
  openGraph: {
    title: "Tallymate - Smart Personal Finance & Bill Splitting App",
    description: "Take control of your money with Tallymate. The best app to track personal expenses, set smart monthly budgets, and split bills fairly with friends.",
    url: "https://tallymate.alltracker.online/",
  },
  alternates: {
    canonical: "https://tallymate.alltracker.online/",
  },
};
import Link from "next/link";
import { ArrowRight, Shield, Sparkles, TrendingUp, Users, CheckCircle2, Target, PieChart, Bell, BookOpen, ChevronDown } from "lucide-react";
import LandingThemeToggle from "@/components/LandingThemeToggle";
import TallymateLogo from "@/components/TallymateLogo";
import AnimatedLetters from "@/components/AnimatedLetters";
import ScrollFadeIn from "@/components/ScrollFadeIn";
import SplitBillDemo from "@/components/landing/SplitBillDemo";
import FAQAccordion from "@/components/landing/FAQAccordion";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export default async function Home() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#09090b] text-[#09090b] dark:text-[#fafafa] selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-black">
      {/* Navbar */}
      <nav className="h-14 border-b border-transparent bg-transparent flex items-center justify-between px-6 md:px-12 absolute top-0 w-full z-50">
        <div className="flex items-center gap-2.5">
          <TallymateLogo size={26} className="text-neutral-900 dark:text-white" />
          <span className="font-bold text-sm tracking-tight">Tallymate</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-1 p-1 rounded-full border border-neutral-200/80 dark:border-neutral-800/50 bg-white/80 dark:bg-[#141416]/50 backdrop-blur-md shadow-sm">
            <Link href="#features" className="px-4 py-1.5 rounded-full text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all">Features</Link>
            <Link href="#methodology" className="px-4 py-1.5 rounded-full text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all">Methodology</Link>
            <Link href="#security" className="px-4 py-1.5 rounded-full text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all">Security</Link>
            <Link href="/docs" className="px-4 py-1.5 rounded-full text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all">Docs</Link>
          </div>
          <div className="flex items-center gap-2">
            <LandingThemeToggle />
            <Link
              href="/login"
              className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 rounded-full bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-xs font-bold transition-all shadow-md"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center pt-28 md:pt-32 pb-16 md:pb-20 px-5 md:px-12 relative overflow-hidden">
        {/* Background Grid & Glows - Removed grid entirely in light mode for a pristine look */}
        <div className="absolute inset-0 hidden dark:block dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] hidden dark:block dark:bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative flex flex-col items-center w-full max-w-4xl mt-4 mb-8">
          {/* Clean Badge */}
          <div className="relative group cursor-pointer mb-8">
            <div className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-200/60 dark:border-white/10 bg-white dark:bg-[#09090b] text-xs font-medium text-neutral-600 dark:text-neutral-300 z-10 shadow-sm transition-all hover:bg-neutral-50 dark:hover:bg-neutral-900">
              <Sparkles size={14} className="text-emerald-500" />
              <span>Introducing Tallymate 1.0</span>
              <span className="w-[1px] h-3 bg-neutral-200 dark:bg-white/20 mx-1"></span>
              <span className="text-emerald-500 dark:text-emerald-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors flex items-center gap-1">
                Read the launch post <ArrowRight size={12} />
              </span>
            </div>
          </div>

          {/* Ultra-modern clean title */}
          <h1
            className="font-extrabold tracking-tight text-center text-neutral-900 dark:text-white z-10 w-full flex flex-col items-center leading-[1.05]"
            style={{ fontSize: "clamp(3rem, 10vw, 120px)" }}
          >
            <span className="md:whitespace-nowrap inline-block animate-in fade-in slide-in-from-bottom-8 duration-1000">
              Master your money.
            </span>
            <span className="relative inline-block mt-1 md:mt-2 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both pb-2">
              <span className="bg-gradient-to-br from-emerald-500 via-teal-400 to-cyan-500 bg-clip-text text-transparent drop-shadow-sm">
                Together.
              </span>
            </span>
          </h1>
        </div>

        <p className="text-lg md:text-[21px] text-neutral-600 dark:text-neutral-400 max-w-2xl text-center leading-[1.6] font-medium z-10 text-balance animate-in fade-in duration-1000 delay-1000 fill-mode-both">
          Track spending, split bills with friends, and stay on budget — all in one simple app.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row gap-4 items-center justify-center z-10 animate-in fade-in duration-1000 delay-[1200ms] fill-mode-both">
          <Link
            href={session ? "/dashboard" : "/login"}
            className="group flex items-center gap-2 px-8 py-3.5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-black font-bold text-[15px] transition-all shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] dark:shadow-[0_4px_14px_0_rgb(255,255,255,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_6px_20px_rgba(255,255,255,0.15)] hover:-translate-y-0.5"
          >
            Launch Dashboard
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/docs"
            className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-white dark:bg-[#0c0c0e] border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 font-bold text-[15px] transition-all text-neutral-700 dark:text-neutral-300 shadow-sm hover:shadow-md"
          >
            <BookOpen size={16} className="text-neutral-500" />
            View Documentation
          </Link>
        </div>



        {/* Mobile social proof strip — shows only on mobile where mockup is hidden */}
        <div className="md:hidden mt-12 w-full max-w-sm grid grid-cols-3 gap-3 z-10">
          {[
            { label: "Accounts", value: "All-in-one", color: "bg-emerald-500" },
            { label: "Split Bills", value: "Instant", color: "bg-blue-500" },
            { label: "Budgets", value: "Proactive", color: "bg-violet-500" },
          ].map((s) => (
            <div key={s.label} className="panel-card p-3 text-center border border-black/[0.06] dark:border-neutral-800 bg-white dark:bg-[#111113]">
              <div className={`w-6 h-1.5 rounded-full ${s.color} mx-auto mb-2`} />
              <p className="text-[10px] font-bold text-neutral-900 dark:text-white">{s.value}</p>
              <p className="text-[9px] text-neutral-500 uppercase tracking-wider font-mono mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Rich Dashboard Preview Mockup — hidden on mobile to prevent compression */}
        <div className="hidden md:block animate-float mt-20 w-full max-w-5xl rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 bg-white/80 dark:bg-[#0f0f11]/80 backdrop-blur-xl shadow-[0_0_80px_-20px_rgba(16,185,129,0.15)] dark:shadow-[0_0_80px_-20px_rgba(16,185,129,0.1)] relative z-10 overflow-hidden ring-1 ring-neutral-900/5 dark:ring-white/10 transition-all hover:shadow-[0_0_100px_-20px_rgba(16,185,129,0.25)]">
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141416]">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="flex-1 mx-3">
              <div className="h-5 rounded-md bg-neutral-200 dark:bg-neutral-800 w-48 mx-auto" />
            </div>
          </div>

          {/* App shell */}
          <div className="flex h-[340px]">
            {/* Sidebar */}
            <div className="w-40 border-r border-neutral-100 dark:border-neutral-800 bg-white dark:bg-[#0f0f11] p-3 flex flex-col gap-1 shrink-0">
              <div className="flex items-center gap-2 px-2 py-2 mb-2">
                <div className="w-5 h-5 rounded bg-neutral-900 dark:bg-white" />
                <div className="h-3 w-16 bg-neutral-300 dark:bg-neutral-700 rounded" />
              </div>
              {[{ color: "bg-neutral-900 dark:bg-white", w: "w-20", active: true }, { color: "bg-neutral-300 dark:bg-neutral-700", w: "w-24" }, { color: "bg-neutral-300 dark:bg-neutral-700", w: "w-16" }, { color: "bg-neutral-300 dark:bg-neutral-700", w: "w-20" }, { color: "bg-neutral-300 dark:bg-neutral-700", w: "w-14" }].map((item, i) => (
                <div key={i} className={`flex items-center gap-2 px-2 py-1.5 rounded-md ${item.active ? "bg-neutral-100 dark:bg-neutral-800" : ""}`}>
                  <div className={`w-3 h-3 rounded-sm ${item.color}`} />
                  <div className={`h-2 ${item.w} ${item.color} rounded`} />
                </div>
              ))}
            </div>

            {/* Main content */}
            <div className="flex-1 p-4 space-y-3 bg-[#f8f9fb] dark:bg-[#0c0c0e] overflow-hidden">
              {/* Stat cards row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white dark:bg-[#141416] rounded-xl p-3 border border-neutral-100 dark:border-neutral-800">
                  <div className="h-2 w-16 bg-neutral-200 dark:bg-neutral-700 rounded mb-2" />
                  <div className="h-5 w-20 bg-emerald-500 rounded mb-1" />
                  <div className="h-1.5 w-10 bg-neutral-200 dark:bg-neutral-700 rounded" />
                </div>
                <div className="bg-white dark:bg-[#141416] rounded-xl p-3 border border-neutral-100 dark:border-neutral-800">
                  <div className="h-2 w-14 bg-neutral-200 dark:bg-neutral-700 rounded mb-2" />
                  <div className="h-5 w-16 bg-rose-400 rounded mb-1" />
                  <div className="h-1.5 w-12 bg-neutral-200 dark:bg-neutral-700 rounded" />
                </div>
                <div className="bg-white dark:bg-[#141416] rounded-xl p-3 border border-neutral-100 dark:border-neutral-800">
                  <div className="h-2 w-12 bg-neutral-200 dark:bg-neutral-700 rounded mb-2" />
                  <div className="h-5 w-14 bg-blue-500 rounded mb-1" />
                  <div className="h-1.5 w-10 bg-neutral-200 dark:bg-neutral-700 rounded" />
                </div>
              </div>

              {/* Chart + list row */}
              <div className="grid grid-cols-5 gap-3">
                {/* Mini bar chart */}
                <div className="col-span-3 bg-white dark:bg-[#141416] rounded-xl p-3 border border-neutral-100 dark:border-neutral-800">
                  <div className="h-2 w-20 bg-neutral-200 dark:bg-neutral-700 rounded mb-3" />
                  <div className="flex items-end gap-1.5 h-16">
                    {[40, 65, 45, 80, 55, 90, 70, 60, 85, 50, 75, 95].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, backgroundColor: i === 11 ? '#10b981' : i % 3 === 0 ? '#6366f1' : '#e2e8f0' }} />
                    ))}
                  </div>
                </div>
                {/* Transaction list */}
                <div className="col-span-2 bg-white dark:bg-[#141416] rounded-xl p-3 border border-neutral-100 dark:border-neutral-800 space-y-2">
                  <div className="h-2 w-20 bg-neutral-200 dark:bg-neutral-700 rounded mb-1" />
                  {[{ c: 'bg-emerald-400', w: 'w-10' }, { c: 'bg-rose-400', w: 'w-12' }, { c: 'bg-blue-400', w: 'w-8' }].map((t, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-4 h-4 rounded-full ${t.c}`} />
                        <div className="h-1.5 w-14 bg-neutral-200 dark:bg-neutral-700 rounded" />
                      </div>
                      <div className={`h-1.5 ${t.w} ${t.c} rounded`} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Budget progress */}
              <div className="bg-white dark:bg-[#141416] rounded-xl p-3 border border-neutral-100 dark:border-neutral-800">
                <div className="h-2 w-16 bg-neutral-200 dark:bg-neutral-700 rounded mb-2" />
                <div className="grid grid-cols-3 gap-3">
                  {[{ w: '75%', c: 'bg-emerald-500' }, { w: '50%', c: 'bg-amber-500' }, { w: '90%', c: 'bg-rose-500' }].map((b, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between">
                        <div className="h-1.5 w-12 bg-neutral-200 dark:bg-neutral-700 rounded" />
                        <div className="h-1.5 w-6 bg-neutral-200 dark:bg-neutral-700 rounded" />
                      </div>
                      <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded overflow-hidden">
                        <div className={`h-full ${b.c} rounded`} style={{ width: b.w }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Fade gradient at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white dark:from-[#0f0f11] to-transparent" />
        </div>
      </main>

      <ScrollFadeIn delay={200}>
        <section id="features" className="py-32 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="max-w-2xl mb-16 space-y-5">
          <div className="w-12 h-1 bg-emerald-500 rounded-full" />
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-balance text-neutral-900 dark:text-white">
            Built for modern financial clarity.
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 text-lg md:text-xl leading-relaxed text-balance">
            Stop switching between banking apps, spreadsheets, and bill-splitting apps. Keep your money in one clear view.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Feature 1 - Spans 2 columns */}
          <div className="md:col-span-2 animate-float p-8 rounded-[2rem] border border-black/[0.03] dark:border-white/5 bg-white/70 dark:bg-[#111113] backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-8 border border-emerald-100 dark:border-emerald-500/20">
                <TrendingUp size={22} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-bold text-2xl mb-3 tracking-tight">All your accounts</h3>
              <p className="text-neutral-600 dark:text-neutral-400 text-lg leading-relaxed text-balance">
                Track cash, bank accounts, cards, and UPI wallets together. See your real balance at a glance.
              </p>
            </div>
          </div>

          {/* Feature 2 - Spans 2 columns */}
          <div className="md:col-span-2 animate-float-delayed p-8 rounded-[2rem] border border-black/[0.03] dark:border-white/5 bg-white/70 dark:bg-[#111113] backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-8 border border-blue-100 dark:border-blue-500/20">
                <Users size={22} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-bold text-2xl mb-3 tracking-tight">Shared groups</h3>
              <p className="text-neutral-600 dark:text-neutral-400 text-lg leading-relaxed text-balance">
                Create groups for trips, roommates, or couples. Split bills equally, by percentage, or exact amounts — then settle up with the fewest payments.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="md:col-span-1 animate-float p-8 rounded-[2rem] border border-black/[0.03] dark:border-white/5 bg-white/70 dark:bg-[#111113] backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-6">
              <PieChart size={20} className="text-neutral-900 dark:text-white" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Proactive Budgets</h3>
            <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed text-balance">
              Set group budgets. Get alerts when you hit 80% capacity before you overspend.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="md:col-span-1 animate-float-delayed p-8 rounded-[2rem] border border-black/[0.03] dark:border-white/5 bg-white/70 dark:bg-[#111113] backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-6">
              <Target size={20} className="text-neutral-900 dark:text-white" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Financial Goals</h3>
            <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed text-balance">
              Plan for a vacation or car. Track savings progress with visual milestones.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="md:col-span-1 animate-float p-8 rounded-[2rem] border border-black/[0.03] dark:border-white/5 bg-white/70 dark:bg-[#111113] backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-6">
              <Bell size={20} className="text-neutral-900 dark:text-white" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Real-time Sync</h3>
            <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed text-balance">
              Get pinged instantly when someone records an expense involving you.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="md:col-span-1 animate-float-delayed p-8 rounded-[2rem] border border-black/[0.03] dark:border-white/5 bg-white/70 dark:bg-[#111113] backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-6">
              <Shield size={20} className="text-neutral-900 dark:text-white" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Enterprise Security</h3>
            <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed text-balance">
              Bank-level encryption and a clear history of every change you make.
            </p>
          </div>
        </div>
      </section>
      </ScrollFadeIn>

      <ScrollFadeIn delay={200}>
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto w-full border-t border-black/[0.06] dark:border-neutral-800">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">See it in action.</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-lg">
            Money awkwardness is a thing of the past. Adjust the bill below to see how Tallymate automatically splits and balances your accounts.
          </p>
        </div>
        <SplitBillDemo />
      </section>
      </ScrollFadeIn>

      <ScrollFadeIn delay={200}>
      {/* Methodology Section */}
      <section id="methodology" className="py-24 px-6 md:px-12 max-w-7xl mx-auto w-full border-t border-black/[0.06] dark:border-neutral-800">
        <div className="flex flex-col md:flex-row gap-16 items-center">
          <div className="flex-1 space-y-6">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-neutral-900 dark:text-white">
              The Tallymate Methodology
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-lg leading-relaxed">
              We believe personal finance shouldn&apos;t feel like accounting. Tallymate is built around three core principles designed to reduce friction and build wealth passively.
            </p>
            <div className="space-y-6 mt-8">
              {[
                { title: "1. Complete Visibility", desc: "You cannot optimize what you cannot see. By unifying all accounts in one dashboard, you eliminate financial blindspots." },
                { title: "2. Proactive, Not Reactive", desc: "Looking at a bank statement at the end of the month is too late. Our budget engine alerts you exactly when you hit 80% capacity." },
                { title: "3. Frictionless Settle-ups", desc: "Social friction around money destroys friendships. Tallymate&apos;s debt minimization engine makes settling up instant and mathematically optimal." }
              ].map((m, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2.5 shrink-0" />
                  <div>
                    <h4 className="font-bold text-neutral-900 dark:text-white mb-1">{m.title}</h4>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 w-full bg-black/[0.02] dark:bg-[#111113] rounded-3xl p-8 border border-black/[0.06] dark:border-neutral-800 relative overflow-hidden shadow-sm">
            {/* Abstract visual for methodology */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.05),transparent_60%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent_50%)]" />
            <div className="space-y-4 relative z-10">
              <div className="h-2 w-24 bg-neutral-300 dark:bg-neutral-600 rounded-full" />
              <div className="h-12 w-full bg-white dark:bg-[#1e1e20] rounded-xl border border-black/[0.06] dark:border-neutral-700 flex items-center px-4 shadow-sm">
                <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400"><CheckCircle2 size={12} /></div>
                <div className="h-2 w-32 bg-neutral-300 dark:bg-neutral-600 rounded-full ml-3" />
              </div>
              <div className="h-12 w-[85%] bg-white dark:bg-[#1e1e20] rounded-xl border border-black/[0.06] dark:border-neutral-700 flex items-center px-4 shadow-sm opacity-90 dark:opacity-90">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400"><ArrowRight size={12} /></div>
                <div className="h-2 w-24 bg-neutral-300 dark:bg-neutral-600 rounded-full ml-3" />
              </div>
              <div className="h-12 w-[70%] bg-white dark:bg-[#1e1e20] rounded-xl border border-black/[0.06] dark:border-neutral-700 flex items-center px-4 shadow-sm opacity-80 dark:opacity-80">
                <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400"><Target size={12} /></div>
                <div className="h-2 w-20 bg-neutral-300 dark:bg-neutral-600 rounded-full ml-3" />
              </div>
            </div>
          </div>
        </div>
      </section>
      </ScrollFadeIn>

      <ScrollFadeIn delay={200}>
      {/* Security Section */}
      <section id="security" className="py-24 px-6 md:px-12 max-w-7xl mx-auto w-full border-t border-black/[0.06] dark:border-neutral-800 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-black/[0.03] dark:bg-neutral-900 mb-8 border border-black/[0.06] dark:border-neutral-800">
          <Shield size={32} className="text-emerald-500" />
        </div>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Bank-grade Security.</h2>
        <p className="text-neutral-500 dark:text-neutral-400 text-lg max-w-2xl mx-auto mb-16 leading-relaxed">
          Your financial data is your business. We employ industry-leading encryption and strict data minimization practices to ensure your data stays yours.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#111113] border border-black/[0.06] dark:border-neutral-800">
            <h4 className="font-bold mb-2 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> End-to-End Encryption</h4>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">All data is encrypted in transit (TLS 1.3) and at rest (AES-256) within our secure cloud infrastructure.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-[#111113] border border-black/[0.06] dark:border-neutral-800">
            <h4 className="font-bold mb-2 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> No Data Selling</h4>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Unlike free budgeting apps, we never sell your transaction history to advertisers or third-party data brokers.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-[#111113] border border-black/[0.06] dark:border-neutral-800">
            <h4 className="font-bold mb-2 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500" /> Strict Authentication</h4>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Powered by Better Auth, utilizing secure HTTP-only session cookies to prevent cross-site scripting (XSS) attacks.</p>
          </div>
        </div>
      </section>
      </ScrollFadeIn>

      <ScrollFadeIn delay={200}>
      {/* FAQ Section */}
      <section id="faq" className="py-24 px-6 md:px-12 max-w-7xl mx-auto w-full border-t border-black/[0.06] dark:border-neutral-800">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Frequently Asked Questions</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-lg">Everything you need to know about Tallymate.</p>
        </div>
        <FAQAccordion />
      </section>
      </ScrollFadeIn>

      {/* Footer */}
      <footer className="pt-20 pb-10 border-t border-black/[0.06] dark:border-neutral-800 bg-white dark:bg-[#0c0c0e]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
            <div className="col-span-2 md:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <TallymateLogo size={24} className="text-neutral-900 dark:text-white" />
                <span className="font-bold text-lg text-neutral-900 dark:text-white tracking-tight">Tallymate</span>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs leading-relaxed">
                The unified personal finance and bill-splitting application designed to effortlessly bridge the gap between individual budget tracking and shared group expenses.
              </p>
              <div className="flex items-center gap-4 pt-2">
                <a href="https://x.com/AnkitPande5641" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href="https://www.instagram.com/ankit.pandey19/" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                </a>
                <a href="https://github.com/ankitpandey1900/" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-sm text-neutral-900 dark:text-white">Product</h4>
              <ul className="space-y-3 text-sm text-neutral-500 dark:text-neutral-400">
                <li><Link href="#features" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#methodology" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Methodology</Link></li>
                <li><Link href="#security" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Security</Link></li>
                <li><Link href="/login" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Sign Up</Link></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-sm text-neutral-900 dark:text-white">Resources</h4>
              <ul className="space-y-3 text-sm text-neutral-500 dark:text-neutral-400">
                <li><Link href="/docs" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="#faq" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Help Center / FAQ</Link></li>
                <li><Link href="#" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-sm text-neutral-900 dark:text-white">Company</h4>
              <ul className="space-y-3 text-sm text-neutral-500 dark:text-neutral-400">
                <li><Link href="/privacy-policy" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms-of-service" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/contact" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Contact Us</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-black/[0.06] dark:border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-sm text-neutral-500 dark:text-neutral-400">© 2026 Tallymate. All rights reserved.</span>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              Built by <span className="text-neutral-900 dark:text-white font-semibold">Ankit Pandey</span> · <a href="https://www.instagram.com/ankit.pandey19/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-500 font-semibold transition-colors">Instagram</a>
            </span>
          </div>

        </div>
      </footer>
    </div>
  );
}
