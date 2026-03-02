"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Nav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 sm:px-8 md:px-16 py-5 sm:py-6 bg-black/80 backdrop-blur-sm">
      {/* Left: hamburger on mobile, About on desktop */}
      <div className="flex items-center gap-8 min-w-[80px]">
        {/* Hamburger — mobile only */}
        <button
          className="sm:hidden opacity-50 hover:opacity-100 transition-opacity"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
            {menuOpen ? (
              <path d="M1 1L17 11M1 11L17 1" stroke="white" strokeWidth="1.5" />
            ) : (
              <>
                <line x1="0" y1="0.5" x2="18" y2="0.5" stroke="white" strokeWidth="1" />
                <line x1="0" y1="6" x2="18" y2="6" stroke="white" strokeWidth="1" />
                <line x1="0" y1="11.5" x2="18" y2="11.5" stroke="white" strokeWidth="1" />
              </>
            )}
          </svg>
        </button>

        {/* About — desktop only */}
        <Link
          href="/about"
          className={`text-xs tracking-[0.2em] uppercase transition-opacity duration-300 glow-hover hidden sm:block ${
            isActive("/about") ? "opacity-100" : "opacity-50 hover:opacity-100"
          }`}
        >
          About
        </Link>
      </div>

      {/* Center: Logo text */}
      <Link href="/" className="absolute left-1/2 -translate-x-1/2">
        <span className="text-[10px] sm:text-xs tracking-[0.25em] sm:tracking-[0.3em] uppercase font-light opacity-60 hover:opacity-100 transition-opacity duration-300">
          Riddle Mgmt
        </span>
      </Link>

      {/* Right: Portal + Contact */}
      <div className="flex items-center gap-4 sm:gap-8">
        <Link
          href="/contact"
          className={`text-xs tracking-[0.2em] uppercase transition-opacity duration-300 glow-hover hidden sm:block ${
            isActive("/contact") ? "opacity-100" : "opacity-50 hover:opacity-100"
          }`}
        >
          Contact
        </Link>
        <Link
          href="/portal"
          className="text-[10px] sm:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase glass rounded-full px-3 sm:px-5 py-1.5 sm:py-2 opacity-70 hover:opacity-100 transition-all duration-300"
        >
          <span className="hidden sm:inline">Client Portal</span>
          <span className="sm:hidden">Portal</span>
        </Link>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="absolute top-14 left-5 glass rounded-lg p-4 flex flex-col gap-4 sm:hidden animate-fade-in">
          <Link
            href="/about"
            className={`text-xs tracking-[0.2em] uppercase transition-opacity ${isActive("/about") ? "opacity-100" : "opacity-60 hover:opacity-100"}`}
            onClick={() => setMenuOpen(false)}
          >
            About
          </Link>
          <Link
            href="/contact"
            className={`text-xs tracking-[0.2em] uppercase transition-opacity ${isActive("/contact") ? "opacity-100" : "opacity-60 hover:opacity-100"}`}
            onClick={() => setMenuOpen(false)}
          >
            Contact
          </Link>
        </div>
      )}
    </nav>
  );
}
