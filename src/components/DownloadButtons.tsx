"use client";

import React from "react";
import { Download, Smartphone } from "lucide-react";

export default function DownloadButtons() {
  return (
    <div className="mt-8 flex flex-wrap gap-3 items-center justify-center z-10 animate-in fade-in duration-1000 delay-[1400ms] fill-mode-both">
      <a
        href="https://github.com/ankitpandey1900/tallymate/releases/latest/download/app-debug.apk"
        download="tallymate.apk"
        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold text-sm transition-colors border border-emerald-500/20"
      >
        <Download size={16} />
        Download APK
      </a>
      <button
        onClick={() => alert("iOS App Store link coming soon! For now, open this site in Safari and tap 'Add to Home Screen'.")}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold text-sm transition-colors border border-blue-500/20"
      >
        <Smartphone size={16} />
        Get on iOS
      </button>
      <button
        onClick={() => {
          if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            alert("To install as an app: \n\nOn iOS: Tap Share > Add to Home Screen\nOn Android: Tap Menu > Install App");
          }
        }}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-500/10 hover:bg-neutral-500/20 text-neutral-700 dark:text-neutral-300 font-semibold text-sm transition-colors border border-neutral-500/20"
      >
        <Smartphone size={16} />
        Install PWA
      </button>
    </div>
  );
}
