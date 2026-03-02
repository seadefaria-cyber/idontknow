import Link from "next/link";

const credits = [
  { artist: "Nettspend", project: "Artist Management" },
];

export default function About() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center sm:justify-start pt-16 sm:pt-32 pb-20 px-5 sm:px-8">
      <div className="max-w-xl w-full">
        {/* Header */}
        <h1 className="text-2xl font-light tracking-tight animate-fade-in">
          About
        </h1>
        <div className="w-8 h-px bg-white/10 mt-4 mb-10 animate-fade-in delay-100" />

        {/* Bio */}
        <div className="space-y-6 text-sm leading-relaxed text-white/60 font-light">
          <p className="animate-fade-in delay-200">
            Riddle Management is a Los Angeles-based artist management
            company founded by Nolan Riddle.
          </p>
          <p className="animate-fade-in delay-300">
            With a background spanning directing, producing, and creative strategy,
            Nolan has built a track record working alongside some of the most influential
            names in music.
          </p>
          <p className="animate-fade-in delay-400">
            Riddle Management operates at the intersection of artist development,
            and strategic career building. The approach is simple:
            identify exceptional talent, provide the infrastructure and vision they need,
            and execute at the highest level.
          </p>
        </div>

        {/* Selected Credits */}
        <div className="mt-16">
          <h2 className="text-xs tracking-[0.2em] uppercase text-white/30 mb-6 animate-fade-in delay-400">
            Selected Credits
          </h2>
          <div className="space-y-4">
            {credits.map((credit, i) => (
              <div
                key={i}
                className={`flex flex-col sm:flex-row sm:justify-between sm:items-baseline border-b border-white/5 pb-3 gap-0.5 sm:gap-4 animate-fade-in`}
                style={{ animationDelay: `${0.4 + i * 0.1}s`, opacity: 0 }}
              >
                <span className="text-sm text-white/80 font-light">{credit.artist}</span>
                <span className="text-xs text-white/30">{credit.project}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="mt-16 animate-fade-in delay-700">
          <Link
            href="/contact"
            className="text-xs tracking-[0.2em] uppercase text-white/40 hover:text-white transition-all duration-300 link-underline"
          >
            Work with us &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
