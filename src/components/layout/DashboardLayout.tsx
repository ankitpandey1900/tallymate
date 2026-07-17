"use client";

import Image from "next/image";
import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  PieChart,
  Target,
  Users,
  TrendingUp,
  Bell,
  Settings,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  CheckCircle,
  HandCoins,
  Loader2,
  FileText,
  CalendarDays,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getLayoutData, markNotificationAsRead } from "@/app/actions";
import { signOut, useSession } from "@/lib/auth-client";
import { UnifiedUser, UnifiedNotification } from "@/lib/unified-db";
import TallymateLogo from "@/components/TallymateLogo";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isNavPending, startNavTransition] = useTransition();
  const { data: session, isPending: sessionLoading } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [currentUser, setCurrentUser] = useState<UnifiedUser | null>(null);
  const [notifications, setNotifications] = useState<UnifiedNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Initialize Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark";
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const activeTheme = savedTheme || systemTheme;
    setTheme(activeTheme);
    if (activeTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // PWA Service Worker registration
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("PWA SW registered:", reg.scope))
        .catch((err) => console.error("PWA SW failed:", err));
    }
  }, []);

  // Load user + notifications only when not provided by server layout
  useEffect(() => {
    if (sessionLoading) return;

    if (!session) {
      router.replace("/login");
      return;
    }

    const loadUserData = async () => {
      try {
        const data = await getLayoutData();
        setCurrentUser(data.user);
        setNotifications(data.notifications);
      } catch {
        router.replace("/login");
      }
    };

    loadUserData();
  }, [sessionLoading, session, router]);

  // Prefetch all dashboard routes so clicks feel instant
  useEffect(() => {
    if (!session) return;
    const routes = [
      "/dashboard",
      "/transactions",
      "/budgets",
      "/goals",
      "/groups",
      "/debts",
      "/reports",
      "/notifications",
      "/settings",
    ];
    routes.forEach((route) => router.prefetch(route));
  }, [session, router]);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/login");
          },
        },
      });
    } catch {
      router.push("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Transactions", href: "/transactions", icon: Receipt },
    { name: "Calendar", href: "/calendar", icon: CalendarDays },
    { name: "Budgets", href: "/budgets", icon: PieChart },
    { name: "Goals", href: "/goals", icon: Target },
    { name: "Groups", href: "/groups", icon: Users },
    { name: "Debts", href: "/debts", icon: HandCoins },
    { name: "Reports", href: "/reports", icon: TrendingUp },
    { name: "Import Rules", href: "/import-rules", icon: FileText },
    { name: "Notifications", href: "/notifications", icon: Bell },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const userInitial = currentUser?.name
    ? currentUser.name[0].toUpperCase()
    : currentUser?.email
    ? currentUser.email[0].toUpperCase()
    : "U";

  return (
    <div className="h-screen w-full flex overflow-hidden bg-neutral-50/50 dark:bg-[#0c0c0e] text-neutral-900 dark:text-[#f5f5f7]">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-60 border-r border-black/[0.04] dark:border-[#27272a] bg-white/70 backdrop-blur-xl dark:bg-[#0f0f11] flex flex-col transition-transform duration-200 md:translate-x-0 md:static",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-5 border-b border-black/[0.04] dark:border-[#27272a] shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => setIsSidebarOpen(false)}>
            <TallymateLogo size={24} className="text-neutral-900 dark:text-white shrink-0" />
            <span className="font-bold text-sm tracking-tight">Tallymate</span>
          </Link>
          <Button
            type="button"
            variant="unstyled"
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 md:hidden"
          >
            <X size={16} />
          </Button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={false}
                onClick={() => {
                  setIsSidebarOpen(false);
                  if (pathname !== item.href) {
                    startNavTransition(() => {});
                  }
                }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors relative group",
                  isActive
                    ? "bg-black/[0.04] dark:bg-[#27272a] text-neutral-900 dark:text-white"
                    : "text-neutral-500 dark:text-neutral-400 hover:bg-black/[0.02] dark:hover:bg-[#1c1c1f] hover:text-neutral-900 dark:hover:text-white"
                )}
              >
                <Icon size={16} className="shrink-0" />
                <span>{item.name}</span>
                {item.name === "Notifications" && unreadCount > 0 && (
                  <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-[#09090b] dark:bg-white text-[9px] font-bold text-white dark:text-black">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-[#e5e7eb] dark:border-[#27272a] shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-2.5 px-1">
              <Link
                href="/settings"
                className="flex flex-1 items-center gap-2.5 min-w-0 hover:bg-black/[0.02] dark:hover:bg-[#1c1c1f] p-1.5 -ml-1.5 rounded-md transition-colors"
                onClick={() => setIsSidebarOpen(false)}
              >
                {currentUser?.image ? (
                  <Image src={currentUser.image} width={32} height={32} alt={currentUser.name || "User"} className="w-8 h-8 rounded-full shrink-0 object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center font-bold text-xs text-white dark:text-black shrink-0 select-none">
                    {userInitial}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold truncate">
                    {currentUser.name || "User"}
                  </p>
                  <p className="text-[10px] text-neutral-400 truncate font-mono">
                    {currentUser.email}
                  </p>
                </div>
              </Link>
              <Button
                type="button"
                variant="unstyled"
                title="Sign Out"
                onClick={handleLogout}
                disabled={loggingOut}
                className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 text-neutral-400 hover:text-red-500 transition-colors shrink-0 disabled:opacity-50"
              >
                {loggingOut ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <LogOut size={14} />
                )}
              </Button>
            </div>
          ) : (
            <div className="h-10 flex items-center justify-center">
              <Loader2 size={16} className="animate-spin text-neutral-400" />
            </div>
          )}
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto relative">
        {isNavPending && (
          <div className="h-0.5 w-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden shrink-0">
            <div className="h-full w-1/3 bg-neutral-900 dark:bg-white animate-[pulse_0.8s_ease-in-out_infinite]" />
          </div>
        )}
        {/* Top Header */}
        <header className="h-14 border-b border-black/[0.04] dark:border-[#27272a] bg-white/70 backdrop-blur-xl dark:bg-[#0f0f11] flex items-center justify-between px-5 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="unstyled"
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 md:hidden"
            >
              <Menu size={18} />
            </Button>
            <p className="text-[13px] font-semibold text-neutral-700 dark:text-neutral-300 hidden sm:block">
              {navItems.find((n) => n.href === pathname)?.name || "Finance Manager"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh Button (visible only on mobile) */}
            <Button
              type="button"
              variant="unstyled"
              onClick={() => window.location.reload()}
              className="md:hidden p-2 rounded-md border border-black/[0.04] dark:border-[#27272a] hover:bg-black/[0.02] dark:hover:bg-neutral-900 transition-colors text-neutral-500 dark:text-neutral-400"
              title="Refresh Data"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.13 15.57a10 10 0 1 0 3.43-11.75l-5.32 3.12"></path></svg>
            </Button>

            {/* Theme Toggle */}
            <Button
              type="button"
              variant="unstyled"
              onClick={toggleTheme}
              className="p-2 rounded-md border border-black/[0.04] dark:border-[#27272a] hover:bg-black/[0.02] dark:hover:bg-neutral-900 transition-colors text-neutral-500 dark:text-neutral-400"
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
            </Button>

            {/* Notifications */}
            <div className="relative">
              <Button
                type="button"
                variant="unstyled"
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-md border border-black/[0.04] dark:border-[#27272a] hover:bg-black/[0.02] dark:hover:bg-neutral-900 transition-colors relative text-neutral-500 dark:text-neutral-400"
                title="Notifications"
              >
                <Bell size={15} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-1.5 w-1.5 rounded-full bg-red-500" />
                )}
              </Button>

              {showNotifications && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowNotifications(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 border border-black/[0.04] dark:border-[#27272a] bg-white/90 backdrop-blur-2xl dark:bg-[#18181b] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-2xl py-1 z-40 max-h-96 overflow-y-auto">
                    <div className="px-4 py-2.5 border-b border-black/[0.04] dark:border-[#27272a] flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[9px] font-bold">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-xs text-neutral-400">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleMarkAsRead(n.id)}
                          className={cn(
                            "px-4 py-3 border-b border-neutral-50 dark:border-[#27272a]/50 last:border-none flex items-start gap-3 cursor-pointer hover:bg-neutral-50 dark:hover:bg-[#1c1c1f] transition-colors",
                            !n.isRead && "bg-neutral-50/80 dark:bg-[#1c1c1f]/80"
                          )}
                        >
                          <div className="mt-0.5 shrink-0">
                            {n.isRead ? (
                              <CheckCircle size={13} className="text-neutral-300 dark:text-neutral-600" />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-[#09090b] dark:bg-white mt-1" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold">{n.title}</p>
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">
                              {n.message}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    <Link
                      href="/notifications"
                      onClick={() => setShowNotifications(false)}
                      className="block text-center py-2.5 text-[11px] font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white border-t border-[#e4e4e7] dark:border-[#27272a] transition-colors"
                    >
                      View all notifications →
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-5 md:p-7 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
