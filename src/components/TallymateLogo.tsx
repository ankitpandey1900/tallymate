import React from "react";

interface LogoProps {
  size?: number;
  className?: string;
}

export default function TallymateLogo({ size = 28, className = "" }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Tallymate logo"
    >
      {/* Background: consistent brand dark */}
      <rect
        width="32"
        height="32"
        rx="8"
        className="fill-[#09090b]"
      />
      {/* Bar 1 — short, lighter opacity */}
      <rect
        x="6" y="19" width="5" height="8" rx="2"
        className="fill-white"
        opacity="0.65"
      />
      {/* Bar 2 — medium, full opacity */}
      <rect
        x="13.5" y="12" width="5" height="15" rx="2"
        className="fill-white"
      />
      {/* Bar 3 — tall, lighter opacity */}
      <rect
        x="21" y="6" width="5" height="21" rx="2"
        className="fill-white"
        opacity="0.5"
      />
      {/* Accent dot — always green */}
      <circle cx="8.5" cy="17" r="2.5" fill="#10b981" />
    </svg>
  );
}
