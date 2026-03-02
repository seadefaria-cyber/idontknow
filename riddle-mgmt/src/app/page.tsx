import Image from "next/image";
import Link from "next/link";
import SwipeableHome from "@/components/SwipeableHome";

export default function Home() {
  return (
    <SwipeableHome>
    <div className="min-h-screen flex flex-col items-center justify-center relative">
      {/* Subtle radial gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.02)_0%,_transparent_70%)]" />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 sm:px-8 max-w-2xl">
        {/* Logo */}
        <div className="animate-fade-in-slow w-[220px] sm:w-[320px]">
          <Image
            src="/logo.png"
            alt="Riddle MGMT LLC"
            width={320}
            height={76}
            priority
            className="opacity-80 w-full h-auto"
          />
        </div>

        {/* Tagline */}
        <p className="mt-8 sm:mt-10 text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.25em] uppercase text-white/40 font-light animate-fade-in delay-300">
          Artist Management
        </p>

        {/* Divider */}
        <div className="w-8 h-px bg-white/10 mt-8 mb-8 animate-fade-in delay-400" />

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-6 animate-fade-in delay-500">
          <Link
            href="/contact"
            className="text-xs tracking-[0.2em] uppercase text-white/50 hover:text-white transition-all duration-300 link-underline"
          >
            Get in Touch
          </Link>
          <span className="hidden sm:block text-white/10">|</span>
          <Link
            href="/about"
            className="text-xs tracking-[0.2em] uppercase text-white/50 hover:text-white transition-all duration-300 link-underline"
          >
            Learn More
          </Link>
        </div>
      </div>

      {/* Bottom credit */}
      <div className="absolute bottom-8 text-center animate-fade-in delay-700">
        <p className="text-[10px] tracking-[0.3em] uppercase text-white/15 font-light">
          Los Angeles · New York City
        </p>
      </div>
    </div>
    </SwipeableHome>
  );
}
