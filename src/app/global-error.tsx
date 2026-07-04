"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import TallymateLogo from "@/components/TallymateLogo";
import "./globals.css"; // Ensure global styles are applied even when layout crashes

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service if needed
    console.error("Caught by GlobalError:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-[#f8f9fb] dark:bg-[#0c0c0e] flex flex-col items-center justify-center p-6 text-center antialiased">
          <div className="mb-8">
            <TallymateLogo size={48} className="text-emerald-500 mx-auto" />
          </div>
          
          <div className="bg-white dark:bg-[#111113] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 md:p-12 shadow-sm max-w-lg w-full">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            
            <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white mb-4">
              Oops! Something went wrong.
            </h1>
            
            <p className="text-neutral-500 dark:text-neutral-400 mb-8 leading-relaxed">
              We encountered an unexpected error while loading this page. Our team has been notified.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => reset()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-black font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
              >
                <RefreshCcw size={18} />
                Try Again
              </button>
              
              <Link
                href="/"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                <Home size={18} />
                Go to Home
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
