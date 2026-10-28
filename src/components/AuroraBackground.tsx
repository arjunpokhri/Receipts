"use client";

import React, { useEffect, useRef } from "react";

export function AuroraBackground() {
  const mouseLightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationFrameId: number | null = null;
    let isRunning = false;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight * 0.3;
    let currentX = targetX;
    let currentY = targetY;

    const updatePosition = () => {
      const dx = targetX - currentX;
      const dy = targetY - currentY;

      // Spring interpolation for buttery organic inertia
      currentX += dx * 0.08;
      currentY += dy * 0.08;

      if (mouseLightRef.current) {
        mouseLightRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      }

      // If still moving noticeably, keep running; otherwise suspend RAF to free 100% idle CPU/GPU
      if (Math.abs(dx) > 0.4 || Math.abs(dy) > 0.4) {
        animationFrameId = requestAnimationFrame(updatePosition);
      } else {
        isRunning = false;
        animationFrameId = null;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (!isRunning) {
        isRunning = true;
        animationFrameId = requestAnimationFrame(updatePosition);
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Initial position settle
    isRunning = true;
    animationFrameId = requestAnimationFrame(updatePosition);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{ contain: "strict" }}
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none"
    >
      {/* 1. Base Gradient Canvas */}
      <div className="absolute inset-0 bg-[var(--paper)] transition-colors duration-300" />

      {/* 2. Interactive Cursor Ambient Beacon (Hardware-isolated, runs on demand) */}
      <div
        ref={mouseLightRef}
        style={{
          left: -200,
          top: -200,
          width: 400,
          height: 400,
          willChange: "transform",
          transform: "translate3d(0, 0, 0)",
        }}
        className="absolute rounded-full opacity-35 dark:opacity-40 blur-[60px] bg-gradient-to-tr from-emerald-400/25 via-emerald-500/20 to-amber-300/15 dark:from-emerald-500/25 dark:via-[#2E7D5B]/25 dark:to-amber-500/15 pointer-events-none"
      />

      {/* 3. Primary Aurora Wave Ribbon (Top-Right Sweeping Emerald) */}
      <div
        style={{ willChange: "transform", transform: "translate3d(0, 0, 0)" }}
        className="animate-aurora-1 animate-aurora-pulse absolute -top-[20%] -right-[10%] h-[75vh] w-[80vw] rounded-full blur-[70px] bg-gradient-to-bl from-emerald-400/20 via-[var(--forest-light)]/80 to-transparent dark:from-[#2E7D5B]/30 dark:via-[#1B3F2E]/25 dark:to-transparent"
      />

      {/* 4. Secondary Aurora Wave Ribbon (Top-Left Celestial Teal & Pine) */}
      <div
        style={{ willChange: "transform", transform: "translate3d(0, 0, 0)" }}
        className="animate-aurora-2 absolute -top-[15%] -left-[15%] h-[70vh] w-[75vw] rounded-full blur-[70px] bg-gradient-to-tr from-teal-300/15 via-emerald-200/20 to-transparent dark:from-[#155E54]/25 dark:via-[#244D3A]/20 dark:to-transparent"
      />

      {/* 5. Tertiary Solar Flare Ribbon (Warm Amber Filament Wave) */}
      <div
        style={{ willChange: "transform", transform: "translate3d(0, 0, 0)" }}
        className="animate-aurora-3 absolute top-[15%] left-[20%] h-[50vh] w-[55vw] rounded-full blur-[80px] opacity-50 dark:opacity-35 bg-gradient-to-r from-amber-300/15 via-amber-400/10 to-transparent dark:from-amber-600/15 dark:via-amber-500/10 dark:to-transparent"
      />

      {/* 6. Deep Base Floor Glow (Subtle grounded emerald glow at bottom) */}
      <div
        style={{ transform: "translate3d(0, 0, 0)" }}
        className="absolute -bottom-[20%] left-1/2 -translate-x-1/2 h-[45vh] w-[90vw] rounded-full blur-[80px] opacity-20 dark:opacity-30 bg-gradient-to-t from-emerald-500/15 via-[var(--forest)]/10 to-transparent dark:from-[#1B3F2E]/30 dark:via-[#163325]/20 dark:to-transparent"
      />

      {/* 7. Subtle Architectural Precision Grid Overlay */}
      <div className="absolute inset-0 bg-grid-subtle opacity-35 dark:opacity-15 mask-[radial-gradient(ellipse_at_center,black_40%,transparent_85%)]" />

      {/* 8. Vignette Edge Softener for Maximum Typography Legibility */}
      <div className="absolute inset-0 bg-radial-at-c from-transparent via-transparent to-[var(--paper)]/50 dark:to-[var(--paper)]/70" />
    </div>
  );
}

