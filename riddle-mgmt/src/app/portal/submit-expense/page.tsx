"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SubmitExpenseRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/portal/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-xs text-gray-400 tracking-widest uppercase">Redirecting...</p>
    </div>
  );
}
