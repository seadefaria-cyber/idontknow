"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RequestForm from "@/components/portal/RequestForm";

export default function RequestPage() {
  const [authed, setAuthed] = useState(false);
  const [userName, setUserName] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) { router.push("/portal"); return; }
        return res.json();
      })
      .then((data) => {
        if (data?.user) {
          setAuthed(true);
          setUserName(data.user.displayName || data.user.username);
        }
      })
      .catch(() => router.push("/portal"));
  }, [router]);

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xs text-gray-400 tracking-widest uppercase">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <RequestForm userName={userName} />
      <a
        href="/portal/dashboard"
        className="mt-8 text-[10px] text-gray-300 hover:text-gray-500 transition-colors tracking-[0.15em] uppercase"
      >
        &larr; Back to Dashboard
      </a>
    </div>
  );
}
