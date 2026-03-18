"use client";

import { useEffect, useState, useCallback, use } from "react";
import { brand } from "@/lib/brand";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: { theme?: string; size?: string; width?: number; text?: string }
          ) => void;
        };
      };
    };
  }
}

interface PageProps {
  params: Promise<{ username: string }>;
}

export default function CommissionSubmitPage({ params }: PageProps) {
  const { username } = use(params);

  const [pageState, setPageState] = useState<"loading" | "invalid" | "signin" | "form" | "success">("loading");
  const [clientName, setClientName] = useState("");

  // Google identity
  const [googleIdToken, setGoogleIdToken] = useState("");
  const [googleName, setGoogleName] = useState("");
  const [googleEmail, setGoogleEmail] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Validate username on mount
  useEffect(() => {
    fetch(`/api/public/validate-user?username=${encodeURIComponent(username)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.valid) {
          setClientName(data.clientName);
          setPageState("signin");
        } else {
          setPageState("invalid");
        }
      })
      .catch(() => setPageState("invalid"));
  }, [username]);

  // Load Google Identity Services script
  const initGoogleSignIn = useCallback(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    if (!document.getElementById("google-gis-script")) {
      const script = document.createElement("script");
      script.id = "google-gis-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => renderGoogleButton(clientId);
      document.body.appendChild(script);
    } else if (window.google) {
      renderGoogleButton(clientId);
    }
  }, []);

  function renderGoogleButton(clientId: string) {
    if (!window.google) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleResponse,
    });

    const container = document.getElementById("google-signin-button");
    if (container) {
      window.google.accounts.id.renderButton(container, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "signin_with",
      });
    }
  }

  function handleGoogleResponse(response: { credential: string }) {
    const token = response.credential;
    setGoogleIdToken(token);

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setGoogleName(payload.name || payload.email || "");
      setGoogleEmail(payload.email || "");
    } catch {
      // Token will still be verified server-side
    }

    setPageState("form");
  }

  useEffect(() => {
    if (pageState === "signin") {
      initGoogleSignIn();
    }
  }, [pageState, initGoogleSignIn]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!title) {
      setError("Please provide a title");
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append("username", username);
    formData.append("googleIdToken", googleIdToken);
    formData.append("title", title);
    if (description) formData.append("description", description);
    if (amount) formData.append("amount", amount);
    if (file) formData.append("file", file);

    try {
      const res = await fetch("/api/public/commissions", { method: "POST", body: formData });
      if (res.ok) {
        setPageState("success");
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Something went wrong");
    }
    setSubmitting(false);
  }

  // --- LOADING ---
  if (pageState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xs text-gray-400 tracking-widest uppercase">Loading...</p>
      </div>
    );
  }

  // --- INVALID LINK ---
  if (pageState === "invalid") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-light text-gray-900 tracking-wide">Invalid Link</h1>
            <p className="text-xs text-gray-400 mt-2">This commission upload link is not valid. Please check the URL and try again.</p>
          </div>
        </div>
      </div>
    );
  }

  // --- SUCCESS ---
  if (pageState === "success") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-light text-gray-900 tracking-wide">Commission Uploaded</h1>
            <p className="text-xs text-gray-400 mt-2">
              Your commission has been submitted to {clientName} for review.
            </p>
          </div>
          <button
            onClick={() => {
              setTitle(""); setDescription(""); setAmount(""); setFile(null);
              setError("");
              setPageState("form");
            }}
            className="text-xs tracking-[0.15em] uppercase text-gray-400 hover:text-gray-500 transition-colors"
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  // --- GOOGLE SIGN-IN ---
  if (pageState === "signin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-md text-center space-y-8">
          <div>
            <p className="text-[10px] text-gray-300 tracking-[0.3em] uppercase mb-3">{brand.portalName}</p>
            <h1 className="text-lg font-light text-gray-900 tracking-wide">
              Upload Commission to {clientName}
            </h1>
            <p className="text-xs text-gray-400 mt-2">Sign in with Google to verify your identity</p>
          </div>

          <div className="flex justify-center">
            <div id="google-signin-button" />
          </div>

          <p className="text-[10px] text-gray-300">
            Your name and email will be attached to the submission
          </p>
        </div>
      </div>
    );
  }

  // --- COMMISSION FORM ---
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <p className="text-[10px] text-gray-300 tracking-[0.3em] uppercase mb-3">{brand.portalName}</p>
          <h1 className="text-lg font-light text-gray-900 tracking-wide">
            Upload Commission to {clientName}
          </h1>
          <p className="text-xs text-gray-400 mt-2">
            Signed in as {googleName || googleEmail}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-3 rounded-lg bg-red-50 text-red-600 text-xs text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-gray-400 mb-3">Commission Details</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 tracking-wide block mb-2">Title *</label>
                <input
                  type="text"
                  placeholder="What is this commission for?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg text-sm font-light border border-gray-200"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 tracking-wide block mb-2">Description</label>
                <textarea
                  placeholder="Additional details (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg text-sm font-light border border-gray-200 resize-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs text-gray-400 tracking-wide block mb-2">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg text-sm font-light border border-gray-200"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 tracking-wide block mb-2">Document</label>
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:bg-gray-50 file:text-gray-500 hover:file:bg-gray-100"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-lg text-xs tracking-[0.2em] uppercase bg-gray-900 text-white hover:bg-gray-800 transition-all font-medium disabled:opacity-30"
          >
            {submitting ? "Uploading..." : "Upload Commission"}
          </button>
        </form>
      </div>
    </div>
  );
}
