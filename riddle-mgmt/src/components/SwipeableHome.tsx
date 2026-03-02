"use client";

import { useRouter } from "next/navigation";
import { useSwipe } from "@/hooks/useSwipe";

export default function SwipeableHome({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useSwipe({
    onSwipeLeft: () => router.push("/about"),
    onSwipeRight: () => router.push("/contact"),
  });

  return (
    <div className="relative">
      {children}

      {/* Swipe indicators — mobile only */}
      <div className="sm:hidden pointer-events-none">
        {/* Left edge — swipe right for Contact */}
        <div className="fixed left-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 text-white/10">
          <span className="text-lg">&lsaquo;</span>
          <span className="text-[8px] tracking-widest uppercase">Contact</span>
        </div>

        {/* Right edge — swipe left for About */}
        <div className="fixed right-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 text-white/10">
          <span className="text-lg">&rsaquo;</span>
          <span className="text-[8px] tracking-widest uppercase">About</span>
        </div>
      </div>
    </div>
  );
}
