"use client";

import React, { useEffect, useRef, useState } from "react";

interface RevealSectionProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}

/**
 * Scroll-triggered reveal component for the Receipts workspace.
 * Automatically respects `prefers-reduced-motion` and bounds to the scrollable `<main>` container.
 */
export function RevealSection({
  children,
  className = "",
  delayMs = 0,
}: RevealSectionProps) {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return true;
    }
    return false;
  });

  const domRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = domRef.current;
    if (!el) return;

    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      queueMicrotask(() => setIsVisible(true));
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      queueMicrotask(() => setIsVisible(true));
      return;
    }

    const scrollContainer = el.closest("main") || null;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        root: scrollContainer,
        threshold: 0.08,
        rootMargin: "0px 0px -20px 0px",
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={domRef}
      style={{ transitionDelay: `${delayMs}ms` }}
      className={`transition-all duration-700 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      } ${className}`}
    >
      {children}
    </div>
  );
}
