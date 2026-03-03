"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { brand } from "@/lib/brand";

export default function Nav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 sm:px-8 md:px-16 py-5 sm:py-6 bg-white/80 backdrop-blur-sm border-b border-gray-100">
      {/* Left: hamburger on mobile, About on desktop */}
      <div className="flex items-center gap-8 min-w-[80px]">
        {/* Hamburger — mobile only */}
        <button
          className="sm:hidden text-gray-400 hover:text-gray-700 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
            {menuOpen ? (
              <path d="M1 1L17 11M1 11L17 1" stroke="currentColor" strokeWidth="1.5" />
            ) : (
              <>
                <line x1="0" y1="0.5" x2="18" y2="0.5" stroke="currentColor" strokeWidth="1" />
                <line x1="0" y1="6" x2="18" y2="6" stroke="currentColor" strokeWidth="1" />
                <line x1="0" y1="11.5" x2="18" y2="11.5" stroke="currentColor" strokeWidth="1" />
              </>
            )}
          </svg>
        </button>

        {/* About — desktop only */}
        <Link
          href="/about"
          className={`text-xs tracking-[0.2em] uppercase transition-colors duration-300 hidden sm:block ${
            isActive("/about") ? "text-gray-900" : "text-gray-400 hover:text-gray-700"
          }`}
        >
          About
        </Link>
      </div>

      {/* Center: Logo text */}
      <Link href="/" className="absolute left-1/2 -translate-x-1/2">
        <span className="text-[10px] sm:text-xs tracking-[0.25em] sm:tracking-[0.3em] uppercase font-light text-gray-500 hover:text-gray-900 transition-colors duration-300">
          {brand.name}
        </span>
      </Link>

      {/* Right: Contact */}
      <div className="flex items-center gap-4 sm:gap-8 min-w-[80px] justify-end">
        <Link
          href="/contact"
          className={`text-xs tracking-[0.2em] uppercase transition-colors duration-300 hidden sm:block ${
            isActive("/contact") ? "text-gray-900" : "text-gray-400 hover:text-gray-700"
          }`}
        >
          Contact
        </Link>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="absolute top-14 left-5 glass rounded-lg p-4 flex flex-col gap-4 sm:hidden animate-fade-in">
          <Link
            href="/about"
            className={`text-xs tracking-[0.2em] uppercase transition-colors ${isActive("/about") ? "text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
            onClick={() => setMenuOpen(false)}
          >
            About
          </Link>
          <Link
            href="/contact"
            className={`text-xs tracking-[0.2em] uppercase transition-colors ${isActive("/contact") ? "text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
            onClick={() => setMenuOpen(false)}
          >
            Contact
          </Link>
        </div>
      )}
    </nav>
  );
}
