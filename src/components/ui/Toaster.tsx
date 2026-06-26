"use client";

import { useEffect, useState } from "react";
import { Toaster as Sonner } from "sonner";

export default function Toaster() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const syncTheme = () => {
      setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    };

    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <Sonner
      theme={theme}
      position="bottom-right"
      className="toaster group"
      toastOptions={{
        duration: 4000,
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white/80 group-[.toaster]:dark:bg-[#111113]/80 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-neutral-900 group-[.toaster]:dark:text-white group-[.toaster]:border-black/[0.04] group-[.toaster]:dark:border-white/[0.04] group-[.toaster]:shadow-[0_8px_30px_rgb(0,0,0,0.06)] group-[.toaster]:dark:shadow-2xl rounded-xl",
          description: "group-[.toast]:text-neutral-500 group-[.toast]:dark:text-neutral-400",
          actionButton:
            "group-[.toast]:bg-indigo-600 group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-neutral-100 group-[.toast]:dark:bg-neutral-800",
          error: "group-[.toaster]:bg-rose-50/90 group-[.toaster]:dark:bg-rose-950/40 group-[.toaster]:text-rose-600 group-[.toaster]:dark:text-rose-400 group-[.toaster]:border-rose-100 group-[.toaster]:dark:border-rose-900/50",
          success: "group-[.toaster]:bg-emerald-50/90 group-[.toaster]:dark:bg-emerald-950/40 group-[.toaster]:text-emerald-600 group-[.toaster]:dark:text-emerald-400 group-[.toaster]:border-emerald-100 group-[.toaster]:dark:border-emerald-900/50",
          warning: "group-[.toaster]:bg-amber-50/90 group-[.toaster]:dark:bg-amber-950/40 group-[.toaster]:text-amber-600 group-[.toaster]:dark:text-amber-400 group-[.toaster]:border-amber-100 group-[.toaster]:dark:border-amber-900/50",
          info: "group-[.toaster]:bg-blue-50/90 group-[.toaster]:dark:bg-blue-950/40 group-[.toaster]:text-blue-600 group-[.toaster]:dark:text-blue-400 group-[.toaster]:border-blue-100 group-[.toaster]:dark:border-blue-900/50",
        },
      }}
    />
  );
}
