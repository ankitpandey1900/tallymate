"use client";

import React, { useEffect, useRef, useState } from "react";

export default function AnimatedLetters({ 
  text, 
  delayOffset = 0, 
  className = "",
  letterClassName = ""
}: { 
  text: string; 
  delayOffset?: number; 
  className?: string;
  letterClassName?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Only animate once
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <span ref={containerRef} className={`inline-block ${className}`}>
      {text.split(" ").map((word, wordIndex, wordsArray) => {
        // Calculate deterministic global character offset for animation delays
        const globalCharOffset = wordsArray.slice(0, wordIndex).join("").length;
        
        return (
          <span key={wordIndex} className="inline-block whitespace-nowrap mr-[0.25em] last:mr-0">
            {word.split("").map((char, charIndex) => {
              const globalIndex = globalCharOffset + charIndex;
              const seed = globalIndex * 137.5; 
              const x = Math.round(Math.sin(seed) * 150); 
              const y = Math.round(Math.cos(seed) * 150); 
              const r = Math.round(Math.sin(seed * 1.5) * 120); 
              const z = Math.round(Math.cos(seed * 2) * 200); 
              
              return (
                <span
                  key={charIndex}
                  className={`inline-block opacity-0 ${isVisible ? 'animate-converge' : ''} ${letterClassName}`}
                  style={{ 
                    animationDelay: `${delayOffset + globalIndex * 0.04}s`,
                    "--start-x": `${x}px`,
                    "--start-y": `${y}px`,
                    "--start-r": `${r}deg`,
                    "--start-z": `${z}px`
                  } as React.CSSProperties}
                >
                  {char}
                </span>
              );
            })}
          </span>
        );
      })}
    </span>
  );
}
