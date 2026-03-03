"use client";

import { useState } from "react";

interface RequestFormProps {
  userName: string;
}

export default function RequestForm({ userName }: RequestFormProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });
      if (res.ok) {
        setSent(true);
        setSubject("");
        setMessage("");
        setTimeout(() => setSent(false), 4000);
      }
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass rounded-lg p-6 space-y-4 w-full max-w-xl">
      <p className="text-xs tracking-[0.2em] uppercase text-gray-500 text-center">Submit a Request</p>
      <p className="text-[10px] text-gray-400 text-center -mt-2">Bug fix, change request, or anything you need</p>
      <input
        type="text"
        placeholder="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        required
        className="w-full px-4 py-3 rounded-lg text-sm font-light"
      />
      <textarea
        placeholder="Describe what you need..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        required
        className="w-full px-4 py-3 rounded-lg text-sm font-light resize-none"
      />
      <button
        type="submit"
        disabled={sending || !subject.trim() || !message.trim()}
        className="w-full py-3 rounded-lg text-xs tracking-[0.2em] uppercase bg-gray-900 text-white hover:bg-gray-800 transition-all font-medium disabled:opacity-30"
      >
        {sent ? "Sent!" : sending ? "Sending..." : "Submit Request"}
      </button>
      {sent && (
        <p className="text-[10px] text-green-400/60 text-center">Your request has been submitted. We&apos;ll get back to you soon.</p>
      )}
    </form>
  );
}
