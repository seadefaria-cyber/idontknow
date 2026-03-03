"use client";

import { useRouter } from "next/navigation";
import { useSwipe } from "@/hooks/useSwipe";

interface SwipeNavProps {
  children: React.ReactNode;
  leftTo?: { path: string; label: string };
  rightTo?: { path: string; label: string };
}

export default function SwipeNav({ children, leftTo, rightTo }: SwipeNavProps) {
  const router = useRouter();

  useSwipe({
    onSwipeLeft: leftTo ? () => router.push(leftTo.path) : undefined,
    onSwipeRight: rightTo ? () => router.push(rightTo.path) : undefined,
  });

  return (
    <div className="relative">
      {children}

      {/* Swipe indicators — mobile only */}
      <div className="sm:hidden pointer-events-none">
        {rightTo && (
          <div className="fixed left-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 text-white/10">
            <span className="text-lg">&lsaquo;</span>
            <span className="text-[8px] tracking-widest uppercase">{rightTo.label}</span>
          </div>
        )}
        {leftTo && (
          <div className="fixed right-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 text-white/10">
            <span className="text-lg">&rsaquo;</span>
            <span className="text-[8px] tracking-widest uppercase">{leftTo.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}
