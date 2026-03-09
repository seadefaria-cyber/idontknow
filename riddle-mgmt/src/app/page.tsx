import Image from "next/image";
import Link from "next/link";
import SwipeNav from "@/components/SwipeNav";
import { brand } from "@/lib/brand";

export default function Home() {
  return (
    <SwipeNav leftTo={{ path: "/about", label: "About" }} rightTo={{ path: "/contact", label: "Contact" }}>
    <div className="min-h-screen flex flex-col items-center justify-center relative">
      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 sm:px-8 max-w-2xl">
        {/* Logo */}
        <div className="animate-fade-in-slow w-[180px] sm:w-[260px] logo-shine">
          <Image
            src="/logo-r.png"
            alt={brand.name}
            width={800}
            height={176}
            priority
            className="w-full h-auto"
          />
        </div>

        {/* Tagline */}
        <p className="mt-8 sm:mt-10 text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.25em] uppercase text-gray-400 font-light animate-fade-in delay-300">
          Artist Management
        </p>

        {/* Divider */}
        <div className="w-8 h-px bg-gray-200 mt-8 mb-8 animate-fade-in delay-400" />

        {/* Client Portal CTA — centered */}
        <div className="animate-fade-in delay-500">
          <Link
            href="/portal"
            className="text-xs tracking-[0.2em] uppercase text-gray-500 hover:text-gray-900 transition-all duration-300 link-underline"
          >
            Client Portal
          </Link>
        </div>
      </div>

      {/* Bottom credit */}
      <div className="absolute bottom-8 text-center animate-fade-in delay-700">
        <p className="text-[10px] tracking-[0.3em] uppercase text-gray-300 font-light">
          {brand.location}
        </p>
      </div>
    </div>
    </SwipeNav>
  );
}
