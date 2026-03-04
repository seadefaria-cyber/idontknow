"use client";

import { useState } from "react";
import Image from "next/image";

export default function Onboarding() {
  const [form, setForm] = useState({
    fullName: "",
    stageName: "",
    email: "",
    phone: "",
    preferredEmail: "",
    recoveryEmail: "",
    paymentMethod: "",
    bankName: "",
    routingLast4: "",
    docusignEmail: "",
    username: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">✓</div>
          <h2 className="text-xl font-semibold mb-2">You&apos;re all set</h2>
          <p className="text-sm text-gray-500">
            We&apos;ll get your portal set up and send you login details shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-5 py-16">
      <div className="max-w-[600px] mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image
            src="/riddle-r-logo.png"
            alt="Riddle MGMT"
            width={120}
            height={120}
            className="mx-auto opacity-60"
            priority
          />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            CXO — Portal Onboarding
          </h1>
        </div>

        <hr className="border-gray-200 mb-8" />

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 01 — PERSONAL INFO */}
          <Section label="PERSONAL INFO">
            <Field label="Full Name">
              <input
                type="text"
                placeholder=""
                value={form.fullName}
                onChange={update("fullName")}
                required
              />
            </Field>
            <Field label="Personal Email">
              <input
                type="email"
                placeholder=""
                value={form.email}
                onChange={update("email")}
                required
              />
            </Field>
            <Field label="Phone Number">
              <input
                type="tel"
                placeholder=""
                value={form.phone}
                onChange={update("phone")}
              />
            </Field>
          </Section>

          {/* 02 — QUICKBOOKS LOGIN */}
          <Section label="QUICKBOOKS LOGIN">
            <Field label="Email">
              <input
                type="email"
                placeholder=""
                value={form.recoveryEmail}
                onChange={update("recoveryEmail")}
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                placeholder=""
                value={form.bankName}
                onChange={update("bankName")}
              />
            </Field>
          </Section>

          {/* 03 — DOCUSIGN LOGIN */}
          <Section label="DOCUSIGN LOGIN" note="$25/MO STANDARD">
            <Field label="Email">
              <input
                type="email"
                placeholder=""
                value={form.docusignEmail}
                onChange={update("docusignEmail")}
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                placeholder=""
                value={form.username}
                onChange={update("username")}
              />
            </Field>
          </Section>

          {/* Bottom note */}
          <div className="pt-4 text-center">
            <p className="text-sm text-gray-400 mb-1">We&apos;ll provide the following:</p>
            <p className="text-sm text-gray-500">Google Workspace — your @riddlellc.biz email, calendar, and Drive</p>
            <p className="text-sm text-gray-500">Riddle MGMT Portal — your dashboard at riddlellc.biz</p>
          </div>

          {/* Submit */}
          <div className="text-center pt-4">
            <button
              type="submit"
              className="px-10 py-3 rounded-lg text-xs tracking-[0.15em] uppercase bg-gray-900 text-white hover:bg-gray-800 transition-all duration-300 font-medium"
            >
              Submit
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-16 pt-6 border-t border-gray-200">
          <p className="text-[11px] text-gray-400 tracking-wide">
            RIDDLE LLC · team@riddlellc.biz · riddlellc.biz
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="bg-gray-100 rounded px-4 py-2 mb-5">
        <span className="text-[11px] font-semibold tracking-[0.08em] text-gray-400">
          {label}
        </span>
        {note && (
          <span className="text-[11px] text-gray-400 ml-3">
            · {note}
          </span>
        )}
      </div>
      <div className="space-y-4 px-1">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1.5 font-medium">{label}</label>
      <div className="[&>input]:w-full [&>input]:px-3 [&>input]:py-2.5 [&>input]:rounded-md [&>input]:text-sm [&>input]:border [&>input]:border-gray-200 [&>select]:w-full [&>select]:px-3 [&>select]:py-2.5 [&>select]:rounded-md [&>select]:text-sm [&>select]:border [&>select]:border-gray-200">
        {children}
      </div>
    </div>
  );
}
