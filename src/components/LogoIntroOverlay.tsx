"use client";

import React, { useState, useEffect, useRef } from "react";

interface LogoIntroOverlayProps {
  onAnimationComplete?: () => void;
}

export function LogoIntroOverlay({ onAnimationComplete }: LogoIntroOverlayProps) {
  const [isDone, setIsDone] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const logoRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Respect reduced motion
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.documentElement.classList.add("intro-done");
      setIsDone(true);
      if (onAnimationComplete) onAnimationComplete();
      return;
    }

    // Phase A: Logo stays centered and stationary for 1000ms.
    // Notice: The HTML/CSS already renders the blur and centered logo from frame 0!
    const moveTimer = setTimeout(() => {
      const logoEl = logoRef.current;
      const overlayEl = overlayRef.current;
      if (!logoEl) {
        document.documentElement.classList.add("intro-done");
        setIsDone(true);
        return;
      }

      // Find destination logo slot in Header (mobile) or Sidebar (desktop)
      const isMobile = window.innerWidth < 1024;
      const targetEl = isMobile
        ? document.getElementById("header-brand-logo-img")
        : (document.getElementById("sidebar-brand-logo-img") || document.getElementById("sidebar-brand-logo-collapsed-img"));

      const targetRect = targetEl?.getBoundingClientRect();

      // Current centered coordinates before transition
      const centerRect = logoEl.getBoundingClientRect();

      // Pin current position in exact pixels so FLIP animation is silky-smooth
      logoEl.style.transform = "none";
      logoEl.style.top = `${centerRect.top}px`;
      logoEl.style.left = `${centerRect.left}px`;
      logoEl.style.width = `${centerRect.width}px`;
      logoEl.style.height = `${centerRect.height}px`;

      // Force layout reflow before applying transition styles
      void logoEl.offsetHeight;

      // Begin Phase B: Transition logo to target slot & fade blur
      setIsFading(true);

      const destTop = targetRect && targetRect.width > 0 ? targetRect.top : (isMobile ? 14 : 20);
      const destLeft = targetRect && targetRect.width > 0 ? targetRect.left : (isMobile ? 54 : 24);
      const destWidth = targetRect && targetRect.width > 0 ? targetRect.width : (isMobile ? 28 : 32);
      const destHeight = targetRect && targetRect.height > 0 ? targetRect.height : (isMobile ? 28 : 32);

      logoEl.style.transition = "all 850ms cubic-bezier(0.16, 1, 0.3, 1)";
      logoEl.style.top = `${destTop}px`;
      logoEl.style.left = `${destLeft}px`;
      logoEl.style.width = `${destWidth}px`;
      logoEl.style.height = `${destHeight}px`;
      logoEl.style.borderRadius = "12px";
      logoEl.style.boxShadow = "0 4px 12px -2px rgba(36, 77, 58, 0.15)";

      if (overlayEl) {
        overlayEl.style.transition =
          "opacity 850ms cubic-bezier(0.16, 1, 0.3, 1), backdrop-filter 850ms cubic-bezier(0.16, 1, 0.3, 1), -webkit-backdrop-filter 850ms cubic-bezier(0.16, 1, 0.3, 1)";
        overlayEl.style.opacity = "0";
        overlayEl.style.backdropFilter = "blur(0px)";
        overlayEl.style.setProperty("-webkit-backdrop-filter", "blur(0px)");
      }
    }, 1000);

    // Phase C: Finish animation after 1880ms total
    const finishTimer = setTimeout(() => {
      document.documentElement.classList.add("intro-done");
      setIsDone(true);
      if (onAnimationComplete) onAnimationComplete();
    }, 1880);

    return () => {
      clearTimeout(moveTimer);
      clearTimeout(finishTimer);
      document.documentElement.classList.add("intro-done");
    };
  }, [onAnimationComplete]);

  if (isDone) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[9999] pointer-events-none select-none overflow-hidden"
    >
      {/* Translucent blurred backdrop overlay — rendered immediately on initial paint */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-[#FCFAF7]/75 dark:bg-[#121614]/80 backdrop-blur-xl pointer-events-auto"
        style={{
          opacity: isFading ? 0 : 1,
          backdropFilter: isFading ? "blur(0px)" : "blur(16px)",
          WebkitBackdropFilter: isFading ? "blur(0px)" : "blur(16px)",
        }}
      />

      {/* Centered logo container — positioned in center from frame 0 */}
      <div
        ref={logoRef}
        className="fixed z-[10000] pointer-events-none flex items-center justify-center border border-black/[0.08] dark:border-white/[0.15] bg-white shadow-xl w-48 h-48 sm:w-60 sm:h-60 rounded-3xl p-2"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          boxShadow: "0 20px 45px -10px rgba(36, 77, 58, 0.28), 0 0 0 1px rgba(36, 77, 58, 0.08)",
        }}
      >
        <img
          src="/Receipts_Verified.png"
          alt="Receipts Verified"
          className="h-full w-full object-contain"
          style={{
            aspectRatio: "1 / 1",
          }}
        />
      </div>
    </div>
  );
}
